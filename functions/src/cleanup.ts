/** Storage housekeeping for profile photos and verification selfies. */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = () => admin.firestore();

function fileNameFromDownloadUrl(url: string): string {
  return decodeURIComponent(url).split("/").pop()?.split("?")[0] ?? "";
}

/**
 * Both apps create deletePicQueue/{uid} after saving a profile's photos.
 * Anything in the user's profile_pictures folder that the profile no longer
 * lists is removed.
 */
export const cleanUpProfilePictures = onDocumentCreated("deletePicQueue/{userId}", async (event) => {
  const uid = event.params.userId;
  const queueRef = db().collection("deletePicQueue").doc(uid);

  try {
    const user = await db().collection("users").doc(uid).get();
    if (user.exists) {
      const keep = new Set(((user.get("photos") as string[] | undefined) ?? []).map(fileNameFromDownloadUrl));
      const prefix = `users/${uid}/profile_pictures/`;
      const [files] = await admin.storage().bucket().getFiles({ prefix });
      const stale = files.filter((file) => !keep.has(file.name.slice(prefix.length)));
      await Promise.all(stale.map((file) => file.delete()));
      if (stale.length > 0) logger.info(`cleanUpProfilePictures: removed ${stale.length} file(s) for ${uid}`);
    }
  } catch (err) {
    logger.error(`cleanUpProfilePictures: failed for ${uid}`, err);
  } finally {
    // Always cleared. A queue doc left behind makes the next request an
    // update, which this trigger never sees, so clean-up would stop for
    // that user for good.
    await queueRef.delete();
  }
});

/** Keeps only the newest verification selfie; older ones are biometric data with no further use. */
export const cleanUpFaceVerification = onObjectFinalized(async (event) => {
  const match = event.data.name.match(/^users\/([^/]+)\/face_verification\//);
  if (!match) return;
  const uid = match[1];

  try {
    const bucket = admin.storage().bucket(event.data.bucket);
    const [files] = await bucket.getFiles({ prefix: `users/${uid}/face_verification/` });
    if (files.length <= 1) return;

    const created = (file: (typeof files)[number]) => Date.parse(String(file.metadata.timeCreated ?? "")) || 0;
    const [, ...older] = [...files].sort((a, b) => created(b) - created(a));
    await Promise.all(older.map((file) => file.delete()));
  } catch (err) {
    logger.error(`cleanUpFaceVerification: failed for ${uid}`, err);
  }
});
