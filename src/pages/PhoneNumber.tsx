import { zodResolver } from "@hookform/resolvers/zod"
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import {
    collection, getDocs, query, where, doc, getDoc
} from 'firebase/firestore'
import { AnimatePresence, motion } from "framer-motion"
import React, { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import OtpInput from 'react-otp-input'
import PhoneInput, { isPossiblePhoneNumber } from "react-phone-number-input"
import { Link, useNavigate } from "react-router-dom"
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
import { phoneOnOtherAccountMessage, phoneSignInErrorMessage, withTypedDialCode } from "@/utils/phoneNumber"


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

/** Seconds before "Resend code" can be used. Matches the mobile app. */
const RESEND_AFTER_SECONDS = 59

/**
 * Sends a sign-in code by SMS. Each send gets its own invisible reCAPTCHA in
 * an element of its own, removed afterwards. reCAPTCHA remembers every
 * element it has rendered into, even after clear(), so reusing one threw
 * "reCAPTCHA has already been rendered" and broke every retry and resend.
 */
const usePhoneCodeSender = () => {
    const cleanups = useRef(new Set<() => void>())
    useEffect(() => () => cleanups.current.forEach(clean => clean()), [])

    return async (phoneNumber: string) => {
        const host = document.createElement('div')
        document.body.appendChild(host)
        const verifier = new RecaptchaVerifier(auth, host, { 'size': 'invisible' })
        const clean = () => {
            verifier.clear()
            host.remove()
            cleanups.current.delete(clean)
        }
        cleanups.current.add(clean)
        try {
            return await signInWithPhoneNumber(auth, phoneNumber, verifier)
        } finally {
            clean()
        }
    }
}

const FillInPhoneNumber: React.FC<PhoneNumberPageProps> = ({ advance, key }) => {
    const phone_number = usePhoneNumberStore(state => state.phone_number)
    const setVerificationId = usePhoneNumberStore(state => state.setVerificationId)
    const setConfirmationResult = usePhoneNumberStore(state => state.setConfirmationResult)
    const [loading, setLoading] = useState(false)

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
    const sendCode = usePhoneCodeSender()

    const onFormSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            setRequestError('')
            const confirmationResult = await sendCode(data.phone_number!);
            setVerificationId(confirmationResult.verificationId)
            setConfirmationResult(confirmationResult)
            advance()
            setPhoneNumber(data.phone_number!)
            updateAccountSetupUserData({ phone_number: data.phone_number! })

        } catch (err: unknown) {
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
            console.log('phone sign-in failed', code, err)
            setRequestError(phoneSignInErrorMessage(code))
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
                                <PhoneInput ref={ref} international defaultCountry='US' placeholder="Phone Number" onChange={(value) => { if (value == undefined) onChange(''); onChange(withTypedDialCode(value)) }} onBlur={onBlur} value={value as string} className={`PhoneInput ${errors?.phone_number?.message && `PhoneInput--error`}`} />
                                <div className='error-message-container'><motion.span animate={{ opacity: errors?.phone_number?.message ? 1 : 0, transition: { duration: 0.2 } }} className="error-message">{errors?.phone_number?.message as string}</motion.span></div>
                            </>
                        )}
                    />
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
    // Set when the number is on an account that signs in another way.
    const [phoneOnOtherAccount, setPhoneOnOtherAccount] = useState(false)
    const phone_number = usePhoneNumberStore(state => state.phone_number)
    const setVerificationId = usePhoneNumberStore(state => state.setVerificationId)
    const setConfirmationResult = usePhoneNumberStore(state => state.setConfirmationResult)
    const sendCode = usePhoneCodeSender()
    const [secondsLeft, setSecondsLeft] = useState(RESEND_AFTER_SECONDS)
    const [resending, setResending] = useState(false)

    // The "Resend code in Ns" countdown. It used to be fixed text that
    // always said 20s, and Resend did nothing.
    useEffect(() => {
        if (secondsLeft <= 0) return
        const tick = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
        return () => clearTimeout(tick)
    }, [secondsLeft])

    const onResend = async () => {
        if (secondsLeft > 0 || resending) return
        try {
            setResending(true)
            setRequestError('')
            const result = await sendCode(phone_number)
            setVerificationId(result.verificationId)
            setConfirmationResult(result)
            setSecondsLeft(RESEND_AFTER_SECONDS)
        } catch (err: unknown) {
            const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
            console.log('resending the code failed', code, err)
            setRequestError(phoneSignInErrorMessage(code))
        } finally {
            setResending(false)
        }
    }
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

            const ownDoc = await getDoc(doc(db, "users", verificationData.user.uid));
            if (!ownDoc.exists()) {
                // The number may already belong to an account that signs in
                // another way and has not linked it, so this sign-in made a
                // separate, empty login. This check used to run before
                // sign-in, which needed the users collection readable by
                // anyone; now that we are signed in it is an ordinary query.
                // The empty login is removed so it does not linger.
                const sameNumber = await getDocs(query(collection(db, "users"), where("phone_number", "==", verificationData.user.phoneNumber)));
                const otherAccount = sameNumber.docs.find(d => d.data().auth_provider !== 'phone')
                if (otherAccount) {
                    await verificationData.user.delete()
                    setPhoneOnOtherAccount(true)
                    setRequestError(phoneOnOtherAccountMessage(otherAccount.data().auth_provider))
                    return
                }
            }
            // The number signed in to an existing account. That includes an
            // account made with email, Google or Apple whose number the
            // mobile app verified and linked: it is the same login, so it is
            // treated as theirs whatever it first signed up with. These used
            // to be sent to account setup as new phone accounts.
            if (ownDoc.exists()) {
                const user = ownDoc.data()
                if (!user.has_completed_account_creation) {
                    navigate('/auth/account-setup')
                    setId(verificationData.user.uid)
                    setUserId(verificationData.user.uid)
                    setAuthProvider(user.auth_provider ?? 'phone')
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
            } else if (code === 'auth/code-expired') {
                setRequestError('This code has expired. Go back and request a new one.')
            } else {
                // Anything else used to leave the screen with no message.
                setRequestError(code === 'auth/network-request-failed'
                    ? 'No connection. Check your internet and try again.'
                    : "We couldn't check your code. Please try again.")
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
                    <p className="auth-page__modal__otp-input__notifier">
                        Didn’t receive the code?{' '}
                        <button type="button" onClick={onResend} disabled={secondsLeft > 0 || resending}
                            className={`auth-page__modal__otp-input__notifier__cta ${secondsLeft > 0 || resending ? 'disabled' : ''}`}>
                            {resending ? 'Sending…' : 'Resend code'}
                        </button>
                        {secondsLeft > 0 && <> in {secondsLeft}s</>}
                    </p>
                    <Button loading={loading} disabled={!isValid} className='auth-page__modal__form__button' text='Verify' />
                    {phoneOnOtherAccount && (
                        <p className='auth-page__modal__form__cta'>Signed up another way? <Link to="/auth/login" className='underline'>Go to log in</Link></p>
                    )}
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