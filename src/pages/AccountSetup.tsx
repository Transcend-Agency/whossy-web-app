import { zodResolver } from '@hookform/resolvers/zod';
import { getAuth, sendEmailVerification, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import ReactFlagsSelect from "react-flags-select";
import { Controller, useForm } from 'react-hook-form';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import { default as Locale, default as en } from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';
import { useNavigate } from 'react-router-dom';
import { ZodType, z } from 'zod';
import AuthInput from '../components/auth/AuthInput';
import AuthModalBackButton from '../components/auth/AuthModalBackButton';
import AuthModalHeader from '../components/auth/AuthModalHeader';
import AuthModalRequestMessage from '../components/auth/AuthModalRequestMessage';
import AuthPage from '../components/auth/AuthPage';
import GenderButton from '../components/auth/GenderButton';
import { db } from "@/firebase";
import useAccountSetupFormStore from '../store/AccountSetup';
import { FormData } from '../types/auth';
import { useAuthStore } from '@/store/UserId';
// import firebase from "firebase/compat";
// import auth = firebase.auth;

interface AccountSetupFormPage {
    advance: () => void
    goBack: () => void
    pageKey: string
}

const AccountNamesFormSchema: ZodType<{ first_name: string; last_name: string }> = z
    .object({
        first_name: z.string().min(1, { message: "First Name is required" }),
        last_name: z.string().min(1, { message: "Last Name is required" }),
    })
const AccountCountriesFormSchema: ZodType<{ phone_number: string; country_of_origin: string }> = z
    .object({
        phone_number: z.string().min(4, { message: "Phone Number is required" }),
        country_of_origin: z.string().min(1, { message: "Country Of Origin is required" }),
    })
    .refine((data) => isPossiblePhoneNumber(data.phone_number), {
        message: "Please Enter a Valid Phone Number",
        path: ["phone_number"], // path of error
    })
const AccountCountriesFormSchemaForPhoneNumberAuthentication: ZodType<{ email: string; country_of_origin: string }> = z
    .object({
        email: z.string().min(1, { message: "Email is required" }).email({ message: "Email is invalid" }),
        country_of_origin: z.string().min(1, { message: "Country Of Origin is required" }),
    })
const AccountGenderFormSchema: ZodType<{ gender: string; }> = z
    .object({
        gender: z.string().min(1, { message: "Gender is required" }),
    })


const FillInAccountNames: React.FC<AccountSetupFormPage> = ({ advance, pageKey }) => {
    const first_name = useAccountSetupFormStore(state => state.userData.first_name)
    const last_name = useAccountSetupFormStore(state => state.userData.last_name)
    const setNames = useAccountSetupFormStore(state => state.setNames)
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(AccountNamesFormSchema),
        mode: 'onBlur',
        defaultValues: { first_name, last_name }
    });
    const onFormSubmit = (data: FormData) => {
        setNames({ first_name: data.first_name!, last_name: data.last_name! })
        advance()
    }
    return (
        <AuthPage identifier={pageKey} className='names'>
            <div className='auth-page__modal'>
                <AuthModalBackButton />
                <AuthModalHeader title='Welcome to Whossy, Let’s get you Started' subtitle="Ensure to enter the correct data as some will appear on your profile." />
                <form onSubmit={handleSubmit(onFormSubmit)} className='auth-page__modal__form'>
                    <AuthInput register={register} error={errors.first_name} name='first_name' placeholder='First Name' />
                    <AuthInput register={register} error={errors.last_name} name='last_name' placeholder='Last Name' />
                    <button className='w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center'> Continue</button>
                </form>
            </div>
        </AuthPage>
    )
}

const FillInCountries: React.FC<AccountSetupFormPage> = ({ advance, goBack, pageKey }) => {
    const phone_number = useAccountSetupFormStore(state => state.userData.phone_number)
    const country_of_origin = useAccountSetupFormStore(state => state.userData.country_of_origin)
    const setCountryAndPhoneData = useAccountSetupFormStore(state => state.setCountryAndPhoneData)
    const auth_provider = useAccountSetupFormStore(state => state.userData.auth_provider)
    const updateAccountSetupUserData = useAccountSetupFormStore(state => state.updateUserData)
    const email = useAccountSetupFormStore(state => state.userData.email)
    const {
        handleSubmit,
        control,
        formState: { errors },
        register
    } = useForm<FormData>({
        resolver: zodResolver(auth_provider == 'phone' ? AccountCountriesFormSchemaForPhoneNumberAuthentication : AccountCountriesFormSchema),
        mode: 'onBlur',
        defaultValues: auth_provider == 'phone' ? {
            email, country_of_origin
        } : {
            phone_number,
            country_of_origin
        }
    });

    const [selected, setSelected] = useState('country_of_origin');
    const [loading, setLoading] = useState(false)
    const [requestError, setRequestError] = useState('')
    const onFormSubmit = async (data: FormData) => {
        try {
            setLoading(true)
            if (auth_provider == 'phone') {
                const q = query(collection(db, "users"), where("email", "==", data.email));
                const result = await getDocs(q);
                if (result.docs.length > 0) {
                    setRequestError("Email Already Exists")
                } else {
                    updateAccountSetupUserData({ country_of_origin: data.country_of_origin, email: data.email })
                    advance()
                }
            }
            else {
                const q = query(collection(db, "users"), where("phone_number", "==", data.phone_number));
                const result = await getDocs(q);
                if (result.docs.length > 0) {
                    setRequestError("Phone Number Exists")
                } else {
                    setCountryAndPhoneData({
                        country_of_origin: data.country_of_origin!,
                        phone_number: data.phone_number!,
                    })
                    advance()
                }
            }
        } catch (err) {
            setRequestError("Something Went Wrong")
            setTimeout(() => setRequestError(''), 2000)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        const selectedCountryIndex = Object.values(en).findIndex(item => item == country_of_origin)
        if (selectedCountryIndex !== -1) {
            setSelected(Object.keys(en)[selectedCountryIndex])
        }
        console.log()
    }, [])


    return (
        <AuthPage identifier={pageKey} className='phone-and-countries'>
            <div className='auth-page__modal'>
                <AnimatePresence mode='wait'>
                    {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
                </AnimatePresence>
                <AuthModalBackButton onClick={goBack} />
                <AuthModalHeader title='Just a few more steps to go!' subtitle="Ensure to enter the correct data as some will appear on your profile." />
                <form onSubmit={handleSubmit(onFormSubmit)} className='auth-page__modal__form'>
                    {auth_provider !== 'phone' && <Controller control={control} name={"phone_number"}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <>
                                <PhoneInput ref={ref} international defaultCountry='US' placeholder="Phone Number" onChange={onChange} onBlur={onBlur} value={value as string} className={`PhoneInput ${errors?.phone_number?.message && `PhoneInput--error`}`} />
                                <div className='error-message-container'><motion.span animate={{ opacity: errors?.phone_number?.message ? 1 : 0, transition: { duration: 0.2 } }} className="error-message">{errors?.phone_number?.message as string}</motion.span></div>
                            </>
                        )}
                    />}
                    {auth_provider == 'phone' && <AuthInput register={register} error={errors.email} name='email' type='email' placeholder='Your Email' />}
                    <Controller control={control} name={"country_of_origin"}
                        render={({ field: { onChange } }) => (
                            <>
                                <ReactFlagsSelect
                                    selectButtonClassName={`${errors?.country_of_origin?.message && 'has-error'}`}
                                    placeholder="Nationality"
                                    className='countries-select w-[calc(100%-3rem)]'
                                    searchable
                                    selected={selected}
                                    onSelect={(code) => { setSelected(code); onChange(en[code as keyof Locale]) }}
                                />
                                <div className='error-message-container'><motion.span animate={{ opacity: errors?.country_of_origin?.message ? 1 : 0, transition: { duration: 0.2 } }} className="error-message">{errors?.country_of_origin?.message as string}</motion.span></div>
                            </>
                        )}
                    />
                    <button className='w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center'> {!loading ? "Continue" : <motion.img key="loading-image" className='button__loader' src='/assets/icons/loader.gif' />} </button>
                </form>
            </div>
        </AuthPage>
    )
}

const FillInGender: React.FC<AccountSetupFormPage> = ({ goBack, pageKey }) => {
    const gender = useAccountSetupFormStore(state => state.userData.gender)
    const setGender = useAccountSetupFormStore(state => state.setGender)
    const [loading, setLoading] = useState(false)
    const [requestError, setRequestError] = useState('')
    const getAccountSetupData = useAccountSetupFormStore(state => state.getAccountSetupData)
    const id = useAccountSetupFormStore(state => state.userData.uid)
    const email = useAccountSetupFormStore(state => state.userData.email)
    const auth_provider = useAccountSetupFormStore(state => state.userData.auth_provider)
    const navigate = useNavigate()
    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(AccountGenderFormSchema),
        mode: 'onChange',
        defaultValues: {
            gender
        }
    });
    const auth = getAuth()
    const { setAuth } = useAuthStore();

    const onFinishCreateAccount = async (data: FormData) => {
        setGender(data.gender!);
        try {
            setLoading(true);

            if (auth_provider === 'phone') {
                await setDoc(doc(db, "users", id), {
                    uid: id,
                    auth_provider: "phone",
                    email: auth.currentUser?.email || email,
                    has_completed_account_creation: true,
                    has_completed_onboarding: false,
                    ...getAccountSetupData(),
                });

                await verifyBeforeUpdateEmail(auth.currentUser!, email, {
                    url: `${import.meta.env.VITE_APP_FRONTEND_URL}/auth/finalize-setup`,
                });

                navigate('/auth/email-verification');
            } else {
                const userRef = doc(db, "users", id);
                const user = await getDoc(userRef);

                await updateDoc(userRef, {
                    ...getAccountSetupData(),
                    gender: data.gender,
                    has_completed_account_creation: true,
                });

                await updateProfile(auth.currentUser!, {
                    displayName: `${getAccountSetupData().first_name} ${getAccountSetupData().last_name}`,
                });

                await auth.currentUser?.reload();

                if (!auth.currentUser?.emailVerified) {
                    await sendEmailVerification(auth.currentUser!, {
                        url: `${import.meta.env.VITE_APP_FRONTEND_URL}/auth/finalize-setup`,
                    });

                    navigate('/auth/email-verification');
                } else {
                    setAuth(
                        { uid: id, has_completed_onboarding: false },
                        { ...user.data(), is_approved: auth.currentUser?.emailVerified }
                    );
                    navigate('/auth/finalize-setup');
                }
            }
        } catch (err) {
            setRequestError("Something Went Wrong");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <AuthPage identifier={pageKey} className='gender'>
            <div className='auth-page__modal'>
                <AnimatePresence mode='wait'>
                    {requestError && <AuthModalRequestMessage errorMessage={requestError} />}
                </AnimatePresence>
                <AuthModalBackButton onClick={goBack} />
                <AuthModalHeader title='Your account is almost ready!' subtitle="Select your gender." />
                <form onSubmit={handleSubmit(onFinishCreateAccount)} className='auth-page__modal__form'>
                    <Controller control={control} name={"gender"}
                        render={({ field: { onChange, value } }) => (
                            <GenderButton gender='Male' selected={value == 'Male'} onClick={() => { onChange('Male'); setGender('Male') }} />
                        )}
                    />
                    <Controller control={control} name={"gender"}
                        render={({ field: { onChange, value } }) => (
                            <GenderButton gender='Female' selected={value == 'Female'} onClick={() => { onChange('Female'); setGender('Female') }} />
                        )}
                    />
                    <div className='error-message-container'><motion.span animate={{ opacity: errors?.gender?.message ? 1 : 0, transition: { duration: 0.2 } }} className="error-message">{errors?.gender?.message as string}</motion.span></div>
                    <button className='w-full rounded-[0.8rem] cursor-pointer bg-[#F2243E] py-6 text-white text-[1.8rem] font-medium leading-[2.16rem] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70 transition-all duration-200 flex items-center justify-center'> {!loading ? "Finish" : <motion.img key="loading-image" className='button__loader' src='/assets/icons/loader.gif' />} </button>
                </form>
            </div>
        </AuthPage>
    )
}

const AccountSetup = () => {
    const [currentPage, setCurrentPage] = useState(0)
    const pageOrder = ['names', 'countries', 'gender', 'welcome']
    const navigate = useNavigate()
    const id = useAccountSetupFormStore(state => state.userData.id)

    useEffect(() => {
        if (!id) {
            navigate('/auth')
        }
    }, [id, navigate])

    const advance = () => {
        setCurrentPage(currentPage + 1)
    }
    const goBack = () => {
        setCurrentPage(currentPage - 1)
    }
    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.2 } }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} >
            <AnimatePresence mode='wait'>
                {pageOrder[currentPage] == 'names' && <FillInAccountNames pageKey="create-account-names" advance={advance} goBack={goBack} />}
                {pageOrder[currentPage] == 'countries' && <FillInCountries pageKey="create-account-countries" advance={advance} goBack={goBack} />}
                {pageOrder[currentPage] == 'gender' && <FillInGender pageKey="create-account-gender" advance={advance} goBack={goBack} />}
            </AnimatePresence>
        </motion.div>
    )
}
export default AccountSetup;