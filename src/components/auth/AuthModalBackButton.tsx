import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthModalBackButtonProps {
    to?: string;
    onClick?: () => void;
}

const AuthModalBackButton: React.FC<AuthModalBackButtonProps> = ({ to, onClick }) => {
    const navigate = useNavigate();
    const handleNavigation = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };
    return (
        <div
            onClick={onClick || handleNavigation}
            className="auth-page__modal__back-button"
        >
            <img src="/assets/icons/back-arrow.svg" alt="Back" />
        </div>
    );
};

export default AuthModalBackButton;
