import { zodResolver } from "@hookform/resolvers/zod"
import { RecaptchaVerifier, getAuth, signInWithPhoneNumber } from 'firebase/auth'
import {
    collection,
    getDocs, query,
    where
} from 'firebase/firestore'
import { AnimatePresence, motion } from "framer-motion"
import React, { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import OtpInput from 'react-otp-input'
import PhoneInput, { isPossiblePhoneNumber } from "react-phone-number-input"
import { useNavigate } from "react-router-dom"
import { ZodType, z } from "zod"
import AuthModalBackButton from "../components/auth/AuthModalBackButton"
import AuthModalHeader from "../components/auth/AuthModalHeader"
import AuthModalRequestMessage from "../components/auth/AuthModalRequestMessage"
import AuthPage from "../components/auth/AuthPage"
import Button from "../components/ui/Button"
import { auth, db } from "@/firebase"
import useAccountSetupFormStore from "../store/AccountSetup"
import usePhoneNumberStore from "../store/PhoneNumberSignIn"
import { FormData } from "../types/auth"


interface PhoneNumberProps {
}

interface PhoneNumberPageProps {
    advance: () => void
    goBack: () => void
    key: string
}

const PhoneNumberFormSchema: ZodType<{ phone_number: string }> = z
    .object({
        phone_number: z.string().min(4, { message: "Phone Number is required" }),
    })
    .refine((data) => isPossiblePhoneNumber(data.phone_number), {
        message: "Please Enter a Valid Phone Number",
        path: ["phone_number"], // path of error
    })

const VerifyCodeSchema: ZodType<{ code: string }> = z
    .object({
        code: z.string().min(6, { message: "OTP should be 6 digits" }),
    })

const FillInPhoneNumber: React.FC<PhoneNumberPageProps> = ({ advance, key }) => {
    const phone_number = usePhoneNumberStore(state => state.phone_number)
    const setVerificationId = usePhoneNumberStore(state => state.setVerificationId)
    const setConfirmationResult = usePhoneNumberStore(state => state.setConfirmationResult)
    const [loading, setLoading] = useState(false)
    const firebaseAuth = getAuth();

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(PhoneNumberFormSchema),
        mode: 'onChange',
        defaultValues: {
            phone_number
        }
    });
    const setPhoneNumber = usePhoneNumberStore(state => state.setPhoneNumber)
    const updateAccountSetupUserData = useAccountSetupFormStore(state => state.updateUserData)
    const [requestError, setRequestError] = useState('')
    const onFormSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            const q = query(collection(db, "users"), where("phone_number", "==", data.phone_number));
            const result = await getDocs(q);
            if (result.docs.length !== 0 && result.docs[0].data().auth_provider !== 'phone') {
                setRequestError("Sign In Using Another Method")
            } else {
                console.log(data.phone_number, firebaseAuth)
                const recaptcha = new RecaptchaVerifier(auth, 'recaptcha', {
                    'size': 'invisible',
                    'callback': () => {
                        // reCAPTCHA solved, allow signInWithPhoneNumber.
                        // onSignInSubmit();
                        console.log('captcha solved')
                    }
                    // 'expired-callback': () => {
                    //     grecaptcha.reset(window.recaptchaWidgetId);
                    // }
                })
                const confirmationResult = await signInWithPhoneNumber(
                    auth,
                    data.phone_number!,
                    recaptcha
                );
                setVerificationId(confirmationResult.verificationId)
                setConfirmationResult(confirmationResult)
                console.log(confirmationResult)
                advance()
                setPhoneNumber(data.phone_number!)
                updateAccountSetupUserData({ phone_number: data.phone_number! })
            }

        } catch (err: unknown) {
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : undefined;
            console.log(code)
            if (code === 'auth/invalid-phone-number') {
                setRequestError("Invalid Phone Number")
            } else if (code === 'auth/invalid-app-credential') {
                setRequestError("Phone Number Sign In Is Down")
            } else {
                setRequestError('Something Went Wrong')
            }
        } finally { setLoading(false) }

    }
    return (
        <AuthPage identifier={key} className='create-account-home'>
            <div className='auth-page__modal'>
                <AnimatePresence mode='wait'>
                    {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
                </AnimatePresence>
                <AuthModalBackButton />
                <AuthModalHeader title='Welcome to Whossy, Let’s get you Started' subtitle="Ensure to enter the correct data as some will appear on your profile." />
                <form onSubmit={handleSubmit(onFormSubmit)} className='auth-page__modal__form'>
                    <Controller control={control} name={"phone_number"}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <>
                                <PhoneInput ref={ref} international defaultCountry='US' placeholder="Phone Number" onChange={(value) => { if (value == undefined) onChange(''); onChange(value) }} onBlur={onBlur} value={value as string} className={`PhoneInput ${errors?.phone_number?.message && `PhoneInput--error`}`} />
                                <div className='error-message-container'><motion.span animate={{ opacity: errors?.phone_number?.message ? 1 : 0, transition: { duration: 0.2 } }} className="error-message">{errors?.phone_number?.message as string}</motion.span></div>
                            </>
                        )}
                    />
                    <div id="recaptcha"></div>
                    <Button loading={loading} className='auth-page__modal__form__button' text='Continue' />
                </form>
            </div>
        </AuthPage>
    )
}

const FillInPhoneNumberOtp: React.FC<PhoneNumberPageProps> = ({ goBack, key }) => {
    const verification_id = usePhoneNumberStore(state => state.verification_id)
    const confirmationResult = usePhoneNumberStore(state => state.confirmationResult)
    const setId = useAccountSetupFormStore(state => state.setId)
    const setUserId = useAccountSetupFormStore(state => state.setUserId)
    const setAuthProvider = useAccountSetupFormStore(state => state.setAuthProvider)
    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState('')
    const navigate = useNavigate()

    const {
        handleSubmit,
        control,
        formState: { isValid },
    } = useForm<FormData>({
        resolver: zodResolver(VerifyCodeSchema),
        mode: 'onBlur',
        defaultValues: {
            code: ''
        }
    });
    const onFormSubmit = async (data: FormData) => {
        try {
            // console.log(data.phone_number, confirmationResult)
            console.log(confirmationResult, verification_id)
            setLoading(true)
            const verificationData = await confirmationResult.confirm(data.code!)

            const q = query(collection(db, "users"), where("uid", "==", verificationData.user.uid));
            const result = await getDocs(q);
            console.log(result)
            if (result.docs.length !== 0 && result.docs[0].data().auth_provider == 'phone') {
                const user = result.docs[0].data()
                if (!user.has_completed_account_creation) {
                    navigate('/auth/account-setup')
                    setId(verificationData.user.uid)
                    setUserId(verificationData.user.uid)
                    setAuthProvider('phone')
                } else if (!user.has_completed_onboarding) {
                    navigate('/onboarding')
                } else {
                    navigate('/dashboard')
                }
            } else {
                setId(verificationData.user.uid)
                setUserId(verificationData.user.uid)
                setAuthProvider('phone')
                console.log(verificationData)
                navigate('/auth/account-setup')
            }

        } catch (err: unknown) {
            console.log(err)
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : undefined;
            if (code === 'auth/invalid-verification-code') {
                setRequestError('Invalid Authentication Code')
                setTimeout(() => {
                    setRequestError('')
                }, 2000)
            }
        } finally {
            setLoading(false)
        }

    }
    return (
        <AuthPage identifier={key} className='create-account-home'>
            <div className='auth-page__modal'>
                <AnimatePresence mode='wait'>
                    {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
                </AnimatePresence>
                <AuthModalBackButton onClick={goBack} />
                <AuthModalHeader title='Phone number Sign in' subtitle="Enter the OTP sent to your number below" />
                <form onSubmit={handleSubmit(onFormSubmit)} className='auth-page__modal__form'>
                    <Controller control={control} name={"code"}
                        render={({ field: { onChange, value } }) => (
                            <>
                                <OtpInput
                                    value={value}
                                    onChange={(value) => {
                                        console.log(value)
                                        if (['1', '2', '3', '4', '5', '6', '6', '7', '8', '9', '0'].includes(value[value.length - 1]) || value == '')
                                            onChange(value)
                                    }}

                                    numInputs={6}
                                    containerStyle={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr' }}
                                    renderInput={(props) => <input {...props} style={{}} className={`auth-page__modal__otp-input__box ${props.value && 'auth-page__modal__otp-input__box--filled'}`} />}
                                />
                            </>
                        )}
                    />
                    <p className="auth-page__modal__otp-input__notifier">Didn’t receive the code? <span className="auth-page__modal__otp-input__notifier__cta">Resend code</span> in 20s</p>
                    <Button loading={loading} disabled={!isValid} className='auth-page__modal__form__button' text='Verify' />
                </form>
            </div>
        </AuthPage>
    )
}

const PhoneNumber: React.FC<PhoneNumberProps> = () => {
    const [currentPage, setCurrentPage] = useState(0)
    const pageOrder = ['phone_number', 'verification-code']
    const advance = () => {
        setCurrentPage(currentPage + 1)
    }
    const goBack = () => {
        setCurrentPage(currentPage - 1)
    }
    return (
        <motion.div exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.2 } }}>
            <AnimatePresence mode='wait'>
                {pageOrder[currentPage] == 'phone_number' && <FillInPhoneNumber key="create-account-names" advance={advance} goBack={goBack} />}
                {pageOrder[currentPage] == 'verification-code' && <FillInPhoneNumberOtp key="create-account-countries" advance={advance} goBack={goBack} />}
            </AnimatePresence>
        </motion.div>
    )
}
export default PhoneNumber;