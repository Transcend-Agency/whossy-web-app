import React from 'react';
import { AnimatePresence, motion } from 'framer-motion'

export type DashboardSettingsModalProps = {
    showing: boolean;
    children?: JSX.Element | JSX.Element[] | boolean;
    hideModal: () => void;
    title?: string;
    save?: JSX.Element | JSX.Element[] | boolean;
};

const MobileModal: React.FC<DashboardSettingsModalProps> = ({ showing, children, title, save }) => {

    return <>
        <AnimatePresence mode='wait'>
            {showing && <>
                <div className='modal lg:hidden'>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} exit={{ opacity: 0 }} className='modal__overlay'></motion.div>
                    <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }} className='modal__container'>
                        <div className='bg-white fixed bottom-0 w-full' style={{borderTopLeftRadius: '1.6rem', borderTopRightRadius: '1.6rem'}}>
                            <header className='flex p-[1.6rem]' style={{borderBottom: '1px solid #F6F6F6'}}><h3 className='text-[1.6rem] font-medium'> {title} </h3> {save} </header>
                            <section className='px-[1.6rem] pt-[1.6rem] pb-[2.4rem]'>{children}</section>
                        </div>
                    </motion.div>
                </div>
            </>}
        </AnimatePresence>
    </>
}
export default MobileModal;