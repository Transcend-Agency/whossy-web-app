import { FC } from "react";
import { Chat } from "@/types/chat";
import { User } from "@/types/user";
import { ChatCreditState, canInitiate, hoursLeft, hoursUntil } from "@/utils/chatCreditState";

interface ChatStateBannerProps {
    state: ChatCreditState;
    recipientName: string;
    currentUser: User;
    chat?: Partial<Chat>;
}

/**
 * Slim status strip above the composer describing the Reply-Gated Credits
 * state (spec §1.2 table). Renders nothing when there's nothing to say
 * (not-matched has its own overlay; connected shows only the countdown).
 */
const ChatStateBanner: FC<ChatStateBannerProps> = ({ state, recipientName, currentUser, chat }) => {
    const premium = currentUser.is_premium === true;

    let text: string | null = null;
    let tone: 'info' | 'hold' | 'free' | 'ended' = 'info';

    const broke = !canInitiate(currentUser);

    switch (state) {
        case 'idle':
            text = broke
                ? `You need 1 credit or Premium to chat with ${recipientName} — credits are only charged when they reply.`
                : premium
                    ? `Send a message to start the chat with ${recipientName}.`
                    : `Send a message to start. 1 credit will be held and only charged when ${recipientName} replies.`;
            tone = 'info';
            break;
        case 'pending_initiator':
            text = chat?.credit_held
                ? `1 credit on hold · charged only when ${recipientName} replies · returned in ${hoursLeft(chat?.hold_placed_at)}h if they don't`
                : `Waiting for ${recipientName} to reply.`;
            tone = 'hold';
            break;
        case 'pending_recipient':
            text = `${recipientName} started a chat with you — replying is free and connects you two.`;
            tone = 'free';
            break;
        case 'connected':
            text = `Connected · free chat for ${hoursUntil(chat?.expiration_time as { seconds: number } | null)}h more`;
            tone = 'free';
            break;
        case 'expired':
            text = broke
                ? `Your 48-hour window has ended. You need 1 credit or Premium to reconnect — only charged when ${recipientName} replies.`
                : premium
                    ? `Your 48-hour window has ended. Send a message to reconnect.`
                    : `Your 48-hour window has ended. Send a message to reconnect — 1 credit, held until they reply.`;
            tone = 'ended';
            break;
        default:
            return null;
    }

    if (!text) return null;

    const toneStyles: Record<typeof tone, string> = {
        info: 'bg-[#F6F6F6] text-[#5d5d5d]',
        hold: 'bg-[#FFF7E6] text-[#8a6d1a]',
        free: 'bg-[#EAF7EF] text-[#1d7a45]',
        ended: 'bg-[#F6F6F6] text-[#5d5d5d]',
    };

    return (
        <div className={`mx-6 mb-3 px-5 py-3 rounded-xl text-[1.3rem] leading-snug text-center ${toneStyles[tone]}`}>
            {text}
        </div>
    );
};

export default ChatStateBanner;
