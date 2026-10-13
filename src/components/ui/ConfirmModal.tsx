import { AnimatePresence } from "framer-motion";
import { FC, ReactNode, useEffect } from "react";
import ActionButton from "./ActionButton";
import Modal from "./Modal";

interface ConfirmModalProps {
    show: boolean;
    title: string;
    message: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    loading?: boolean;
    /** `danger` (red) for destructive actions, `primary` for reversible ones like unblocking. */
    tone?: "danger" | "primary";
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: FC<ConfirmModalProps> = ({ show, title, message, confirmLabel, cancelLabel = "Cancel", loading, tone = "danger", onConfirm, onCancel }) => {
    useEffect(() => {
        if (!show) return;
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [show, onCancel]);

    return (
        <AnimatePresence>
            {show && (
                <Modal key="confirm-modal" onClose={onCancel}>
                    <div role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-message"
                         className="bg-white rounded-[1.6rem] p-[2.4rem] w-[min(36rem,calc(100vw-4rem))] flex flex-col gap-[0.8rem] text-center shadow-xl">
                        <h2 id="confirm-title" className="text-[2rem] font-bold text-[#121212]">{title}</h2>
                        <p id="confirm-message" className="text-[1.4rem] leading-[1.5] text-[#8A8A8E]">{message}</p>
                        <div className="flex flex-col gap-[0.8rem] mt-[1.6rem]">
                            <ActionButton autoFocus loading={loading} onClick={onConfirm} className={`w-full ${tone === "danger" ? "!bg-[#F2243E] hover:!bg-[#d81c34] !shadow-none" : ""}`}>{confirmLabel}</ActionButton>
                            <ActionButton variant="ghost" onClick={onCancel} disabled={loading} className="w-full !text-[#121212]">{cancelLabel}</ActionButton>
                        </div>
                    </div>
                </Modal>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
