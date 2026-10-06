#!/usr/bin/env node
// One-off repair of live data ahead of the security-rules deploy (plan
// section 5). Each step fixes a shape the 2026-10-04 audit found in the
// whossy-app project and that the new rules or functions cannot live with.
//
//   node scripts/data-repair.cjs                 dry run: prints what would change
//   node scripts/data-repair.cjs --apply         makes the changes
//   node scripts/data-repair.cjs --only=defaults,legacyApproval
//
// It is safe to run twice: every step looks for the broken shape and does
// nothing where it is already fixed. No balance is ever lowered and nothing
// a user typed is deleted; values that are moved are kept under a _legacy key
// or in users/{uid}/private.
//
// Against the emulator it needs only FIRESTORE_EMULATOR_HOST. Against the
// real project it needs GOOGLE_APPLICATION_CREDENTIALS and, with --apply,
// --confirm-project=<project id> so it cannot be pointed at production by
// accident.

const admin = require("../functions/node_modules/firebase-admin");
const { FieldValue } = admin.firestore;

const SERVER_DEFAULTS = { is_banned: false, is_premium: false, credit_balance: 0, credits_on_hold: 0 };
const PAIR_ID = /^[^_/]+_[^_/]+$/;

function parseArgs(argv) {
  const flag = (name) => argv.includes(`--${name}`);
  const value = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  return { apply: flag("apply"), only: value("only")?.split(","), confirmProject: value("confirm-project") };
}

/**
 * Every step returns the changes it wants as
 *   { step, path, reason, write: (batch) => void }
 * so the dry run and the real run share one code path and the log is the
 * same list either way.
 */
const STEPS = {
  // Accounts created by older builds lack these. Functions and Retool treat
  // "missing" and "zero" differently in places; this makes them the same.
  async defaults(db) {
    const changes = [];
    for (const doc of (await db.collection("users").get()).docs) {
      const missing = Object.fromEntries(Object.entries(SERVER_DEFAULTS).filter(([key]) => !(key in doc.data())));
      if (Object.keys(missing).length === 0) continue;
      changes.push({
        path: doc.ref.path,
        reason: `add missing ${Object.keys(missing).join(", ")}`,
        write: (batch) => batch.update(doc.ref, missing),
      });
    }
    return changes;
  },

  // Decision D4: accounts approved from the admin dashboard with no reviewed
  // selfie on record must verify again. 'revoked' is the status both apps
  // already show as "re-verification needed"; without a status, web reads a
  // stored selfie as approved.
  async legacyApproval(db) {
    const changes = [];
    for (const doc of (await db.collection("users").where("is_approved", "==", true).get()).docs) {
      const fv = doc.get("face_verification");
      if (fv?.status === "approved") continue;
      const update = { is_approved: false };
      if (fv && typeof fv === "object") update["face_verification.status"] = "revoked";
      changes.push({
        path: doc.ref.path,
        reason: "approved with no reviewed selfie: reset to require verification",
        write: (batch) => batch.update(doc.ref, update),
      });
    }
    return changes;
  },

  // Two documents hold a bare string or number here. The payment functions
  // increment amount_paid_in_total.<currency>, which fails on a non-map.
  async amountPaidShape(db) {
    const changes = [];
    for (const doc of (await db.collection("users").get()).docs) {
      const value = doc.get("amount_paid_in_total");
      if (value === undefined || (value !== null && typeof value === "object")) continue;
      changes.push({
        path: doc.ref.path,
        reason: `amount_paid_in_total is a ${value === null ? "null" : typeof value}: reset to a map, original kept`,
        write: (batch) => batch.update(doc.ref, {
          amount_paid_in_total: { naira: 0, kenyan_shillings: 0 },
          amount_paid_in_total_legacy: value,
        }),
      });
    }
    return changes;
  },

  // The old webhook stored whole Paystack payloads (card authorisation
  // included) on the user document, which every signed-in user can read.
  async paystackPayloads(db) {
    const changes = [];
    for (const doc of (await db.collection("users").get()).docs) {
      const paystack = doc.get("paystack");
      if (!paystack || typeof paystack !== "object") continue;
      const sensitive = Object.fromEntries(
        Object.entries(paystack).filter(([key]) => key === "charge_success" || key === "subscription_create")
      );
      if (Object.keys(sensitive).length === 0) continue;
      const removal = Object.fromEntries(Object.keys(sensitive).map((key) => [`paystack.${key}`, FieldValue.delete()]));
      changes.push({
        path: doc.ref.path,
        reason: `move raw Paystack payload (${Object.keys(sensitive).join(", ")}) off the readable profile`,
        write: (batch) => {
          batch.set(doc.ref.collection("private").doc("billing_legacy"), sensitive, { merge: true });
          batch.update(doc.ref, removal);
        },
      });
    }
    return changes;
  },

  // A camelCase flag one document picked up from the old premium job. The
  // apps read is_premium; this one is now a server-only key in the rules.
  async strayPremiumFlag(db) {
    const docs = (await db.collection("users").get()).docs.filter((doc) => "isPremium" in doc.data());
    return docs.map((doc) => ({
      path: doc.ref.path,
      reason: "remove stray isPremium field",
      write: (batch) => batch.update(doc.ref, { isPremium: FieldValue.delete() }),
    }));
  },

  // Likes and dislikes with no target, or an id that is not <from>_<to>.
  // They cannot be shown, matched or counted, and the new rules could not
  // have created them.
  async malformedReactions(db) {
    const changes = [];
    for (const [collection, from, to] of [["likes", "liker_id", "liked_id"], ["dislikes", "disliker_id", "disliked_id"]]) {
      for (const doc of (await db.collection(collection).get()).docs) {
        const a = doc.get(from);
        const b = doc.get(to);
        if (typeof a === "string" && typeof b === "string" && doc.id === `${a}_${b}`) continue;
        changes.push({
          path: doc.ref.path,
          reason: typeof b !== "string" ? `no ${to}` : `id does not match ${from}_${to}`,
          write: (batch) => batch.delete(doc.ref),
        });
      }
    }
    return changes;
  },

  // The chat list query filters on participants; a chat without it is
  // invisible to both people. The id is the two uids, so it can be rebuilt.
  async chatParticipants(db) {
    const changes = [];
    for (const doc of (await db.collection("chats").get()).docs) {
      if (Array.isArray(doc.get("participants")) || !PAIR_ID.test(doc.id)) continue;
      const participants = doc.id.split("_").sort();
      changes.push({
        path: doc.ref.path,
        reason: "rebuild missing participants from the chat id",
        write: (batch) => batch.update(doc.ref, { participants }),
      });
    }
    return changes;
  },

  // Left behind by the old photo clean-up function, which did not clear its
  // queue when there was nothing to delete. A leftover entry stops the
  // clean-up ever firing again for that user.
  async stalePhotoQueue(db) {
    return (await db.collection("deletePicQueue").get()).docs.map((doc) => ({
      path: doc.ref.path,
      reason: "clear stale photo clean-up request",
      write: (batch) => batch.delete(doc.ref),
    }));
  },
};

/** Things a person has to decide. Listed, never changed. */
async function report(db) {
  const users = (await db.collection("users").get()).docs;
  const lines = [];
  const add = (kind, docs, note) => docs.length && lines.push({ kind, count: docs.length, ids: docs.map((d) => d.id), note });

  add("premium_without_expiry", users.filter((d) => d.get("is_premium") === true && !d.get("premium_expires_at")),
    "Stays premium indefinitely: expirePremium only ends premium that has an expiry. Decide per account.");
  add("onboarded_short_of_photos", users.filter((d) => d.get("has_completed_onboarding") === true && (d.get("photos") ?? []).length < 2),
    "Will see the add-photos screen on next open.");
  add("profile_without_uid_field", users.filter((d) => d.get("uid") !== d.id),
    "Not matched by the apps' own-profile lookups. Probably a test document.");
  add("chat_with_unusable_id", (await db.collection("chats").get()).docs.filter((d) => !Array.isArray(d.get("participants")) && !PAIR_ID.test(d.id)),
    "Cannot be repaired from its id.");
  add("userchats_collection", (await db.collection("userchats").get()).docs, "No code reads or writes this collection.");
  return lines;
}

async function run(db, { apply = false, only } = {}, log = console.log) {
  const summary = {};
  for (const [step, plan] of Object.entries(STEPS)) {
    if (only && !only.includes(step)) continue;
    const changes = await plan(db);
    summary[step] = changes.length;
    for (const change of changes) log(JSON.stringify({ step, applied: apply, path: change.path, reason: change.reason }));

    if (!apply) continue;
    // Batches of 200: a change can carry two writes and the limit is 500.
    for (let i = 0; i < changes.length; i += 200) {
      const batch = db.batch();
      changes.slice(i, i + 200).forEach((change) => change.write(batch));
      await batch.commit();
    }
  }
  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const app = admin.initializeApp();
  const projectId = app.options.projectId ?? process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
  const emulated = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (args.apply && !emulated && args.confirmProject !== projectId) {
    console.error(`Refusing to change a real project without --confirm-project=${projectId ?? "<project id>"}.`);
    process.exit(2);
  }

  const db = admin.firestore();
  console.error(`${args.apply ? "APPLYING to" : "Dry run against"} ${emulated ? "the emulator" : projectId}`);
  const summary = await run(db, args);
  console.error("\nChanges per step:", summary);
  console.error("\nNeeds a decision (not changed):");
  for (const line of await report(db)) console.error(" ", JSON.stringify(line));
  await app.delete();
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run, report, STEPS };
