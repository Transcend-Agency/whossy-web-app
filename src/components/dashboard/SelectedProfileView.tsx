import { FC, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getUserProfile } from "@/hooks/useUser.ts";
import useDashboardStore from "@/store/useDashboardStore.tsx";
import { User } from "@/types/user";
import ViewProfile from "./ViewProfile";

interface SelectedProfileViewProps {
    onBackClick: () => void;
    onBlockChange: () => void;
}

/**
 * Opens the profile picked in `useDashboardStore().selectedProfile`.
 *
 * The profile usually sits in the loaded Explore list, but not always: a match
 * picked from the side panel can be on a page of Explore that has not loaded
 * (or filtered out), and looking it up in the list alone gave `undefined`, which
 * made ViewProfile toast "Unable to fetch user data" on every render. When the
 * profile is not listed it is fetched by uid instead.
 */
const SelectedProfileView: FC<SelectedProfileViewProps> = ({ onBackClick, onBlockChange }) => {
    const { profiles, selectedProfile } = useDashboardStore();
    const listed = profiles.find((profile) => profile.uid === selectedProfile);

    const [fetched, setFetched] = useState<User | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFetched(null);
        setFailed(false);
        if (!selectedProfile || listed) return;

        let cancelled = false;
        getUserProfile("users", selectedProfile as string).then((user) => {
            if (cancelled) return;
            if (user) setFetched(user as User);
            else setFailed(true);
        });
        return () => { cancelled = true; };
    }, [selectedProfile, Boolean(listed)]);

    useEffect(() => {
        if (!failed) return;
        toast("Unable to fetch user data", { id: "selected-profile-missing" });
        onBackClick();
    }, [failed]);

    const userData = listed ?? fetched;
    if (!userData) return null;

    return <ViewProfile onBackClick={onBackClick} userData={userData} onBlockChange={onBlockChange} />;
};

export default SelectedProfileView;
