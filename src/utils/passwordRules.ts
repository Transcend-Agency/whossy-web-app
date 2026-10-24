// One rule per line of the reset-password checklist. The checklist and the
// form's validation both read this list, so a password that ticks every box
// is never refused. Matches the mobile app's rules (passwordRules in
// whossy-mobile-app/lib/common/utils/extensions.dart).
export const PASSWORD_RULES = [
  { text: "Be at least 8 characters or more", test: (p: string) => p.length >= 8 },
  { text: "At least 1 uppercase and lower case letter", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { text: "Must contain a digit or number", test: (p: string) => /\d/.test(p) },
  { text: "Must contain a special character e,g '@$!%*?&'.", test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
];

export const PASSWORD_MAX_LENGTH = 128;

export const meetsPasswordRules = (password: string) => PASSWORD_RULES.every((rule) => rule.test(password));
