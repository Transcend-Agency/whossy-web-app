import { ReactNode, useState } from 'react';
import { User } from '@/types/user';
import { VerificationGateModal } from '@/components/dashboard/VerificationGateModal.tsx';
import { FaceVerificationModal } from '@/components/dashboard/FaceVerificationModal.tsx';

/**
 * Gates "match & connect" actions (liking, messaging) behind face verification,
 * mirroring the mobile app where these are disabled until the user is approved.
 *
 * `requireVerification()` returns true when the user may proceed; otherwise it
 * opens an explanatory modal (with a shortcut into the selfie-capture flow when
 * a submission is still needed) and returns false. Render `modals` once in the
 * consuming component.
 */
export const useVerificationGate = (
    userData: User | null | undefined,
    refetchUserData: () => void,
) => {
    const [showGate, setShowGate] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);

    const isVerified = userData?.is_approved === true;
    const isPending = userData?.face_verification?.status === 'pending_review';

    const requireVerification = (): boolean => {
        if (isVerified) return true;
        setShowGate(true);
        return false;
    };

    const modals: ReactNode = (
        <>
            <VerificationGateModal
                show={showGate}
                isPending={isPending}
                onClose={() => setShowGate(false)}
                onVerify={() => {
                    setShowGate(false);
                    setShowFaceModal(true);
                }}
            />
            <FaceVerificationModal
                show={showFaceModal}
                onCloseModal={() => setShowFaceModal(false)}
                refetchUserData={refetchUserData}
            />
        </>
    );

    return { isVerified, isPending, requireVerification, modals };
};
