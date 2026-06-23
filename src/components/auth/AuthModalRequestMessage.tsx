import React from 'react';
import { motion } from 'framer-motion'

type AuthModalRequestMessageProps = {
    errorMessage?: string
};

const AuthModalRequestMessage: React.FC<AuthModalRequestMessageProps> = ({ errorMessage }) => {

    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} key="auth-modal-request-message" className='auth-page__request-error'>
        <img src="/assets/icons/warning.svg" alt={``} />
        <span>{errorMessage}</span>
    </motion.div>
}
export default AuthModalRequestMessage;