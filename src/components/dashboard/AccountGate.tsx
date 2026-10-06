import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "@/firebase";
import { useAuthStore } from "@/store/UserId";
import { useNavigationStore } from "@/store/NavigationStore";
import { WEB_BUILD } from "@/constants/build";

const MIN_PHOTOS = 2;
const PROFILE_PATH = "/dashboard/user-profile";

/**
 * Things that must be true before the rest of the dashboard is usable.
 *
 *  - The tab is running a build the server still supports. A tab left open
 *    across a release would otherwise keep making writes the current rules
 *    reject, and fail in ways the user cannot make sense of.
 *  - The profile has at least two photos. Accounts created before that was
 *    enforced can be short; they are stopped here and sent to add them,
 *    rather than left to discover it from failed actions.
 */
const AccountGate = () => {
    const uid = useAuthStore(state => state.auth?.uid);
    const { setActivePage } = useNavigationStore();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [photoCount, setPhotoCount] = useState<number | null>(null);
    const [minBuild, setMinBuild] = useState(0);

    useEffect(() => {
        if (!uid) return;
        return onSnapshot(
            doc(db, "users", uid),
            (snap) => setPhotoCount(((snap.data()?.photos as string[] | undefined) ?? []).filter(Boolean).length),
            (error) => console.error("AccountGate user subscription failed:", error),
        );
    }, [uid]);

    useEffect(() => onSnapshot(
        doc(db, "config", "app"),
        (snap) => setMinBuild(Number(snap.data()?.min_web_build ?? 0)),
        // No config document, or it cannot be read: do not lock anyone out.
        () => setMinBuild(0),
    ), []);

    if (WEB_BUILD < minBuild) {
        return (
            <Blocker
                title="Whossy has been updated"
                body="This tab is running an older version. Reload to keep going; nothing you've saved is lost."
                action="Reload"
                onAction={() => window.location.reload()}
            />
        );
    }

    if (photoCount === null || photoCount >= MIN_PHOTOS) return null;

    const missing = MIN_PHOTOS - photoCount;
    const body = `Your profile needs at least ${MIN_PHOTOS} photos before you can browse, like or message. Add ${missing} more to continue.`;

    // On the profile page the editor has to stay reachable, so the gate
    // becomes a banner there instead of covering the screen.
    if (pathname === PROFILE_PATH) {
        return (
            <div role="alert" className="fixed top-0 inset-x-0 z-[9998] bg-[#F2243E] text-white text-[1.6rem] text-center px-6 py-4">
                {body}
            </div>
        );
    }

    return (
        <Blocker
            title={`Add ${missing} more photo${missing === 1 ? "" : "s"}`}
            body={body}
            action="Add photos"
            onAction={() => { setActivePage('edit-profile'); navigate(PROFILE_PATH); }}
        />
    );
};

const Blocker = ({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) => (
    <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[9999] bg-white flex items-center justify-center px-8">
        <div className="max-w-[48rem] text-center space-y-6">
            <h1 className="text-[2.8rem] font-semibold">{title}</h1>
            <p className="text-[1.8rem] text-[#666]">{body}</p>
            <button onClick={onAction} className="bg-[#ff5e00f7] text-white text-[1.8rem] font-medium px-10 py-5 rounded-[0.8rem]">
                {action}
            </button>
        </div>
    </div>
);

export default AccountGate;
