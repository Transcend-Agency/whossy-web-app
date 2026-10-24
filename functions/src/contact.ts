/**
 * Whossy Cloud Functions — contact form notifications.
 *
 * The public site's contact form writes contactMessages/{id} (see the rule
 * in firestore.rules). This trigger emails each new message to support, with
 * Reply-To set to the sender so answering is one click.
 *
 * Mail goes out through the whossy.com mail server (cPanel/Exim at
 * mail.whossy.com, port 465, implicit TLS) logged in as the support mailbox.
 * Its password is the SMTP_PASSWORD secret:
 *   firebase functions:secrets:set SMTP_PASSWORD
 *
 * Each message records what happened in its own `notification` field
 * (sending / sent / failed / skipped), so a failure is visible next to the
 * message in the console. The form is open to anyone, so emails stop after
 * DAILY_EMAIL_CAP a day; later messages are still stored, just not emailed.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

export const SUPPORT_EMAIL = "support@whossy.com";
const SMTP_HOST = "mail.whossy.com";
const SMTP_PORT = 465;
export const DAILY_EMAIL_CAP = 200;

// Lazy — see the comment in verification.ts.
const db = () => admin.firestore();

export type ContactEmail = {
  subject: string;
  text: string;
  html: string;
  // Omitted when the sender's address is not a plain one we can trust in a
  // header; the message still arrives, with the address in the body.
  replyTo?: { name: string; address: string };
};
export type Mailer = (email: ContactEmail) => Promise<void>;

// Stricter than the rule's check on purpose: this address goes into a mail
// header, so anything beyond a plain local@domain.tld is left out of it.
const PLAIN_ADDRESS = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// One line, no control characters, bounded: safe for a subject or a name.
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const headerSafe = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

export function buildContactEmail(
  id: string,
  data: { name?: unknown; email?: unknown; message?: unknown; createdAt?: unknown }
): ContactEmail {
  const name = headerSafe(String(data.name ?? ""), 100) || "Someone";
  const email = String(data.email ?? "").trim();
  const message = String(data.message ?? "");
  const sentAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
  const when = sentAt.toUTCString();

  const replyTo = PLAIN_ADDRESS.test(email) ? { name, address: email } : undefined;
  const replyHint = replyTo ? "Reply to this email to answer them." : "Their address could not be used for Reply-To; copy it from above.";

  const text = [
    `New message from the whossy.com contact form`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Sent: ${when}`,
    ``,
    message,
    ``,
    `--`,
    replyHint,
    `Message id: ${id}`,
  ].join("\n");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p style="margin:0 0 16px;color:#8A8A8E">New message from the whossy.com contact form</p>
<table style="border-collapse:collapse;margin-bottom:16px">
<tr><td style="padding:2px 12px 2px 0;color:#8A8A8E">Name</td><td>${escapeHtml(name)}</td></tr>
<tr><td style="padding:2px 12px 2px 0;color:#8A8A8E">Email</td><td>${escapeHtml(email)}</td></tr>
<tr><td style="padding:2px 12px 2px 0;color:#8A8A8E">Sent</td><td>${escapeHtml(when)}</td></tr>
</table>
<div style="white-space:pre-wrap;padding:16px;background:#F6F6F6;border-radius:8px">${escapeHtml(message)}</div>
<p style="margin:16px 0 0;font-size:13px;color:#8A8A8E">${escapeHtml(replyHint)} Message id: ${escapeHtml(id)}</p>
</div>`;

  return { subject: `Contact form: ${headerSafe(name, 80)}`, text, html, replyTo };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Claims the message for notification (once, even if the trigger fires
 * twice), checks the daily cap, sends, and records the outcome on the
 * message. Exported for the emulator tests, which pass a fake mailer.
 */
export async function notifyContactMessage(ref: DocumentReference, send: Mailer, now = new Date()): Promise<string> {
  const statsRef = db().collection("contactMessageStats").doc(dayKey(now));

  const claim = await db().runTransaction(async (tx) => {
    const [snap, stats] = await Promise.all([tx.get(ref), tx.get(statsRef)]);
    if (!snap.exists) return { action: "gone" as const };
    if (snap.get("notification")) return { action: "duplicate" as const };

    const emailed = (stats.get("emailed") as number | undefined) ?? 0;
    if (emailed >= DAILY_EMAIL_CAP) {
      tx.update(ref, { notification: { status: "skipped", reason: "daily_cap", at: FieldValue.serverTimestamp() } });
      return { action: "capped" as const };
    }
    tx.set(statsRef, { emailed: FieldValue.increment(1) }, { merge: true });
    tx.update(ref, { notification: { status: "sending", at: FieldValue.serverTimestamp() } });
    return { action: "send" as const, data: snap.data() ?? {} };
  });

  if (claim.action !== "send") {
    if (claim.action === "capped") logger.warn("contact: daily email cap reached, message stored only", { id: ref.id });
    return claim.action;
  }

  try {
    await send(buildContactEmail(ref.id, claim.data));
    await ref.update({ notification: { status: "sent", to: SUPPORT_EMAIL, at: FieldValue.serverTimestamp() } });
    return "sent";
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error("contact: notification email failed", { id: ref.id, error });
    await ref.update({ notification: { status: "failed", error: error.slice(0, 500), at: FieldValue.serverTimestamp() } });
    return "failed";
  }
}

function smtpMailer(password: string): Mailer {
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: SUPPORT_EMAIL, pass: password },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return async (email) => {
    await transport.sendMail({
      from: { name: "Whossy contact form", address: SUPPORT_EMAIL },
      to: SUPPORT_EMAIL,
      replyTo: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  };
}

export const notifyOnContactMessage = onDocumentCreated(
  { document: "contactMessages/{messageId}", secrets: [SMTP_PASSWORD] },
  async (event) => {
    if (!event.data) return;
    await notifyContactMessage(event.data.ref, smtpMailer(SMTP_PASSWORD.value()));
  }
);
