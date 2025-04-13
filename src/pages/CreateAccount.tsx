import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ZodType, z } from 'zod';
import AlternateSignupOptions from '../components/auth/AlternateSignupOptions';
import AuthInput from '../components/auth/AuthInput';
import AuthModalBackButton from '../components/auth/AuthModalBackButton';
import AuthModalHeader from '../components/auth/AuthModalHeader';
import AuthModalRequestMessage from '../components/auth/AuthModalRequestMessage';
import AuthPage from '../components/auth/AuthPage';
import { auth, db } from '@/firebase';
import { signInWithGoogle } from '../firebase/auth';
import useAccountSetupFormStore from '../store/AccountSetup';
import { FormData } from '../types/auth';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/UserId';
import { serverTimestamp } from 'firebase/firestore';

type FirebaseErrorCodes = 'auth/email-already-in-use' | 'auth/network-request-failed';
const errorMessages: Record<FirebaseErrorCodes, string> = {
    'auth/email-already-in-use': "Account already exists",
    'auth/network-request-failed': "Poor Internet Connection",
};

const CreateAccountFormSchema: ZodType<FormData> = z
    .object({
        email: z.string().email("Email is invalid").min(1, "Email is required"),
        password: z.string()
            .min(8, "Password is too short")
            .max(20, "Password is too long")
            .regex(/\d/, "Password must contain at least one digit")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

const CreateAccount = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(CreateAccountFormSchema),
        mode: 'onBlur',
    });

    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState("");
    const setId = useAccountSetupFormStore(state => state.setId)
    const setUserId = useAccountSetupFormStore((state) => state.setUserId);
    const setNames = useAccountSetupFormStore((state) => state.setNames);
    const setAuthProvider = useAccountSetupFormStore((state) => state.setAuthProvider);
    const { setAuth } = useAuthStore();

    const handleUserDocument = async (user: any, authProvider: string, firstName?: string, lastName?: string) => {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const result = await getDocs(q);

        if (result.docs.length === 0) {
            setUserId(user.uid);
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                auth_provider: authProvider == 'email' ? "local" : authProvider,
                email: user.email,
                first_name: firstName || "",
                last_name: lastName || "",
                has_completed_account_creation: false,
                has_completed_onboarding: false,
                is_approved: false,
                created_at: serverTimestamp(),
            });
            setId(user.uid);
            setAuthProvider(authProvider);
            navigate('/auth/account-setup');
        } else {
            const existingUser = result.docs[0].data();
            console.log(existingUser)

            if (!existingUser.has_completed_account_creation) {
                setUserId(user.uid);
                setNames({
                    first_name: existingUser.first_name,
                    last_name: existingUser.last_name,
                });
                navigate('/auth/account-setup');
            } else if (!existingUser.has_completed_onboarding) {
                setAuth({ uid: user.uid, has_completed_onboarding: existingUser.has_completed_onboarding }, user);
                navigate('/onboarding');
            } else {
                setAuth({ uid: user.uid, has_completed_onboarding: existingUser.has_completed_onboarding }, user);
                navigate('/dashboard/user-profile');
            }
        }
    };

    const onEmailAndPasswordSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email as string, data.password as string);
            await handleUserDocument(userCredential.user, 'email');
        } catch (error: any) {
            setRequestError(errorMessages[error.code as FirebaseErrorCodes] || 'Something Went Wrong');
        } finally {
            setLoading(false);
        }
    };

    const onGoogleSignIn = async (res: any) => {
        setLoading(true);
        try {
            const [firstName, lastName] = res.user.displayName?.split(" ") || ["", ""];
            await handleUserDocument(res.user, 'google', firstName, lastName);
        } catch (error) {
            console.error(error);
            setRequestError("Could Not Sign In With Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthPage className='create-account-home'>
            <div className='auth-page__modal'>
                <AnimatePresence>
                    {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
                </AnimatePresence>
                <AuthModalBackButton onClick={() => navigate(-1)} />
                <AuthModalHeader title='Create Account' subtitle="Your perfect match is a swipe away :)" />
                <form onSubmit={handleSubmit(onEmailAndPasswordSubmit)} className='auth-page__modal__form'>
                    <AuthInput register={register} error={errors.email} name='email' type='email' placeholder='Your Email' />
                    <AuthInput register={register} error={errors.password} name='password' type='password' placeholder='Password' />
                    <AuthInput register={register} error={errors.confirmPassword} name='confirmPassword' type='password' placeholder='Confirm Password' />
                    <button disabled={loading} className='w-full rounded-[0.8rem] bg-[#F2243E] py-6 text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:opacity-70 transition-all duration-200 mt-3 flex items-center justify-center'>
                        {loading ? <motion.img key="loading-image" className='button__loader' src='/assets/icons/loader.gif' /> : "Create Account"}
                    </button>
                </form>
                <AlternateSignupOptions google={() => signInWithGoogle(onGoogleSignIn)} phone={() => navigate('/auth/phone-number')} text='or sign up with' />
                <div className="auth-page__modal__terms-and-conditions">
                    By clicking on “Login” you agree to our <Link to="/privacy-policy">Privacy Policy</Link>. Learn how we process your data in our <Link to="/privacy-policy">Privacy Policy</Link>.
                </div>
            </div>
        </AuthPage>
    );
};

export default CreateAccount;
