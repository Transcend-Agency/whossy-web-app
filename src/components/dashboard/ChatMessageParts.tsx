import { FC, ReactNode } from "react";
import { IoCheckmark, IoCheckmarkDone, IoTimeOutline } from "react-icons/io5";
import { ReplyTo } from "@/types/chat";
import { TickState } from "@/utils/chatDelivery";
import { quotePreview } from "@/utils/chatReply";

const GREY = "#9a9a9e";
const READ_BLUE = "#2747d8";

/** The ticks under one of your own messages: a clock while it waits to send,
 *  one grey tick once sent, two grey once their device has it, and two blue
 *  once they have read it. */
export const MessageTicks: FC<{ state: TickState }> = ({ state }) => {
    const label = { pending: "Sending", sent: "Sent", delivered: "Delivered", read: "Read" }[state];
    const props = { "aria-label": label, title: label, size: 16 };
    switch (state) {
        case "pending":
            return <IoTimeOutline {...props} color={GREY} data-tick="pending" />;
        case "sent":
            return <IoCheckmark {...props} color={GREY} data-tick="sent" />;
        case "delivered":
            return <IoCheckmarkDone {...props} color={GREY} data-tick="delivered" />;
        case "read":
            return <IoCheckmarkDone {...props} color={READ_BLUE} data-tick="read" />;
    }
};

/** The quoted message: a coloured bar, who wrote it, and two lines of it.
 *  Used inside a reply bubble and in the "Replying to" bar. */
export const ReplyQuote: FC<{
    quote: Pick<ReplyTo, "message" | "has_photo">;
    name: string;
    isOwn: boolean;
    trailing?: ReactNode;
    className?: string;
}> = ({ quote, name, isOwn, trailing, className = "" }) => (
    <div
        className={`flex items-stretch rounded-[0.8rem] overflow-hidden bg-black/5 text-left ${className}`}
        data-testid="reply-quote"
    >
        <div className={`w-[0.4rem] shrink-0 ${isOwn ? "bg-[#485fe6]" : "bg-[#F0174B]"}`} />
        <div className="min-w-0 flex-1 px-[1rem] py-[0.6rem]">
            <p className={`font-bold text-[1.3rem] truncate ${isOwn ? "text-[#485fe6]" : "text-[#F0174B]"}`}>{name}</p>
            <p className="text-[1.3rem] text-[#66666B] line-clamp-2 break-words">{quotePreview(quote)}</p>
        </div>
        {trailing}
    </div>
);
