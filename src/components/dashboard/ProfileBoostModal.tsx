import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";


interface ProfileBoostModalProps {
    isModalOpen: boolean
    handleCloseModal: () => void;
  }
  
  const modalVariants = {
    hidden: { opacity: 0, },
    visible: { opacity: 1, },
    exit: { opacity: 0, }
  };
  
  const ProfileBoostModal: React.FC<ProfileBoostModalProps> = ({ isModalOpen, handleCloseModal }) => {
    const [isBoostSuccess, setIsBoostSuccess] = useState(false);

    const handleBoostProfileClick = () => {
      setIsBoostSuccess(true);
    };

    return (
      <AnimatePresence>
      {isModalOpen && (
        <motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} transition={{ duration: 0.3 }} className="fixed inset-0 flex justify-center items-center z-50 bg-[#00000099] bg-opacity-50 w-full h-screen" >
          {!isBoostSuccess ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-[1.6rem] shadow-lg w-[350px] sm:w-[450px] p-6 space-y-6 relative" >
            <div className="settings-page__title">
                <button onClick={handleCloseModal} className="settings-page__title__left">
                    <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" />
                    <p>Profile Boosts</p>
                </button>
            </div>

            <div className="flex justify-center">
              <img src="/assets/icons/boost1.svg" alt="Boost-image"/>
            </div>

            <div className="text-center space-y-2">
                <h3 className="font-bold text-[1.8rem]">Profile Boosts</h3>
                <p className="text-[1.6rem] text-gray">
                  Boosts your profile with your available credits and be a top profile in your area for a limited time
                </p>
            </div>

            <div className="text-left">
              <p className="bg-[#f2f0f5] py-2 px-4 rounded-[0.8rem] inline-block text-[1.6rem]">
                Bal: 10 Credits
              </p>
            </div>

            <div className="relative space-y-2">
              <input type="number" className="w-full border border-gray-300 rounded-[0.8rem] py-[2.4rem] px-[1.6rem] text-lg " />
                <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
                  <span className="text-gray text-[1.6rem]">0</span>
                  <span className="text-gray text-[1.6rem]">Credit</span>
                </div>
            </div>

            <div>
              <button onClick={handleBoostProfileClick} className="w-full bg-purple-600 text-white py-[2rem] rounded-[0.8rem] font-semibold hover:bg-purple-700 transition duration-300 text-center text-[1.8rem]" >
                Boost Profile
              </button>
            </div>
          </motion.div>
          ) : (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-[1.6rem] shadow-lg w-[350px] sm:w-[450px] p-6 space-y-6 relative" >
           <div className="settings-page__title">
             <button onClick={handleCloseModal} className="settings-page__title__left">
               <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt="Back" />
               <p>Profile Boosts</p>
             </button>
           </div>

           <div className="flex justify-center">
             <img src="/assets/icons/boost1.svg" alt="Boost-image" />
           </div>

           <div className="text-center space-y-2">
             <h3 className="font-bold text-[1.8rem]">Profile Boosted Successfully</h3>
             <p className="text-gray text-[1.6rem]">More matches coming your way 🍾</p>
           </div>
         </motion.div>
       )}

        </motion.div>
      )}
    </AnimatePresence>
    )
  }
  
  export default ProfileBoostModal