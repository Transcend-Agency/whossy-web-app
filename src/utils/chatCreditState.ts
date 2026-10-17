import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";
import { Chat } from "@/types/chat";
import { User } from "@/types/user";

/**
 * Reply-Gated Credits — client-side view of the chat state machine (spec §2).
 * Derived from the live chat doc; the server is the only writer of the
 * underlying fields, so this is rendering logic, not business logic.
 */
export type ChatCreditState =
    | 'idle'
    | 'pending_initiator'
    | 'pending_recipient'
    | 'connected'
    | 'expired';

const HOUR_MS = 60 * 60 * 1000;
/** Mirrors HOLD_WINDOW_HOURS / CHAT_WINDOW_HOURS in functions/src/index.ts. */
export const WINDOW_HOURS = 48;

const toMillis = (t?: { seconds: number } | null): number | null =>
    t && typeof t.seconds === 'number' ? t.seconds * 1000 : null;

export function deriveChatCreditState(
    chat: Partial<Chat> | undefined,
    currentUid: string
): ChatCreditState {
    // No match prerequisite (removed 2026-07-19): premium-or-credits is the
    // only gate on initiating; matching is a discovery feature only.
    if (!chat) return 'idle';

    if (chat.credit_status === 'pending') {
        // A hold past its 48h is display-wise back to idle (the sweeper will
        // refund it; initiateChat also supersedes it server-side).
        const placed = toMillis(chat.hold_placed_at);
        if (placed !== null && Date.now() - placed > WINDOW_HOURS * HOUR_MS) return 'idle';
        return chat.initiator_id === currentUid ? 'pending_initiator' : 'pending_recipient';
    }

    const expiry = toMillis(chat.expiration_time as { seconds: number } | null);
    const windowActive = expiry !== null && expiry > Date.now();

    if (chat.credit_status === 'connected') return windowActive ? 'connected' : 'expired';

    // Legacy docs that predate the backfill: only is_unlocked/expiration_time.
    if (chat.credit_status === undefined && chat.is_unlocked) {
        return windowActive ? 'connected' : 'expired';
    }

    return 'idle';
}

/** Spendable credits: total minus what pending initiations have reserved. */
export const availableCredits = (user?: User | null): number =>
    Math.max(0, (user?.credit_balance ?? 0) - (user?.credits_on_hold ?? 0));

export const canInitiate = (user?: User | null): boolean =>
    user?.is_premium === true || availableCredits(user) >= 1;

/** Whole hours left before `from + WINDOW_HOURS`; 0 when passed/absent. */
export function hoursLeft(from?: { seconds: number } | null): number {
    const start = toMillis(from);
    if (start === null) return 0;
    return Math.max(0, Math.ceil((start + WINDOW_HOURS * HOUR_MS - Date.now()) / HOUR_MS));
}

/** Whole hours until an absolute timestamp; 0 when passed/absent. */
export function hoursUntil(t?: { seconds: number } | null): number {
    const at = toMillis(t);
    if (at === null) return 0;
    return Math.max(0, Math.ceil((at - Date.now()) / HOUR_MS));
}

/** True while a connected chat's 48h window is open (list views, unread logic). */
export function isChatWindowActive(chat?: Partial<Chat> | null): boolean {
    if (!chat) return false;
    const expiry = toMillis(chat.expiration_time as { seconds: number } | null);
    const windowActive = expiry !== null && expiry > Date.now();
    if (chat.credit_status !== undefined) return chat.credit_status === 'connected' && windowActive;
    return chat.is_unlocked === true && windowActive; // legacy docs
}

interface InitiateChatResult {
    status: 'pending' | 'connected';
    held: boolean;
    alreadyPending?: boolean;
    alreadyConnected?: boolean;
}

/**
 * IDLE → PENDING via the `initiateChat` Cloud Function. Throws HttpsError-shaped
 * errors; `code` is 'functions/failed-precondition' with message
 * 'INSUFFICIENT_CREDITS' | 'ALREADY_PENDING_BY_OTHER'.
 */
export async function initiateChat(chatId: string): Promise<InitiateChatResult> {
    const call = httpsCallable<{ chatId: string }, InitiateChatResult>(functions, 'initiateChat');
    const res = await call({ chatId });
    return res.data;
}
