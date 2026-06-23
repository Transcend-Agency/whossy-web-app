import React from 'react';
import { motion } from 'framer-motion'

type AuthPageProps = {
    children: React.ReactNode | React.ReactNode[];
    className: string;
    identifier?: string;
};

const AuthPage: React.FC<AuthPageProps> = ({ children, className, identifier }) => {

    return <motion.div key={identifier} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.2 } }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} className={`auth-page ${className}`} >
        {children}
    </motion.div>
}
export default AuthPage;