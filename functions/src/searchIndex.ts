/**
 * Name search — the pure part, shared by the Cloud Functions (search.ts) and
 * the backfill step in scripts/data-repair.cjs. No Firebase imports here, so
 * the script can require the compiled file without initialising an app.
 *
 * Firestore has no text search, so each user carries `search_prefixes`: the
 * leading slices of every word of their first and last name, lowercased and
 * stripped of accents. "Adaeze Obi" → ["ad", "ada", "adae", …, "ob", "obi"].
 * A search for one word is then a single `array-contains`; a search for
 * several words queries on the longest one and checks the rest in memory.
 */

/** Shortest query word that is searched at all. */
export const MIN_PREFIX = 2;
/** Longest stored prefix. Longer query words are cut to this for the query
 *  and matched in full afterwards. */
export const MAX_PREFIX = 15;
/** Caps the array on pathological names (many long words). */
const MAX_WORDS = 6;

/** Lowercase, accents removed, anything that isn't a letter or digit treated
 *  as a word break ("Mary-Jane O'Neil" → mary, jane, o, neil). */
export function nameWords(...parts: Array<string | null | undefined>): string[] {
  const words: string[] = [];
  for (const part of parts) {
    if (typeof part !== "string") continue;
    const normalised = part
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
    for (const word of normalised.split(/[^\p{L}\p{N}]+/u)) {
      if (word) words.push(word);
    }
  }
  return words.slice(0, MAX_WORDS);
}

/** The `search_prefixes` value for a user. Sorted so an unchanged name
 *  always produces an identical array (the trigger compares before writing). */
export function searchPrefixes(firstName: unknown, lastName: unknown): string[] {
  const set = new Set<string>();
  const words = nameWords(
    typeof firstName === "string" ? firstName : null,
    typeof lastName === "string" ? lastName : null
  );
  for (const word of words) {
    for (let len = MIN_PREFIX; len <= Math.min(word.length, MAX_PREFIX); len++) {
      set.add(word.slice(0, len));
    }
  }
  return [...set].sort();
}

/** Query words worth searching on (at least MIN_PREFIX long). */
export function queryWords(query: string): string[] {
  return nameWords(query).filter((w) => w.length >= MIN_PREFIX);
}

/** True when every query word is the start of some word of the name. */
export function nameMatches(words: string[], firstName: unknown, lastName: unknown): boolean {
  const name = nameWords(
    typeof firstName === "string" ? firstName : null,
    typeof lastName === "string" ? lastName : null
  );
  return words.every((q) => name.some((n) => n.startsWith(q)));
}

/** Whether a stored search_prefixes value must be replaced by `next`. A
 *  profile with no name and no field is left alone rather than given []. */
export function needsReindex(current: unknown, next: string[]): boolean {
  if (current === undefined && next.length === 0) return false;
  return !(Array.isArray(current) && current.length === next.length && current.every((v, i) => v === next[i]));
}
