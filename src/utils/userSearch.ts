/** Mirrors MIN_PREFIX in functions/src/searchIndex.ts. */
export const MIN_SEARCH_LETTERS = 2;

/**
 * Whether the server will search this term: some word of it (split the same
 * way the server splits names) must be at least MIN_SEARCH_LETTERS long.
 * Checked on the client so a one-letter term shows a hint instead of a call.
 */
export const isSearchable = (term: string): boolean =>
    term
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .split(/[^\p{L}\p{N}]+/u)
        .some((word) => word.length >= MIN_SEARCH_LETTERS);
