// Limits mirrored by the contactMessages rule in firestore.rules. Change
// both together.
export const CONTACT_LIMITS = {
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 5000,
} as const;

export const SUPPORT_EMAIL = "support@whossy.com";

export type ContactForm = { name: string; email: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactForm, string>>;

// Same shape check as the rule: something@something.something, no spaces.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const validateContactForm = (form: ContactForm): ContactErrors => {
  const errors: ContactErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const message = form.message.trim();

  if (!name) errors.name = "Please enter your name.";
  else if (name.length > CONTACT_LIMITS.nameMax) errors.name = `Keep your name under ${CONTACT_LIMITS.nameMax} characters.`;

  if (!email) errors.email = "Please enter your email so we can reply.";
  else if (email.length > CONTACT_LIMITS.emailMax || !EMAIL_PATTERN.test(email)) errors.email = "That doesn't look like a valid email address.";

  if (!message) errors.message = "Please write a message.";
  else if (message.length < CONTACT_LIMITS.messageMin) errors.message = `Tell us a little more (at least ${CONTACT_LIMITS.messageMin} characters).`;
  else if (message.length > CONTACT_LIMITS.messageMax) errors.message = `Keep your message under ${CONTACT_LIMITS.messageMax} characters.`;

  return errors;
};
