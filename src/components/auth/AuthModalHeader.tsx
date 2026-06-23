import React from 'react';

type AuthModalHeaderProps = {
    title: string;
    subtitle: string;
    type?: string;
};

const AuthModalHeader: React.FC<AuthModalHeaderProps> = ({ title, subtitle, type }) => {

    return <div className={`auth-page__modal__header auth-page__modal__header--${type}`}>
        <h1 className='auth-page__modal__header__title'>{title}</h1>
        <h2 className='auth-page__modal__header__sub-title'>{subtitle}</h2>
    </div>
}
export default AuthModalHeader;