import { FC } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface VerificationGateModalProps {
    show: boolean;
    // True when the user has already submitted a selfie that's awaiting review,
    // so we tell them to wait rather than offering to submit again.
    isPending: boolean;
    onClose: () => void;
    onVerify: () => void;
}

const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

/**
 * Shown when an unverified user tries to like or message someone. Explains the
 * verification requirement and, unless a review is already pending, offers a
 * button that takes them straight into the selfie-capture flow.
 */
export const VerificationGateModal: FC<VerificationGateModalProps> = ({ show, isPending, onClose, onVerify }) => {
    return (
        <AnimatePresence mode="wait">
            {show && (
                <motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} transition={{ duration: 0.3 }} className="fixed inset-0 flex justify-center items-center z-50 bg-[#b9b9b9] bg-opacity-50 w-full h-screen">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white z-[9999] py-[3rem] px-[4rem] rounded-[2rem] max-w-[44rem] text-center space-y-[2rem]">
                        <div className="flex justify-center">
                            <img src="/assets/icons/verified.svg" alt="" className="w-[6rem] h-[6rem]" />
                        </div>
                        <h1 className="text-[2.6rem] font-bold">
                            {isPending ? 'Selfie under review' : 'Verify it’s really you'}
                        </h1>
                        <p className="text-[1.6rem] text-[#8A8A8E] leading-[140%]">
                            {isPending
                                ? 'Your verification selfie is being reviewed. You’ll be able to like and message people once it’s approved.'
                                : 'To keep Whossy safe, you need a verified selfie before you can like or message people. It only takes a moment.'}
                        </p>
                        <div className="flex gap-x-4">
                            <button
                                onClick={onClose}
                                className="bg-[#F6F6F6] py-[1.3rem] w-full text-[1.6rem] font-bold rounded-lg hover:bg-[#ececec] transition-all duration-300 cursor-pointer">
                                {isPending ? 'Got it' : 'Not now'}
                            </button>
                            {!isPending && (
                                <button
                                    onClick={onVerify}
                                    className="bg-gradient-to-br from-orange-400 to-red text-white py-[1.3rem] w-full text-[1.6rem] font-bold rounded-lg hover:opacity-70 transition-all duration-300 whitespace-nowrap cursor-pointer">
                                    Take selfie
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
