import { getAuth, sendEmailVerification } from 'firebase/auth';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Countdown from 'react-countdown';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthModalHeader from './AuthModalHeader';
import AuthModalRequestMessage from './AuthModalRequestMessage';
import AuthPage from './AuthPage';
import useAccountSetupFormStore from "@/store/AccountSetup.tsx";
import {useAuthStore} from "@/store/UserId.tsx";
import {doc, getDoc} from "firebase/firestore";
import {db} from "@/firebase";

const EmailVerification = () => {
    const [canResendCode, setCanResendCode] = useState(false);
    const auth = getAuth();
    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState('');
    const navigate = useNavigate();
    const id = useAccountSetupFormStore(state => state.userData.uid)
    const { setAuth } = useAuthStore()

    const renderer = ({ seconds, completed }: { seconds: number; completed: boolean }) => {
        if (completed) setCanResendCode(true);
        return <> in {seconds}s</>;
    };

    const onResendCodeClick = async () => {
        setCanResendCode(false);
        try {
            await sendEmailVerification(auth.currentUser!, {
                url: `${import.meta.env.VITE_APP_FRONTEND_URL}/auth/login`
            });
        } catch (error) {
            setRequestError("Failed to resend verification email. Please try again.");
        }
    };

    // const onContinue = async () => {
    //     if (!auth.currentUser) {
    //         navigate('/auth/login');
    //         return;
    //     }
    //
    //     setLoading(true);
    //     try {
    //         await auth.currentUser.reload();
    //         if (auth.currentUser.emailVerified) {
    //             const userRef = doc(db, "users", id);
    //             const user = await getDoc(userRef)
    //
    //             setAuth({ uid: id, has_completed_onboarding: false }, user.data())
    //             navigate('/auth/finalize-setup')
    //             // navigate('/onboarding');
    //         } else {
    //             setRequestError('Please verify your email to continue.');
    //         }
    //     } catch (error) {
    //         setRequestError("An error occurred while checking verification. Please try again.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const onContinue = async () => {
        if (!auth.currentUser) {
            navigate('/auth/login');
            return;
        }

        setLoading(true);
        try {
            // Reload the user's authentication state
            await auth.currentUser.reload();

            // Check if the email is verified
            if (auth.currentUser.emailVerified) {
                const userRef = doc(db, "users", id);
                const user = await getDoc(userRef);

                // Update the auth store and navigate to the next page
                setAuth({ uid: id, has_completed_onboarding: false }, user.data());
                navigate('/auth/finalize-setup');
            } else {
                // If not verified, show an error message
                setRequestError('Please verify your email to continue.');
            }
        } catch (error) {
            setRequestError("An error occurred while checking verification. Please try again.");
            console.error("Error during email verification check:", error);
        } finally {
            setLoading(false);
        }
    };


    if (!auth.currentUser) {
        navigate('/auth/login');
    }

    return (
        <AuthPage className="email-verification">
            <div className="auth-page__modal pt-[30px]">
                <AnimatePresence mode="wait">
                    {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
                </AnimatePresence>
                <AuthModalHeader
                    title="Email Verification"
                    subtitle={`A verification link has been sent to your email ${auth.currentUser?.email
                        ?.split('@')[0]
                        .slice(0, 1)}********${auth.currentUser?.email?.split('@')[0].slice(-1)}@${
                        auth.currentUser?.email?.split('@')[1]
                    }. Kindly verify to complete account setup`}
                />
                <p className="auth-page__modal__otp-input__notifier">
                    Didn’t receive the code?{' '}
                    <span
                        onClick={canResendCode ? onResendCodeClick : () => {}}
                        className={`auth-page__modal__otp-input__notifier__cta ${!canResendCode && 'disabled'}`}
                    >
                        Resend code
                    </span>{' '}
                    {!canResendCode && (
                        <Countdown date={Date.now() + 40000} renderer={renderer} />
                    )}
                </p>
                <button
                    className="w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center"
                    onClick={onContinue}
                    disabled={loading}
                >
                    {!loading ? (
                        "Continue"
                    ) : (
                        <motion.img
                            key="loading-image"
                            className="button__loader"
                            src="/assets/icons/loader.gif"
                        />
                    )}
                </button>
            </div>
        </AuthPage>
    );
};

export default EmailVerification;
