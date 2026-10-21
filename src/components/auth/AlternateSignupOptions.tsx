import React from 'react';
import { pressable } from '@/utils/pressable';

type AlternateSignupOptionsProps = {
    text: string
    google: () => void
    phone: () => void
};

const AlternateSignupOptions: React.FC<AlternateSignupOptionsProps> = ({ text = 'or', google, phone }) => {

    return <div className='auth-page__modal__alternate-options'>
        <div className="auth-page__modal__alternate-options__divider">
            <div></div>
            <p>{text}</p>
            <div></div>
        </div>
        <div className='auth-page__modal__alternate-options__container'>
            <div {...pressable(google)} className='auth-page__modal__alternate-options__item'><img src="/assets/icons/google.svg" alt={`google signup`} /></div>
            <div {...pressable(phone)} className='auth-page__modal__alternate-options__item'><img src="/assets/icons/phone.svg" alt={`phone signup`} /></div>
        </div>
    </div>
}
export default AlternateSignupOptions;