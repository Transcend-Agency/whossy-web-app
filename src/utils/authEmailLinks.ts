import type { ActionCodeSettings } from "firebase/auth";

// Where the button in a Firebase auth email (password reset, email
// verification) brings people back to. Built from the address the page is
// served from, so a build made with the local .env still links to the real
// site, never to localhost.
export const authContinueUrl = (path: string, origin = window.location.origin) => `${origin}${path}`;

// Firebase refuses a continue URL whose domain is not on the project's
// authorized domains list (Authentication > Settings).
const CONTINUE_URL_REFUSED = ["auth/unauthorized-continue-uri", "auth/invalid-continue-uri"];

const errorCode = (err: unknown) =>
  err && typeof err === "object" && "code" in err ? String(err.code) : "";

/**
 * Sends an auth email that returns the reader to `path` on this site. If
 * Firebase refuses this site as a continue URL, the email is sent without
 * one: it still works, the reader just finishes on Firebase's own page
 * instead of being brought back here.
 */
export async function sendWithContinueUrl<T>(
  send: (settings?: ActionCodeSettings) => Promise<T>,
  path: string,
  origin?: string
): Promise<T> {
  try {
    return await send({ url: authContinueUrl(path, origin) });
  } catch (err) {
    if (!CONTINUE_URL_REFUSED.includes(errorCode(err))) throw err;
    return send(undefined);
  }
}
