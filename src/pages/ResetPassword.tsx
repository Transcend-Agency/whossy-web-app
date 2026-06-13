import { zodResolver } from '@hookform/resolvers/zod';
import { confirmPasswordReset } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ZodType, z } from 'zod';
import AuthInput from '../components/auth/AuthInput';
import AuthModalBackButton from '../components/auth/AuthModalBackButton';
import AuthModalHeader from '../components/auth/AuthModalHeader';
import AuthModalRequestMessage from '../components/auth/AuthModalRequestMessage';
import AuthPage from '../components/auth/AuthPage';
import ResetPasswordRequirementParameter from '../components/auth/ResetPasswordRequirementParameter.tsx';
import Button from '../components/ui/Button';
import { auth } from '@/firebase';
import { FormData } from '../types/auth';

type ResetPasswordProps = Record<string, never>;

interface ResetPasswordPage {
    advance: () => void
    goBack: () => void
    key: string
}

const ResetPasswordFormSchema: ZodType<FormData> = z
    .object({
        password: z
            .string()
            .min(8, { message: "Password is too short" })
            .max(20, { message: "Password is too long" })
            .regex(/\d/, { message: "Password must contain at least one digit" })
            .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
        confirmPassword: z.string()
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // path of error
    });

const ResetPasswordDetails: React.FC<ResetPasswordPage> = ({ advance, goBack }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        watch
    } = useForm<FormData>({
        resolver: zodResolver(ResetPasswordFormSchema),
        mode: 'onChange',
    });
    const [searchParams] = useSearchParams();
    const [requestError, setRequestError] = useState("")
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    const onGoToLogin = () => {
        goBack()
        navigate("/auth/login")
    }

    const onFormSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            console.log(searchParams.get('oobCode'))
            const oobCode = searchParams.get('oobCode')
            if (!oobCode) {
                setRequestError('Link Has Expired')
                return
            }
            const result = await confirmPasswordReset(auth, oobCode, data.password!)
            advance()
            console.log(result)
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'code' in err && err.code == 'auth/invalid-action-code') {
                setRequestError('Link Has Expired')
            } else {
                setRequestError('Something Went Wrong')
            }
        }
        finally {
            setLoading(false)
        }

    }
    const password = watch('password')
    useEffect(() => {
        console.log(errors, isValid)
    }, [password])
    const validatePassword = (password: string) => {
        const hasEnoughCharacters = (password?.length ?? 0) >= 8
        const hasLowerAndUpperCaseLetters = /^(?=.*[a-z])(?=.*[A-Z]).*$/
        const hasDigit = /\d/
        const hasSpecialCharacter = /[^A-Za-z0-9]/

        return {
            hasEnoughCharacters,
            hasLowerAndUpperCaseLetters: hasLowerAndUpperCaseLetters.test(password),
            hasDigit: hasDigit.test(password),
            hasSpecialCharacter: hasSpecialCharacter.test(password)
        }
    }

    return <AuthPage className='reset-password'>
        <div className='auth-page__modal'>
            <AnimatePresence mode='wait'>
                {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
            </AnimatePresence>
            <AuthModalBackButton onClick={onGoToLogin} />
            <AuthModalHeader title='Reset your password' subtitle="Choose a new password that you can easily remember." />
            <form onSubmit={handleSubmit(onFormSubmit)} className='auth-page__modal__form'>
                <AuthInput register={register} name="password" type='password' placeholder='Password' />
                <div className='auth-page__modal__password-requirements'>
                    <ResetPasswordRequirementParameter criteriaPassed={validatePassword(password!).hasEnoughCharacters} text="Be at least 8 characters or more" />
                    <ResetPasswordRequirementParameter criteriaPassed={validatePassword(password!).hasLowerAndUpperCaseLetters} text="At least 1 uppercase and lower case letter" />
                    <ResetPasswordRequirementParameter criteriaPassed={validatePassword(password!).hasDigit} text="Must contain a digit or number" />
                    <ResetPasswordRequirementParameter criteriaPassed={validatePassword(password!).hasSpecialCharacter} text="Must contain a special character e,g '@$!%*?&'." />
                </div>
                <AuthInput error={errors.confirmPassword} register={register} name="confirmPassword" type='password' placeholder='Confirm Password' />
                <Button loading={loading} disabled={!isValid} className='auth-page__modal__form__button' text='Submit' />
            </form>
        </div>
    </AuthPage>
}

const ResetPasswordSuccessPage: React.FC<ResetPasswordPage> = ({ key, advance }) => {
    const navigate = useNavigate()
    const onGoToLogin = () => {
        advance()
        navigate("/auth/login")
    }

    return <AuthPage identifier={key} className='reset-password'>
        <div className='auth-page__modal'>
            <figure className='auth-page__modal__success-icon'><img src="/assets/images/success.png" alt={``} /></figure>
            <AuthModalHeader title='Reset Password Successful' subtitle="Password reset successful continue on the app or sign in with web." />
            <Button onClick={onGoToLogin} className='auth-page__modal__form__button' text='Close' />
        </div>
    </AuthPage>
}

const ResetPassword: React.FC<ResetPasswordProps> = () => {
    const [currentPage, setCurrentPage] = useState(0)
    const pageOrder = ['reset-password', 'success']

    const advance = () => {
        setCurrentPage(currentPage + 1)
    }
    const goBack = () => {
        setCurrentPage(currentPage - 1)
    }

    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2 } }} exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.2 } }}>
        <AnimatePresence mode='wait'>
            {pageOrder[currentPage] == 'reset-password' && <ResetPasswordDetails key="forgot-password" advance={advance} goBack={goBack} />}
            {pageOrder[currentPage] == 'success' && <ResetPasswordSuccessPage key="forgot-password" advance={advance} goBack={goBack} />}
        </AnimatePresence>
    </motion.div>
}

export default ResetPassword;