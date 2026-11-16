// True on an iPhone, iPod or iPad. iPadOS reports itself as a Mac, so a Mac
// with a touch screen counts as an iPad.
export function isIOSDevice(
  userAgent: string = typeof navigator === "undefined" ? "" : navigator.userAgent,
  maxTouchPoints: number = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints ?? 0,
): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}
