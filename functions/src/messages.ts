/**
 * Mobile writes a message as `undelivered` when it is composed offline, and
 * the message only reaches Firestore once the device reconnects. This marks
 * it `sent` at that point, on the message and on the chat's last-message
 * status. Clients cannot make this change themselves: only a recipient may
 * touch a message's status.
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = () => admin.firestore();

export const markMessageSent = onDocumentWritten(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists || after.get("status") !== "undelivered") return;

    await after.ref.update({ status: "sent" });

    const chatRef = db().collection("chats").doc(event.params.chatId);
    const chat = await chatRef.get();
    if (
      chat.exists &&
      chat.get("last_message_id") === event.params.messageId &&
      chat.get("status") === "undelivered"
    ) {
      await chatRef.update({ status: "sent" });
    }
  }
);
