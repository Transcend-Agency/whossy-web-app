/**
 * Whossy Cloud Functions — admin alert for new members.
 *
 * Emails support@whossy.com once per member, when their profile is complete
 * (users/{uid}.has_completed_onboarding goes from not-true to true). That is
 * the point a person is really a member: an account created and abandoned
 * halfway through sign-up sends nothing.
 *
 * It reuses the contact form's mailer (mail.whossy.com as the support
 * mailbox, the SMTP_PASSWORD secret — see contact.ts), so it needs no extra
 * setup beyond that secret.
 *
 * The email carries no phone number, email address or birth date: first and
 * last name, gender, country, how they signed in, and the uid to look them up.
 *
 * Each member gets one signupNotifications/{uid} record (status + time, no
 * personal data) that claims the alert, so a re-delivered trigger or a later
 * false → true flip (re-verification resets the flag) never emails twice.
 * Failures are recorded there too. Emails stop after DAILY_SIGNUP_EMAIL_CAP a
 * day; later members are still recorded, just not emailed. Clients cannot
 * read or write these collections (no rule matches them).
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { SMTP_PASSWORD, SUPPORT_EMAIL, escapeHtml, headerSafe, smtpMailer, type ContactEmail, type Mailer } from "./contact";

export const DAILY_SIGNUP_EMAIL_CAP = 200;

// Lazy — see the comment in verification.ts.
const db = () => admin.firestore();

type Data = Record<string, unknown> | undefined;

/** True only on the write that finishes the profile. */
export function justCompletedOnboarding(before: Data, after: Data): boolean {
  return after?.has_completed_onboarding === true && before?.has_completed_onboarding !== true;
}

export function buildSignupEmail(uid: string, data: NonNullable<Data>): ContactEmail {
  const clean = (v: unknown, max: number) => headerSafe(String(v ?? ""), max);
  const first = clean(data.first_name, 60);
  const last = clean(data.last_name, 60);
  const name = [first, last].filter(Boolean).join(" ") || "A new member";
  const gender = clean(data.gender, 30) || "not set";
  const country = clean(data.country_of_origin, 60) || "not set";
  const provider = clean(data.auth_provider, 30) || "unknown";
  const joined = data.created_at instanceof Timestamp ? data.created_at.toDate() : undefined;
  const joinedText = joined ? joined.toUTCString() : "unknown";

  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Gender", gender],
    ["Country", country],
    ["Signed in with", provider],
    ["Account created", joinedText],
    ["User id", uid],
  ];

  const text = [`New member on Whossy`, ``, ...rows.map(([k, v]) => `${k}: ${v}`), ``, `--`, `Find them in the Firebase console under users/${uid}.`].join("\n");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p style="margin:0 0 16px;color:#8A8A8E">New member on Whossy</p>
<table style="border-collapse:collapse;margin-bottom:16px">
${rows.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#8A8A8E">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("\n")}
</table>
<p style="margin:16px 0 0;font-size:13px;color:#8A8A8E">Find them in the Firebase console under users/${escapeHtml(uid)}.</p>
</div>`;

  return { subject: `New Whossy member: ${clean(name, 80)}`, text, html };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Claims the member for notification (once, even if the trigger fires twice),
 * checks the daily cap, sends, and records the outcome. Exported for the
 * emulator tests, which pass a fake mailer.
 */
export async function notifySignup(uid: string, data: NonNullable<Data>, send: Mailer, now = new Date()): Promise<string> {
  const ref = db().collection("signupNotifications").doc(uid);
  const statsRef = db().collection("signupNotificationStats").doc(dayKey(now));

  const claim = await db().runTransaction(async (tx) => {
    const [snap, stats] = await Promise.all([tx.get(ref), tx.get(statsRef)]);
    if (snap.exists) return "duplicate" as const;

    const emailed = (stats.get("emailed") as number | undefined) ?? 0;
    if (emailed >= DAILY_SIGNUP_EMAIL_CAP) {
      tx.set(ref, { status: "skipped", reason: "daily_cap", at: FieldValue.serverTimestamp() });
      return "capped" as const;
    }
    tx.set(statsRef, { emailed: FieldValue.increment(1) }, { merge: true });
    tx.set(ref, { status: "sending", at: FieldValue.serverTimestamp() });
    return "send" as const;
  });

  if (claim !== "send") {
    if (claim === "capped") logger.warn("signup: daily email cap reached, member recorded only", { uid });
    return claim;
  }

  try {
    await send(buildSignupEmail(uid, data));
    await ref.set({ status: "sent", to: SUPPORT_EMAIL, at: FieldValue.serverTimestamp() });
    return "sent";
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error("signup: admin email failed", { uid, error });
    await ref.set({ status: "failed", error: error.slice(0, 500), at: FieldValue.serverTimestamp() });
    return "failed";
  }
}

export const notifyAdminOnSignup = onDocumentWritten({ document: "users/{uid}", secrets: [SMTP_PASSWORD] }, async (event) => {
  const after = event.data?.after.data();
  if (!after || !justCompletedOnboarding(event.data?.before.data(), after)) return;
  // Deployed, the secret is always set. Without it (the local emulators) there
  // is nothing to log in with, so do not claim the member or touch the network.
  const password = SMTP_PASSWORD.value();
  if (!password) {
    logger.warn("signup: SMTP_PASSWORD is not set, admin email skipped", { uid: event.params.uid });
    return;
  }
  await notifySignup(event.params.uid, after, smtpMailer(password, "Whossy sign-ups"));
});
