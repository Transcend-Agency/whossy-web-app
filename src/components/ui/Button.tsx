import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text: string;
    className?: string;
    loading?: boolean;
    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ text, className, loading, disabled, ...props }) => {

    return <button disabled={loading || disabled} className={`button ${className}`} {...props}>
        <AnimatePresence mode='wait'>
            {!loading && <motion.div key="loading-text">{text}</motion.div>}
            {loading && <motion.img key="loading-image" className='button__loader' src='/assets/icons/loader.gif' />}
        </AnimatePresence>
    </button>
}
export default Button;