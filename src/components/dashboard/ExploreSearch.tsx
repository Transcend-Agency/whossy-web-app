import { FC } from "react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import ExploreGridProfile from "./ExploreGridProfile";
import DiscoveryStateMessage from "./DiscoveryStateMessage";
import { UserSearchResult, UserSearchStatus } from "@/hooks/useUserSearch";
import { MIN_SEARCH_LETTERS } from "@/utils/userSearch";

interface ExploreSearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

/** The name search box at the top of Explore. */
export const ExploreSearchBar: FC<ExploreSearchBarProps> = ({ value, onChange }) => (
    <div className="explore-search" role="search">
        <img src="/assets/icons/search.svg" alt="" className="explore-search__icon" />
        <input
            type="search"
            className="explore-search__input"
            placeholder="Search people by name"
            aria-label="Search people by name"
            value={value}
            maxLength={60}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onChange(""); }}
        />
        {value && (
            <button type="button" className="explore-search__clear" aria-label="Clear search" onClick={() => onChange("")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
        )}
    </div>
);

interface ExploreSearchResultsProps {
    term: string;
    status: UserSearchStatus;
    results: UserSearchResult[];
    error: string | null;
    onOpenProfile: (uid: string) => void;
    hasBeenLiked: (uid: string) => boolean;
}

const masonry = (columns: number, className: string, items: UserSearchResult[], props: ExploreSearchResultsProps) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={className}>
        {Array.from({ length: columns }, (_, col) => (
            <div key={col} className={`${className.split(" ")[0]}__column`}>
                {items.filter((_, i) => i % columns === col).map((person) => (
                    <ExploreGridProfile
                        key={person.uid}
                        profile_image={person.photo ?? undefined}
                        first_name={person.first_name}
                        age={person.age ?? 0}
                        isVerified
                        hasBeenLiked={props.hasBeenLiked(person.uid)}
                        onProfileClick={() => props.onOpenProfile(person.uid)}
                    />
                ))}
            </div>
        ))}
    </motion.div>
);

const skeletons = (columns: number, className: string) => (
    <div className={className}>
        {Array.from({ length: columns }, (_, col) => (
            <div key={col} className={`${className.split(" ")[0]}__column`}>
                {[0, 1].map((row) => (
                    <Skeleton key={row} containerClassName="explore-grid__profile" height={"100%"} />
                ))}
            </div>
        ))}
    </div>
);

/** Replaces the Explore grid while a search is typed in. */
export const ExploreSearchResults: FC<ExploreSearchResultsProps> = (props) => {
    const { term, status, results, error } = props;

    if (status === "too-short") {
        return <DiscoveryStateMessage title={`Type at least ${MIN_SEARCH_LETTERS} letters`} subtitle="Search by first name, last name, or both." />;
    }
    if (status === "error") {
        return <DiscoveryStateMessage title="Search didn't work" subtitle={error ?? "Please try again."} />;
    }
    if (status === "loading") {
        return (
            <div aria-busy="true" aria-label="Searching">
                {skeletons(5, "explore-grid hidden md:grid")}
                {skeletons(3, "mobile-grid")}
            </div>
        );
    }
    if (status === "done" && results.length === 0) {
        return (
            <DiscoveryStateMessage
                title={`No one found for “${term.trim()}”`}
                subtitle="Check the spelling, or try just their first or last name. People who've turned off Public search don't appear."
            />
        );
    }
    if (status !== "done") return null;

    return (
        <>
            <p className="explore-search__count" aria-live="polite">
                {results.length === 1 ? "1 person" : `${results.length} people`}
            </p>
            {masonry(5, "explore-grid hidden md:grid", results, props)}
            {masonry(3, "mobile-grid", results, props)}
        </>
    );
};
