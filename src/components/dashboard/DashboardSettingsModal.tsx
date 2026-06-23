import { FC,  useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion'

export type DashboardSettingsModalProps = {
    showing: boolean;
    children?: JSX.Element | JSX.Element[] | boolean;
    hideModal: () => void;
    title?: string;
    save?: JSX.Element | JSX.Element[] | boolean;
};

const DashboardSettingsModal: FC<DashboardSettingsModalProps> = ({ showing, children, hideModal, title, save }) => {

    const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if ( dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				hideModal();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

    return <>
        <AnimatePresence mode='wait'>
            {showing && <>
                <div className='modal'>
                    <motion.div  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}  exit={{ opacity: 0 }} className='modal__overlay'></motion.div>
                        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} className='modal__container' ref={dropdownRef}>
                            <div className='modal__body block'>
                                <header className='modal__body__header'>
                                    <div className='modal__body__header__left'>
                                        <button onClick={hideModal} className='modal__body__back-button'>
                                            <img src="/assets/icons/back-arrow-black.svg" className='return-button' />
                                        </button>
                                        <h3 className='modal__body__header__title'>{title}</h3>
                                    </div>
                                    {save}
                                </header>
                                <section className='modal__body__content overflow-y-scroll'>
                                    {children}
                                </section>
                            </div>
                            <div className='bg-white fixed bottom-[5rem] w-full hidden z-50' style={{borderTopLeftRadius: '1.6rem', borderTopRightRadius: '1.6rem'}}>
                                <header className='flex p-[1.6rem] justify-between items-center' style={{borderBottom: '1px solid #F6F6F6'}}><h3 className='text-[1.6rem] font-medium'> {title} </h3> {save} </header>
                                <section className='px-[1.6rem] pt-[1.6rem] pb-[2.4rem]'>{children}</section>
                            </div>
                        </motion.div>
                </div>
            </>}
        </AnimatePresence>
    </>
}
export default DashboardSettingsModal;
// import React, { useEffect, useRef } from 'react';
// import { AnimatePresence, motion } from 'framer-motion'
// import { useMediaQuery } from 'react-responsive'

// export type DashboardSettingsModalProps = {
//     showing: boolean;
//     children?: JSX.Element | JSX.Element[] | boolean;
//     hideModal: () => void;
//     title?: string;
//     save?: JSX.Element | JSX.Element[] | boolean;
// };

// const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({ showing, children, hideModal, title, save }) => {

//     const isDesktop = useMediaQuery({query: '(min-width: 1024px)'})

//     const dropdownRef = useRef<HTMLDivElement>(null);

// 	useEffect(() => {
// 		const handleClickOutside = (event: MouseEvent) => {
// 			if ( dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
// 				hideModal();
// 			}
// 		};
// 		document.addEventListener("mousedown", handleClickOutside);
// 		return () => {
// 			document.removeEventListener("mousedown", handleClickOutside);
// 		};
// 	}, []);

//     return <>
//         <AnimatePresence mode='wait'>
//             {showing && <>
//                 <div className='modal'>
//                     <motion.div  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}  exit={{ opacity: 0 }} className='modal__overlay'></motion.div>
//                         <motion.div initial={isDesktop ? { scale: 0.85, opacity: 0 } : { y: 100 }} animate={isDesktop ? { opacity: 1, scale: 1 } : { y: 0 }} exit={isDesktop ? { opacity: 0, scale: 0.85 } :{ y: 100 }} className='modal__container' ref={dropdownRef}>
//                             <div className='modal__body hidden lg:block'>
//                                 <header className='modal__body__header'>
//                                     <div className='modal__body__header__left'>
//                                         <button onClick={hideModal} className='modal__body__back-button'>
//                                             <img src="/assets/icons/back-arrow-black.svg" className='return-button' />
//                                         </button>
//                                         <h3 className='modal__body__header__title'>{title}</h3>
//                                     </div>
//                                     {save}
//                                 </header>
//                                 <section className='modal__body__content overflow-y-scroll'>
//                                     {children}
//                                 </section>
//                             </div>
//                             <div className='bg-white fixed bottom-0 w-full lg:hidden z-50' style={{borderTopLeftRadius: '1.6rem', borderTopRightRadius: '1.6rem'}}>
//                                 <header className='flex p-[1.6rem] justify-between items-center' style={{borderBottom: '1px solid #F6F6F6'}}><h3 className='text-[1.6rem] font-medium'> {title} </h3> {save} </header>
//                                 <section className='px-[1.6rem] pt-[1.6rem] pb-[2.4rem]'>{children}</section>
//                             </div>
//                     </motion.div>
//                 </div>
//             </>}
//         </AnimatePresence>
//     </>
// }
// export default DashboardSettingsModal;