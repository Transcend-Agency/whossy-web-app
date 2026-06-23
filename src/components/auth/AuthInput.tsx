import React, { useState } from 'react';
import { FormFieldProps } from '@/types/auth.ts';
import { motion } from 'framer-motion';

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & FormFieldProps;

const AuthInput: React.FC<AuthInputProps> = ({ className,  placeholder,  type = 'text',  register,  name,  error,  valueAsNumber,  ...props }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prevState => !prevState);
    };
    const inputType = type === 'password' ? (isPasswordVisible ? 'text' : 'password') : type;
    return (
        <>
            <div className="relative">
                <input type={inputType} placeholder={placeholder}{...register(name, { valueAsNumber })}
                    className={`auth-page__modal__form__input ${className} ${error && 'auth-page__modal__form__input--error'}`}
                    {...props}/>
                {type === 'password' && (
                    <button type="button" onClick={togglePasswordVisibility}
                            className="text-white absolute inset-y-0 right-3 flex items-center text-gray-600">
                            { isPasswordVisible ? <img className={`size-[20px] mr-[0.5rem]`} src={'/assets/icons/eye-closed-icon.svg'} alt={``}/> :
                            <img className={`size-[20px] mr-[0.5rem]`} src={'/assets/icons/eye-open-icon.svg'} alt={``}/>}
                    </button>
                )}
            </div>

            {/* Error message */}
            <div className='error-message-container'>
                <motion.span animate={{ opacity: error ? 1 : 0, transition: { duration: 0.2 } }} className="error-message">{error?.message as string}</motion.span>
            </div>
        </>
    );
};

export default AuthInput;
