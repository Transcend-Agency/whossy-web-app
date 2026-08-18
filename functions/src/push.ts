/**
 * Push delivery (pre-launch plan B1/B2).
 *
 * B1's actual bug: the client (mobile — web has no push client at all) has
 * always written device tokens to `users/{uid}.tokens` (an array — a user
 * can have more than one device), but this used to read `fcm_token` (a
 * singular field nothing ever wrote). Every send silently no-opped. Fixed
 * here on the read side, which needs no client-side change on either app.
 */

import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Lazy — see the comment in verification.ts. Cross-module admin.firestore()
// calls at module load time can run before index.ts's admin.initializeApp().
// FieldValue is imported directly rather than via admin.firestore.FieldValue
// — that namespaced static isn't reliably populated yet in a module loaded
// before index.ts's admin.initializeApp() runs (confirmed via the emulator).
const db = () => admin.firestore();

const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

/**
 * Best-effort push to every device token on file for `uid`. No-op when the
 * user has none. Tokens the delivery service reports as dead are pruned from
 * `users/{uid}.tokens` in the same call, so they don't accumulate forever.
 */
export async function sendPush(
  uid: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const userRef = db().collection("users").doc(uid);
    const userSnap = await userRef.get();
    const tokens = ((userSnap.get("tokens") as string[] | null) ?? []).filter(Boolean);
    if (tokens.length === 0) return;

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data ?? {},
    });

    const deadTokens = response.responses
      .map((r, i) => (!r.success && DEAD_TOKEN_CODES.has(r.error?.code ?? "") ? tokens[i] : null))
      .filter((t): t is string => t !== null);

    if (deadTokens.length > 0) {
      await userRef.update({
        tokens: FieldValue.arrayRemove(...deadTokens),
      });
      logger.info(`sendPush: pruned ${deadTokens.length} dead token(s) for ${uid}`);
    }
  } catch (err) {
    logger.warn(`Push to ${uid} failed (non-fatal)`, err);
  }
}
