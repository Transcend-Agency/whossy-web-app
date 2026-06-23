import React, { useState } from 'react';
import AuthPage from '../components/auth/AuthPage';
import AuthModalBackButton from '../components/auth/AuthModalBackButton';
import AuthModalHeader from '../components/auth/AuthModalHeader';
import AuthInput from '../components/auth/AuthInput';
import Button from '../components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ZodType, z } from 'zod';
import { auth, db } from "@/firebase";
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AuthModalRequestMessage from '../components/auth/AuthModalRequestMessage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion'
import { FormData } from '../types/auth';

interface ForgotPasswordPage {
    advance: () => void
    goBack: () => void
    key: string
}

const ForgotPasswordFormSchema: ZodType<{ email?: string }> = z
    .object({
        email: z.string().min(1, { message: "Email is required" }).email({ message: "Email is invalid" }),
    })


const ForgotPasswordInputPage: React.FC<ForgotPasswordPage> = ({ advance, key }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ email?: string }>({
        resolver: zodResolver(ForgotPasswordFormSchema),
        mode: 'onChange'
    });
    const [loading, setLoading] = useState(false)
    const [requestError, setRequestError] = useState('')
    const navigate = useNavigate()

    const onGoBack = () => {
        navigate(-1)
    }

    const onFormSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            const q = query(collection(db, "users"), where("email", "==", data.email));
            const result = await getDocs(q);
            if (result.docs.length == 0) {
                throw new Error("Account Does Not Exist")
            }
            await sendPasswordResetEmail(auth, data.email as string, {
                url: `${import.meta.env.VITE_APP_FRONTEND_URL}/auth/login`
            });
            advance()
        } catch (err: unknown) {
            if (err instanceof Error) {
                setRequestError(err.message)
            } else {
                setRequestError("Something Went Wrong...")
            }
            console.log(err)
        } finally {
            setLoading(false)
        }
    }
    return <AuthPage identifier={key} className='forgot-password'>
        <div className='auth-page__modal'>
            <AnimatePresence mode='wait'>
                {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
            </AnimatePresence>
            <AuthModalBackButton onClick={onGoBack} />
            <AuthModalHeader title='Forgot your password?' subtitle="Enter your email below, and we'll send you instructions to reset your password." />
            <form onSubmit={handleSubmit(onFormSubmit)} className='auth-page__modal__form'>
                <AuthInput error={errors.email} name='email' register={register} placeholder='Your Email' />
                <Button loading={loading} className='auth-page__modal__form__button' text='Verify' />
            </form>
        </div>
    </AuthPage>
}

const ForgotPasswordSuccessPage: React.FC<ForgotPasswordPage> = ({ key, goBack }) => {
    const navigate = useNavigate()

    return <AuthPage identifier={key} className='forgot-password'>
        <div className='auth-page__modal'>
            <AuthModalBackButton onClick={goBack} />
            <AuthModalHeader title='Successful' subtitle="A link has been sent to your email to reset your password." />
            <Button onClick={() => navigate('/auth/login')} className='auth-page__modal__form__button' text='Close' />
        </div>
    </AuthPage>
}

const ForgotPassword = () => {
    const [currentPage, setCurrentPage] = useState(0)
    const pageOrder = ['forgot-password', 'success']

    const advance = () => {
        setCurrentPage(currentPage + 1)
    }
    const goBack = () => {
        setCurrentPage(currentPage - 1)
    }

    return <motion.div initial={{}} exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.2 } }}>
        <AnimatePresence mode='wait'>
            {pageOrder[currentPage] == 'forgot-password' && <ForgotPasswordInputPage key="forgot-password" advance={advance} goBack={goBack} />}
            {pageOrder[currentPage] == 'success' && <ForgotPasswordSuccessPage key="forgot-password" advance={advance} goBack={goBack} />}
        </AnimatePresence>
    </motion.div>
}

export default ForgotPassword;