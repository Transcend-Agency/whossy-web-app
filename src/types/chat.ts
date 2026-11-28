import { FieldValue } from "firebase/firestore";

/** Reply-Gated Credits state machine (spec §2). Server-written only. */
export type ChatCreditStatus = 'idle' | 'pending' | 'connected';

export type Chat = {
    last_message: string;
    last_message_id: string;
    last_sender_id: string;
    participants: string[];
    status: 'sent' | 'seen';
    is_seen_by_initiator: boolean;
    is_seen_by_receiver: boolean;
    last_message_timestamp: FieldValue | { seconds: number, nanoseconds: number };
    unlock_time: FieldValue | { seconds: number, nanoseconds: number };
    expiration_time: FieldValue | { seconds: number, nanoseconds: number } | null;
    /** @deprecated legacy v1 unlock flag — still written by the backend for
     *  old clients during rollout; new code derives state from credit_status. */
    is_unlocked: boolean;
    user_blocked: boolean[]

    // Reply-Gated Credits (all written exclusively by Cloud Functions):
    credit_status?: ChatCreditStatus;
    initiator_id?: string | null;
    hold_placed_at?: { seconds: number, nanoseconds: number } | null;
    connected_at?: { seconds: number, nanoseconds: number } | null;
    credit_held?: boolean;

    /** When each participant last viewed the chat, by uid. Kept whether or
     *  not their read receipts are on; each writes only their own entry. */
    last_read_at?: Record<string, FieldValue | { seconds: number, nanoseconds: number } | null>;

    /** When each participant's device last received this chat's messages, by
     *  uid. Every message sent up to then counts as delivered (two grey
     *  ticks). Each participant writes only their own entry. */
    delivered_at?: Record<string, FieldValue | { seconds: number, nanoseconds: number } | null>;
};

/** The message a reply answers, copied onto the reply when it is sent.
 *  Written in the same shape by the mobile app. */
export type ReplyTo = {
    id: string;
    sender_id: string;
    /** The quoted text, cut to 200 characters; absent for a photo alone. */
    message?: string;
    has_photo: boolean;
};

export type Messages = {
    id: string;
    message: string | null;
    photo: string | null;
    sender_id: string;
    sender_id_blocked: boolean;
    timestamp: FieldValue | { seconds: number, nanoseconds: number };
    /** 'undelivered' is written by the mobile app for a message sent while
     *  offline; the server turns it into 'sent' once it arrives. */
    status: 'sent' | 'seen' | 'undelivered';
    reply_to?: ReplyTo | null;
}