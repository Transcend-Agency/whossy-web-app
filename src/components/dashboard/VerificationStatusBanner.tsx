import { ReactNode, useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { IoMdAlert, IoMdCamera, IoMdCheckmarkCircle, IoMdClose, IoMdTime } from 'react-icons/io';
import { db } from '@/firebase';
import { useAuthStore } from '@/store/UserId';
import { User } from '@/types/user';
import { FaceVerificationModal } from './FaceVerificationModal';

type BannerVariant = 'prompt' | 'pending' | 'approved' | 'rejected';

const toMillis = (value?: Timestamp | Date | number | string | null): number | null => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.getTime();
    // Admin tooling (Retool) may write plain numbers or date strings rather
    // than Firestore Timestamps.
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof value.toMillis === 'function') return value.toMillis();
    return null;
};

const ackKey = (uid: string) => `whossy_verification_approved_ack_${uid}`;
const promptDismissKey = (uid: string) => `whossy_verification_prompt_dismissed_${uid}`;

const deriveStatus = (
    fv?: User['face_verification'],
): 'none' | 'pending' | 'approved' | 'rejected' => {
    if (!fv) return 'none';
    switch (fv.status) {
        case 'approved':
            return 'approved';
        case 'rejected':
            return 'rejected';
        case 'pending_review':
            return 'pending';
    }
    if (!fv.photo) return 'none';
    if (fv.retake_photo) return 'rejected';
    return 'approved';
};

export const useVerificationStatusBanner = (): { banner: ReactNode; visible: boolean } => {
    const { auth } = useAuthStore();
    const uid = auth?.uid;

    const [userData, setUserData] = useState<User | null>(null);
    const [showFaceModal, setShowFaceModal] = useState(false);
    // Mirrored into state so dismissing/acking re-renders immediately.
    const [promptDismissed, setPromptDismissed] = useState(false);
    const [approvalAck, setApprovalAck] = useState<number | null>(null);

    useEffect(() => {
        if (!uid) return;

        setPromptDismissed(sessionStorage.getItem(promptDismissKey(uid)) === 'true');
        const storedAck = localStorage.getItem(ackKey(uid));
        setApprovalAck(storedAck ? Number(storedAck) : null);

        // Live subscription (rather than a one-shot fetch) so an admin verdict
        // from the Retool review flips the banner without a manual refresh.
        return onSnapshot(
            doc(db, 'users', uid),
            (snap) => setUserData((snap.data() as User) ?? null),
            (error) => console.error('Verification banner user subscription failed:', error),
        );
    }, [uid]);

    const status = deriveStatus(userData?.face_verification);
    // The "approval event" marker the show-once ack is keyed on. The admin
    // tooling doesn't reliably write reviewed_at, so fall back to the
    // submission's own updated_at (always written by the client), then to a
    // constant so an approved-but-unacked user still gets the banner once.
    const reviewedAt =
        toMillis(userData?.face_verification?.reviewed_at) ??
        toMillis(userData?.face_verification?.updated_at) ??
        1;

    let variant: BannerVariant | null = null;
    if (userData) {
        if (status === 'approved') {
            // Show-once congratulations, then hidden for good.
            if ((approvalAck ?? 0) < reviewedAt) variant = 'approved';
        } else if (status === 'rejected') {
            variant = 'rejected';
        } else if (status === 'pending') {
            variant = 'pending';
        } else if (!promptDismissed) {
            variant = 'prompt';
        }
    }

    const acknowledgeApproval = () => {
        if (!uid) return;
        localStorage.setItem(ackKey(uid), String(reviewedAt));
        setApprovalAck(reviewedAt);
    };

    useEffect(() => {
        if (variant !== 'approved') return;
        const timer = setTimeout(acknowledgeApproval, 5000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variant, reviewedAt]);

    const dismissPrompt = () => {
        if (!uid) return;
        sessionStorage.setItem(promptDismissKey(uid), 'true');
        setPromptDismissed(true);
    };

    const faceModal = (
        <FaceVerificationModal
            show={showFaceModal}
            onCloseModal={() => setShowFaceModal(false)}
            refetchUserData={() => { /* live onSnapshot keeps userData fresh */ }}
        />
    );

    if (!variant) {
        return { banner: faceModal, visible: false };
    }

    const config = {
        prompt: {
            container: 'bg-[#F6F6F6] text-[#121212] border-black/10',
            chip: 'bg-black/[0.06]',
            icon: <IoMdCamera className="size-[1.6rem]" />,
            text: 'Verify your photo to start matching',
            action: 'Take selfie',
        },
        pending: {
            container: 'bg-[#FFF7E6] text-[#9A6B00] border-[#9A6B00]/15',
            chip: 'bg-[#9A6B00]/10',
            icon: <IoMdTime className="size-[1.6rem]" />,
            text: "Selfie under review, you'll be able to like and message once approved",
            action: null,
        },
        approved: {
            container: 'bg-[#E8F7EE] text-[#1E7A46] border-[#1E7A46]/15',
            chip: 'bg-[#1E7A46]/10',
            icon: <IoMdCheckmarkCircle className="size-[1.6rem]" />,
            text: "You're verified, start matching!",
            action: null,
        },
        rejected: {
            container: 'bg-[#FDECEC] text-[#F0174B] border-[#F0174B]/15',
            chip: 'bg-[#F0174B]/10',
            icon: <IoMdAlert className="size-[1.6rem]" />,
            text: 'Your verification wasn’t approved, retake your selfie to start matching',
            action: 'Retake',
        },
    }[variant];

    const banner = (
        <>
            <motion.div
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`w-full border-b ${config.container}`}
                onClick={variant === 'approved' ? acknowledgeApproval : undefined}
                role={variant === 'approved' ? 'button' : undefined}
            >
                <div className="w-full max-w-[1512px] mx-auto px-[1.6rem] lg:px-[5.6rem] py-[1rem] lg:py-0 lg:h-[4.4rem] flex items-center gap-x-[1.2rem]">
                    <span className={`flex items-center justify-center size-[2.8rem] rounded-full shrink-0 ${config.chip}`}>
                        {config.icon}
                    </span>
                    <p className="flex-1 text-[1.4rem] font-medium leading-[130%]">{config.text}</p>
                    {config.action && (
                        <button
                            onClick={() => setShowFaceModal(true)}
                            className="bg-gradient-to-br from-orange-400 to-red text-white px-[1.6rem] py-[0.7rem] text-[1.3rem] font-bold rounded-full hover:opacity-80 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0"
                        >
                            {config.action}
                        </button>
                    )}
                    {variant === 'prompt' && (
                        <button
                            onClick={dismissPrompt}
                            aria-label="Dismiss"
                            className="p-[0.4rem] cursor-pointer opacity-50 hover:opacity-100 transition-opacity duration-200 shrink-0"
                        >
                            <IoMdClose className="size-[1.8rem]" />
                        </button>
                    )}
                </div>
            </motion.div>
            {faceModal}
        </>
    );

    return { banner, visible: true };
};
