/**
 * Whossy Cloud Functions — Verification review endpoint (pre-launch plan A5).
 *
 * Retool has no Firebase Auth identity of its own (see plan §0.3), so this is
 * a plain HTTPS endpoint guarded by a shared secret rather than an `onCall`.
 * Point Retool's Approve/Reject actions at this URL instead of writing
 * `face_verification`/`is_approved` on the user doc directly — that direct
 * path is what A6's rules lock down, and it's also how a stale review (the
 * user changed their main photo after submitting, before a reviewer looked)
 * could grant a badge against a photo nobody actually checked.
 *
 * Wire-up (do this before A6 rules ship, or Retool's writes just start
 * failing): set the secret —
 *   firebase functions:secrets:set VERIFICATION_REVIEW_SECRET
 * — then configure Retool's REST API resource with header
 *   Authorization: Bearer <that secret>
 * and point Approve/Reject buttons at POST /reviewVerification.
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Not called at module scope: `index.ts`'s `admin.initializeApp()` runs after
// this module's imports are resolved (imports hoist above it in the compiled
// output), so `admin.firestore()` isn't safe to call here until a request
// actually comes in.
const db = () => admin.firestore();

const VERIFICATION_REVIEW_SECRET = defineSecret("VERIFICATION_REVIEW_SECRET");

type ReviewDecision = "approved" | "rejected";

interface ReviewRequestBody {
  uid?: string;
  decision?: ReviewDecision;
  rejectionReason?: string;
  reviewerId?: string;
}

export const reviewVerification = onRequest(
  { secrets: [VERIFICATION_REVIEW_SECRET], cors: false },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const authHeader = req.get("Authorization") ?? "";
    const expected = `Bearer ${VERIFICATION_REVIEW_SECRET.value()}`;
    if (authHeader !== expected) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const body = req.body as ReviewRequestBody;
    const { uid, decision, rejectionReason, reviewerId } = body ?? {};

    if (typeof uid !== "string" || !uid) {
      res.status(400).json({ error: "INVALID_ARGUMENT", message: "uid is required." });
      return;
    }
    if (decision !== "approved" && decision !== "rejected") {
      res.status(400).json({ error: "INVALID_ARGUMENT", message: "decision must be 'approved' or 'rejected'." });
      return;
    }
    if (decision === "rejected" && !rejectionReason?.trim()) {
      res.status(400).json({ error: "INVALID_ARGUMENT", message: "rejectionReason is required to reject." });
      return;
    }

    const userRef = db().collection("users").doc(uid);

    try {
      const result = await db().runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists) return { outcome: "NOT_FOUND" as const };

        const user = snap.data() ?? {};
        const fv = (user.face_verification ?? {}) as Record<string, unknown>;

        if (fv.status !== "pending_review") {
          // Already reviewed, revoked since, or never submitted — nothing to
          // do. Prevents double-processing a decision (e.g. a Retool retry).
          return { outcome: "NOT_PENDING" as const, currentStatus: fv.status };
        }

        const now = Timestamp.now();
        const currentMainPhoto = ((user.photos as string[] | undefined) ?? [])[0] ?? null;
        const submittedAgainst = (fv.profile_photo_snapshot as string | null | undefined) ?? null;
        const photoChangedSinceSubmission = submittedAgainst !== null && submittedAgainst !== currentMainPhoto;

        if (decision === "approved" && photoChangedSinceSubmission) {
          // The main photo moved after this selfie was submitted (A4 should
          // already have flipped this to 'revoked' client-side — this is the
          // server-side backstop for the race where it didn't). Refuse to
          // grant a badge against a photo nobody actually reviewed.
          tx.set(userRef, {
            is_approved: false,
            face_verification: { ...fv, status: "revoked" },
          }, { merge: true });
          return { outcome: "PHOTO_CHANGED" as const };
        }

        if (decision === "approved") {
          tx.set(userRef, {
            is_approved: true,
            face_verification: {
              ...fv,
              status: "approved",
              retake_photo: false,
              rejection_reason: null,
              reviewed_by: reviewerId ?? null,
              reviewed_at: now,
            },
          }, { merge: true });
          return { outcome: "APPROVED" as const };
        }

        tx.set(userRef, {
          is_approved: false,
          face_verification: {
            ...fv,
            status: "rejected",
            retake_photo: true,
            rejection_reason: rejectionReason?.trim(),
            reviewed_by: reviewerId ?? null,
            reviewed_at: now,
          },
        }, { merge: true });
        return { outcome: "REJECTED" as const };
      });

      switch (result.outcome) {
        case "NOT_FOUND":
          res.status(404).json({ error: "USER_NOT_FOUND" });
          return;
        case "NOT_PENDING":
          res.status(409).json({ error: "NOT_PENDING", currentStatus: result.currentStatus ?? null });
          return;
        case "PHOTO_CHANGED":
          res.status(409).json({
            error: "PHOTO_CHANGED_SINCE_SUBMISSION",
            message: "Main photo changed after submission — marked revoked instead of approved.",
          });
          return;
        default:
          logger.info(`reviewVerification: ${uid} → ${result.outcome} by ${reviewerId ?? "unknown"}`);
          res.status(200).json({ ok: true, status: result.outcome });
      }
    } catch (err) {
      logger.error(`reviewVerification failed for ${uid}`, err);
      res.status(500).json({ error: "INTERNAL" });
    }
  }
);
