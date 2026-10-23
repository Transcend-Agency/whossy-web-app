import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import type { ContactForm } from "./contactForm";

// Offline, Firestore queues the write and the promise never settles, which
// would leave the form spinning. Past this the sender is told it failed.
const SEND_TIMEOUT_MS = 15_000;

// Drops the message into the contactMessages mailbox, which only the server
// and the admin tools can read.
export const sendContactMessage = async (form: ContactForm) => {
  const write = addDoc(collection(db, "contactMessages"), {
    name: form.name.trim(),
    email: form.email.trim(),
    message: form.message.trim(),
    createdAt: serverTimestamp(),
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out sending the contact message.")), SEND_TIMEOUT_MS);
  });
  try {
    await Promise.race([write, timeout]);
  } finally {
    clearTimeout(timer);
  }
};
