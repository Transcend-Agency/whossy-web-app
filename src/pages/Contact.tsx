import PublicPageLayout from "@/components/landing/PublicPageLayout";
import React, { useRef, useState } from "react";
import {
  CONTACT_LIMITS,
  SUPPORT_EMAIL,
  validateContactForm,
  type ContactErrors,
  type ContactForm,
} from "@/utils/contactForm";
import { sendContactMessage } from "@/utils/contactMessage";

const couplePic = "/assets/icons/contact.svg";

const EMPTY_FORM: ContactForm = { name: "", email: "", message: "" };

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass = (hasError: boolean) =>
  `text-[16px] lg:text-[1.8rem] w-full border-b border-solid bg-transparent focus:outline-none py-[1.2rem] transition-colors placeholder:italic placeholder:text-gray ${
    hasError ? "border-red" : "border-gray focus:border-black"
  }`;

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="mt-[0.8rem] text-[13px] lg:text-[1.4rem] text-red">
      {message}
    </p>
  ) : null;

const Contact = () => {
  const [formData, setFormData] = useState<ContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactErrors>({});
  // Errors show after the first submit attempt, then update as the user types.
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState("");
  // Hidden from people; bots that fill every field fill this one too.
  const [honeypot, setHoneypot] = useState("");
  const fieldRefs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };
  const successRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...formData, [e.target.name]: e.target.value };
    setFormData(next);
    if (attempted) setErrors(validateContactForm(next));
    if (status === "error") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    setAttempted(true);
    const found = validateContactForm(formData);
    setErrors(found);
    const firstInvalid = (["name", "email", "message"] as const).find((key) => found[key]);
    if (firstInvalid) {
      // Centered rather than the browser's default, which would leave the
      // field under the fixed header.
      const field = fieldRefs[firstInvalid].current;
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setStatus("sending");
    try {
      if (!honeypot) await sendContactMessage(formData);
      setSentTo(formData.email.trim());
      setFormData(EMPTY_FORM);
      setAttempted(false);
      setStatus("sent");
      requestAnimationFrame(() => {
        successRef.current?.focus({ preventScroll: true });
        successRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    } catch (err) {
      console.error("Contact message failed to send", err);
      setStatus("error");
    }
  };

  const sendAnother = () => {
    setStatus("idle");
    requestAnimationFrame(() => {
      fieldRefs.name.current?.focus({ preventScroll: true });
      fieldRefs.name.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  const sending = status === "sending";
  const messageLength = formData.message.trim().length;

  return (
    <PublicPageLayout>
      <div className="px-[2.8rem] sm:px-[4rem] lg:grid lg:grid-cols-2 lg:items-center lg:gap-[6rem] max-w-[128rem] mx-auto">
        <h1 className="text-[28px] sm:text-[3.2rem] italic mb-[2.4rem] lg:hidden">SEND US A MESSAGE</h1>

        <div
          style={{ backgroundImage: `url(${couplePic})` }}
          className="bg-img w-full h-[28rem] sm:h-[40rem] lg:h-[56rem] lg:max-w-[50.4rem] rounded-[0.8rem]"
          role="img"
          aria-label="A smiling couple"
        />

        <div className="mt-[4rem] lg:mt-0">
          <p className="text-[4.8rem] italic hidden lg:block mb-[1.6rem]" aria-hidden="true">
            SEND US A MESSAGE
          </p>

          {status === "sent" ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="rounded-[0.8rem] bg-lightgray p-[3.2rem] focus:outline-none"
            >
              <div className="flex items-center justify-center w-[5.6rem] h-[5.6rem] rounded-full bg-red text-white mb-[2.4rem]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-[22px] lg:text-[2.4rem] font-medium mb-[1.2rem]">Message sent</h2>
              <p className="text-[15px] leading-[24px] lg:text-[1.6rem] lg:leading-[2.6rem] text-[#3b3b3b]">
                Thanks for reaching out. We've received your message and will reply to{" "}
                <span className="font-medium text-black break-all">{sentTo}</span>.
              </p>
              <button
                type="button"
                onClick={sendAnother}
                className="mt-[2.4rem] text-[15px] lg:text-[1.6rem] text-red underline underline-offset-4"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-[2.4rem]" aria-busy={sending}>
              <p className="text-[14px] lg:text-[1.6rem] text-gray">
                Questions, feedback or trouble with your account? We read every message.
              </p>

              <div>
                <label htmlFor="name" className="sr-only">Name</label>
                <input
                  ref={fieldRefs.name}
                  name="name"
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={sending}
                  maxLength={CONTACT_LIMITS.nameMax}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={fieldClass(!!errors.name)}
                />
                <FieldError id="name-error" message={errors.name} />
              </div>

              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  ref={fieldRefs.email}
                  name="email"
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={sending}
                  maxLength={CONTACT_LIMITS.emailMax}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={fieldClass(!!errors.email)}
                />
                <FieldError id="email-error" message={errors.email} />
              </div>

              <div>
                <label htmlFor="message" className="sr-only">Message</label>
                <textarea
                  ref={fieldRefs.message}
                  name="message"
                  id="message"
                  placeholder="Message"
                  value={formData.message}
                  onChange={handleChange}
                  disabled={sending}
                  maxLength={CONTACT_LIMITS.messageMax}
                  rows={5}
                  aria-invalid={!!errors.message}
                  aria-describedby={`message-count${errors.message ? " message-error" : ""}`}
                  className={`${fieldClass(!!errors.message)} resize-y min-h-[12rem]`}
                />
                <div className="flex justify-between gap-[1.6rem]">
                  <FieldError id="message-error" message={errors.message} />
                  <p id="message-count" className="ml-auto mt-[0.8rem] text-[12px] lg:text-[1.2rem] text-gray tabular-nums">
                    {messageLength}/{CONTACT_LIMITS.messageMax}
                  </p>
                </div>
              </div>

              {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {status === "error" && (
                <div role="alert" className="rounded-[0.8rem] border border-solid border-red bg-red/5 p-[1.6rem] text-[14px] leading-[22px] lg:text-[1.4rem] lg:leading-[2.2rem]">
                  <p className="font-medium text-red">Your message wasn't sent.</p>
                  <p className="text-[#3b3b3b]">
                    Check your connection and try again. If it keeps failing, email us at{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-red underline underline-offset-2">
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-[1rem] rounded-[0.8rem] bg-red text-white text-[16px] lg:text-[1.6rem] font-medium py-[14px] lg:py-[1.6rem] px-[3.2rem] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait"
              >
                {sending && (
                  <span
                    className="w-[1.6rem] h-[1.6rem] rounded-full border-2 border-white/40 border-t-white animate-spin"
                    aria-hidden="true"
                  />
                )}
                {sending ? "Sending…" : status === "error" ? "Try again" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default Contact;
