/**
 * Re-verification deadline.
 *
 * Some accounts were approved from the admin dashboard with no selfie on
 * file. Rather than lock them out the day that is cleaned up, the repair
 * script gives each a `reverify_by` date. This module tells the user when
 * the date is set and ends their approval once it passes without a selfie.
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendPush } from "./push";

const db = () => admin.firestore();

async function notify(uid: string, title: string, body: string): Promise<void> {
  await db().collection("users").doc(uid).collection("notifications").add({
    type: "verification",
    title,
    body,
    seen: false,
    timestamp: Timestamp.now(),
  });
  await sendPush(uid, title, body, { type: "verification" });
}

/** A deadline was just set: tell the user what is needed and by when. */
export const notifyOnReverificationRequired = onDocumentUpdated("users/{uid}", async (event) => {
  const before = event.data?.before.get("reverify_by") as Timestamp | undefined;
  const after = event.data?.after.get("reverify_by") as Timestamp | undefined;
  if (before || !after) return;

  const by = after.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  await notify(
    event.params.uid,
    "Verify your photo",
    `Take a quick selfie by ${by} to keep liking and messaging on Whossy.`
  );
});

export const enforceReverification = onSchedule("every 24 hours", async () => {
  const due = await db().collection("users").where("reverify_by", "<=", Timestamp.now()).limit(300).get();

  for (const doc of due.docs) {
    const status = doc.get("face_verification.status") as string | undefined;

    // A selfie has been submitted or already cleared: the deadline has done
    // its job and the normal review flow takes it from here.
    if (status === "pending_review" || status === "approved") {
      await doc.ref.update({ reverify_by: FieldValue.delete() });
      continue;
    }

    await doc.ref.update({
      is_approved: false,
      "face_verification.status": "revoked",
      reverify_by: FieldValue.delete(),
    });
    await notify(
      doc.id,
      "Verification needed",
      "Take a selfie to start liking and messaging again."
    );
    logger.info(`enforceReverification: approval ended for ${doc.id}`);
  }
});
