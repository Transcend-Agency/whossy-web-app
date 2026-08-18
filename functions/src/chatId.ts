/** chatId is `[uidA, uidB].sort().join('_')` on both clients. Shared between
 *  the reply-gated-credits triggers and the message-notification trigger. */
export function participantsOf(chatId: string): [string, string] | null {
  const parts = chatId.split("_");
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[0] === parts[1]) return null;
  return [parts[0], parts[1]];
}
