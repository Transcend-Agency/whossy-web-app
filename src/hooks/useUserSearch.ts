import { useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { FirebaseError } from "firebase/app";
import { functions } from "@/firebase";
import { isSearchable } from "@/utils/userSearch";

/** One result of the searchUsers callable (functions/src/search.ts). */
export interface UserSearchResult {
    uid: string;
    first_name: string;
    age: number | null;
    photo: string | null;
}

export type UserSearchStatus = "idle" | "too-short" | "loading" | "done" | "error";

const DEBOUNCE_MS = 350;

const searchUsersCallable = httpsCallable<{ query: string }, { results: UserSearchResult[] }>(functions, "searchUsers");

/**
 * Global name search on Explore. Waits for a pause in typing, then asks the
 * server; a response that arrives after the term has changed again is
 * dropped, so results never flash back to an older query.
 */
export default function useUserSearch(term: string) {
    const [status, setStatus] = useState<UserSearchStatus>("idle");
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const latest = useRef(0);

    useEffect(() => {
        const trimmed = term.trim();
        const request = ++latest.current;

        if (!trimmed) {
            setStatus("idle");
            setResults([]);
            setError(null);
            return;
        }
        if (!isSearchable(trimmed)) {
            setStatus("too-short");
            setResults([]);
            setError(null);
            return;
        }

        setStatus("loading");
        const timer = setTimeout(async () => {
            try {
                const { data } = await searchUsersCallable({ query: trimmed });
                if (request !== latest.current) return;
                setResults(data.results);
                setError(null);
                setStatus("done");
            } catch (err) {
                if (request !== latest.current) return;
                console.error("searchUsers failed:", err);
                const known = err instanceof FirebaseError
                    && ["functions/resource-exhausted", "functions/invalid-argument", "functions/failed-precondition", "functions/permission-denied"].includes(err.code);
                setResults([]);
                setError(known ? (err as FirebaseError).message : "Couldn't search right now. Please try again.");
                setStatus("error");
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [term]);

    return { status, results, error };
}
