import { AnimatePresence, motion } from 'framer-motion'
import React from "react";

interface SettingsModalProps {
  show: boolean
  onCloseModal: () => void;
  onLogout: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, },
  visible: { opacity: 1, },
  exit: { opacity: 0, }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ show, onCloseModal, onLogout }) => {
  return (
    <AnimatePresence mode='wait'>
      {show &&
        <motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} transition={{ duration: 0.3 }} className="fixed inset-0 flex justify-center items-center z-50 bg-[#b9b9b9] bg-opacity-50 w-full h-screen">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white text opacity-100 z-[9999] py-[2rem] px-[4rem] space-y-[3rem] rounded-[2rem]">
            <p className="font-bold text-[2.4rem]">Are you sure you want to logout?</p>
            <div className="flex gap-x-4">
              <button className="bg-[#F6F6F6] py-[1.3rem] w-full text-[1.8rem] font-medium text-center rounded-lg hover:text-white hover:bg-[#F2243E] transition-all duration-300 cursor-pointer" onClick={onCloseModal}>Cancel</button>
              <button className="bg-[#F6F6F6] py-[1.3rem] w-full text-[1.8rem] font-medium text-center rounded-lg hover:text-white hover:bg-[#F2243E] transition-all duration-300 cursor-pointer" onClick={onLogout}>Logout</button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>
  )
}

export default SettingsModal