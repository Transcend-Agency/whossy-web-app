/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore } from "@/store/UserId";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { Link, useNavigate } from 'react-router-dom';
import { ZodType, z } from "zod";
import AuthInput from '../components/auth/AuthInput';
import AuthModalBackButton from '../components/auth/AuthModalBackButton';
import AuthModalHeader from '../components/auth/AuthModalHeader';
import AuthModalRequestMessage from '../components/auth/AuthModalRequestMessage';
import AuthPage from '../components/auth/AuthPage';
import { auth, db } from "@/firebase";
import { signInWithGoogle } from '../firebase/auth';
import useAccountSetupFormStore from '../store/AccountSetup';
import { FormData } from "../types/auth";
// import { useGetSubscriptionCodeAndEmailToken, useUnsubscribe, useVerify } from "@/hooks/usePaystack";
// import toast from "react-hot-toast";

export const LoginFormSchema: ZodType<FormData> = z
    .object({
        email: z.string().min(1, { message: "Email is required" }).email({ message: "Email is invalid" }),
        password: z
            .string()
            .min(8, { message: "Password is too short" })
            .max(20, { message: "Password is too long" })
            .regex(/\d/, { message: "Password must contain at least one digit" })
            .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
    })

const Login = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(LoginFormSchema),
        mode: 'onBlur'
    });
    const [loading, setLoading] = useState(false)
    const [requestError, setRequestError] = useState("")
    const setNames = useAccountSetupFormStore(state => state.setNames)
    const setGender = useAccountSetupFormStore(state => state.setGender)
    const setCountryAndPhoneData = useAccountSetupFormStore(state => state.setCountryAndPhoneData)
    const setUserId = useAccountSetupFormStore(state => state.setUserId)
    const setId = useAccountSetupFormStore(state => state.setId)
    const setAuthProvider = useAccountSetupFormStore(state => state.setAuthProvider)
    const navigate = useNavigate()
    const [attemptedAuthUser, setAttemptedAuthUser] = useState<any>({})
    const { setAuth } = useAuthStore();
    // const { mutate: paystackReferenceQuery } = useVerify();
    // const subscriptionList = useGetSubscriptionCodeAndEmailToken();
    // const unsubscribeUser = useUnsubscribe();
    const onEmailAndPasswordSubmit = async (data: FormData) => {
        try {
            setLoading(true)

            // Authenticate the User If The Account Is An Email & Password Account
            const res = await signInWithEmailAndPassword(auth, data.email as string, data.password as string)
            // console.log(res)
            if (res.user) {
                const q = query(collection(db, "users"), where("uid", "==", res.user.uid as string));
                const result = await getDocs(q);
                if (result.docs.length == 1) {
                    const user = result.docs[0].data()
                    if (!user.has_completed_account_creation) {
                        setId(result.docs[0].id)
                        setUserId(user.uid)
                        setAuthProvider('email')
                        setNames({ first_name: user.first_name, last_name: user.last_name })
                        setGender('')
                        setCountryAndPhoneData({ phone_number: '', country_of_origin: '' })
                        navigate('/auth/account-setup')
                    } else if (!res.user.emailVerified) {
                        navigate('/auth/email-verification')
                    }
                    else if (!user.has_completed_onboarding) {
                        setAuth({ uid: res.user.uid, has_completed_onboarding: user.has_completed_onboarding }, user)
                        navigate('/onboarding')
                    } else {
                        setAuth({ uid: res.user.uid, has_completed_onboarding: user.has_completed_onboarding }, user);
                        navigate('/dashboard/explore')
                        // const userDocRef = doc(db, "users", res.user?.uid);
                        // if ( user.paystack.reference) {
                        //     const sk = user.currency == 'ngn' ? import.meta.env.VITE_PAYSTACK_SECRET_TEST_KEY_NGN : import.meta.env.VITE_PAYSTACK_SECRET_TEST_KEY_KES
                        //     paystackReferenceQuery({reference: user.paystack.reference as string, sk }, { onSuccess: async (paystackRes) => {
                        //     navigate('/dashboard/explore');
                        //     if ( paystackRes.data.status === "success" ) {

                        //         await updateDoc(userDocRef, { is_premium: true });

                        //         if (paystackRes.data.authorization.authorization_code !== user.paystack.authorization_code || paystackRes.data.customer.customer_code !== user.paystack.customer_code) {
                        //             await updateDoc(userDocRef, {
                        //                 paystack: {
                        //                     reference: user.paystack.reference,
                        //                     authorization_code: paystackRes.data.authorization.authorization_code,
                        //                     customer_code: paystackRes.data.customer.customer_code,
                        //                     customer_id: paystackRes.data.customer.id,
                        //                 }
                        //             }).then(() => {
                        //                 subscriptionList.mutate({ customer_id:paystackRes.data.customer.id, sk}, {
                        //                     onSuccess: async (subRes) => {
                        //                         try {
                        //                             console.log("Subscription Response:", subRes); // Debugging
                        //                             const subscriptionData = subRes?.data?.[0];

                        //                             if (!subscriptionData) {
                        //                                 console.error("No subscription data found.");
                        //                                 return;
                        //                             }

                        //                             // Update Firestore
                        //                             await updateDoc(userDocRef, {
                        //                                 paystack: {
                        //                                     reference: user.paystack.reference,
                        //                                     authorization_code: paystackRes.data.authorization.authorization_code,
                        //                                     customer_code: paystackRes.data.customer.customer_code,
                        //                                     customer_id: paystackRes.data.customer.id,
                        //                                     subscription_code: subscriptionData.subscription_code,
                        //                                     email_token: subscriptionData.email_token,
                        //                                     // status: "new",
                        //                                 },
                        //                             });
                        //                             console.log("Document updated successfully!");
                        //                         } catch (error) {
                        //                             console.error("Error updating Firestore document:", error);
                        //                         }
                        //                     },
                        //                     onError: (err) => {
                        //                         console.error("Error during mutation:", err);
                        //                     },
                        //                 });
                        //             });
                        //         }
                        //         else {
                        //             await updateDoc(userDocRef, {
                        //                 paystack: {
                        //                     reference: user.paystack.reference,
                        //                     authorization_code: user.paystack.authorization_code,
                        //                     customer_code: user.paystack.customer_code,
                        //                     customer_id: user.paystack.customer_id,
                        //                     subscription_code: user.paystack.subscription_code,
                        //                     email_token: user.paystack.email_token,
                        //                     status: "old",
                        //                 },
                        //             });
                        //         }
                        //     } else {
                        //         await updateDoc(userDocRef, {
                        //             is_premium: false,
                        //             paystack: {}
                        //         }).then(() => {
                        //             if (user.paystack.subscription_code || user.paystack.email_token) {
                        //                 unsubscribeUser.mutate({ code: user.paystack.subscription_code, token: user.paystack.email_token, sk }, {
                        //                     onSuccess: () => {
                        //                         console.log("User unsubscribed successfully!");
                        //                     },
                        //                     onError: () => {
                        //                         console.error("Error unsubscribing user!");
                        //                     },
                        //                 })
                        //             }
                        //     });
                        //         // console.log('This is not paystack');
                        //     }

                        // }, onError: () => toast.error('An error occurred while trying to verify payment') });} 
                        // else {
                        //     await updateDoc(userDocRef, {
                        //         is_premium: false
                        //     }).then(() => navigate('/dashboard/explore'))
                        // }
                    }
                }
            }
        } catch (error: any) {
            if ((error.code == 'auth/network-request-failed')) {
                setRequestError("Poor Internet Connection")
            }
            if (error.code == 'auth/invalid-credential') {
                setRequestError("Invalid Email or Password")
            }
            else {
                setRequestError("Something Went Wrong")
            }
        } finally {
            setLoading(false)
        }
    }

    const onGoogleSignIn = async (res: any) => {
        try {
            setLoading(true)
            setAttemptedAuthUser(res.user)
            console.log(attemptedAuthUser)
            const q = query(collection(db, "users"), where("uid", "==", res.user.uid));
            const result = await getDocs(q);
            if (result.docs.length === 0) {
                setNames({
                    first_name: res.user.displayName.split(" ")[0],
                    last_name: res.user.displayName.split(" ")[1],
                })
                await setDoc(doc(db, "users", res.user.uid), {
                    uid: res.user.uid,
                    first_name: res.user.displayName.split(" ")[0],
                    last_name: res.user.displayName.split(" ")[1],
                    auth_provider: "google",
                    email: res.user.email,
                    has_completed_account_creation: false,
                    has_completed_onboarding: false,
                    is_approved: false,
                    created_at: serverTimestamp()
                });
                setId(res.user.uid)
                navigate('/auth/account-setup')
            }
            else if (result.docs.length === 1) {
                const user = result.docs[0].data()
                console.log(user)
                if (!user.has_completed_account_creation) {
                    setId(result.docs[0].id)
                    setUserId(user.uid)
                    setNames({
                        first_name: user.first_name,
                        last_name: user.last_name
                    })
                    setGender('')
                    setCountryAndPhoneData({ phone_number: '', country_of_origin: '' })
                    navigate('/auth/account-setup')
                } else if (!res.user.emailVerified) {
                    navigate('/auth/email-verification')
                }
                else if (!user.has_completed_onboarding) {
                    setAuth({ uid: res.user.uid, has_completed_onboarding: user.has_completed_onboarding }, user)
                    navigate('/onboarding')
                } else {
                    setAuth({ uid: res.user.uid, has_completed_onboarding: user.has_completed_onboarding }, user)
                    navigate('/dashboard/explore')
                }
            }
        } catch (err) {
            console.log(attemptedAuthUser)
            console.log(err)
            setRequestError("Could Not Sign In With Google")
        }
        finally {
            setLoading(false)
        }
    }

    return <AuthPage className='login'>
        <div className='auth-page__modal'>
            <AnimatePresence mode='wait'>
                {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
            </AnimatePresence>
            <AuthModalBackButton onClick={() => navigate('/auth')} />
            <AuthModalHeader title='Welcome back' subtitle='login to see who you’ve matched with ✌' />
            <form
                onSubmit={handleSubmit(onEmailAndPasswordSubmit)}
                className='auth-page__modal__form'>
                <AuthInput register={register}
                    error={errors.email} name='email' type='email' placeholder='example@gmail.com' />
                <AuthInput name="password"
                    register={register}
                    error={errors.password} placeholder='password' type='password' />
                <button className='w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center'> {!loading ? "Login" : <motion.img key="loading-image" className='button__loader' src='/assets/icons/loader.gif' />} </button>
                <p className='auth-page__modal__form__cta'>Forgot Password? <Link to="/auth/forgot-password" className='underline'>Reset here</Link></p>
            </form>
            <div className='auth-page__modal__alternate-options'>
                <div className="auth-page__modal__alternate-options__divider">
                    <div></div>
                    <p>or</p>
                    <div></div>
                </div>
                <div className='auth-page__modal__alternate-options__container'>
                    <div onClick={() => signInWithGoogle(onGoogleSignIn)} className='auth-page__modal__alternate-options__item'><img src="/assets/icons/google.svg" /></div>
                    <div onClick={() => navigate('/auth/phone-number')} className='auth-page__modal__alternate-options__item'><img src="/assets/icons/phone.svg" /></div>
                </div>
            </div>
            <div className="auth-page__modal__terms-and-conditions">
                By clicking on “Login” you agree to our <Link to="/terms-and-conditions">Privacy Policy</Link>. Learn how we process your data in our <Link to="/privacy-policy">Privacy Policy</Link>.</div>

        </div>
    </AuthPage>
}
export default Login;