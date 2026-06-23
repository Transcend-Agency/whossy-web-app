import React from 'react';
import { motion } from 'framer-motion'

type DashboardPageContainerProps = {
    children: React.ReactElement | React.ReactElement[];
    span?: number;
    className?: string
};

const DashboardPageContainer: React.FC<DashboardPageContainerProps> = ({ children, span = 1, className }) => {

    return (
    <motion.div className={`dashboard-layout__main-app__body ${span == 2 && 'span-2'}  ${className}`} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} transition={{ duration: 0.2 }}>
        {children}
    </motion.div>
    )
}
export default DashboardPageContainer;