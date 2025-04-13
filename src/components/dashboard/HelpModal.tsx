import { AnimatePresence, motion } from 'framer-motion'
import {FC, useState} from "react";
import {useAuthStore} from "@/store/UserId.tsx";
import {collection, addDoc } from "firebase/firestore";
import {db} from "@/firebase";
import toast from "react-hot-toast";
import { serverTimestamp } from 'firebase/firestore';

interface HelpModalProps {
  show: boolean
  onCloseModal: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, },
  visible: { opacity: 1, },
  exit: { opacity: 0, }
};

const HelpModal: FC<HelpModalProps> = ({ show, onCloseModal }) => {

  const { user } = useAuthStore()
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")

  const requestHelp = async () => {
    if (!message.trim()) {
      toast.error("No message")
      return
    } // Avoid sending empty messages

    setLoading(true);
    try {
      await addDoc(collection(db, "helpRequests") , {
        userId: user?.uid,
        firstName: user?.first_name,
        lastName: user?.last_name,
        message: message,
        createdAt: serverTimestamp()
      });

      setMessage("");
      onCloseModal();
      toast.success("Request Received Successfully. We'll get back to you soon");
    } catch (error) {
      toast.error("Error sending help request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode='wait'>
      {show &&
        <motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} transition={{ duration: 0.3 }} className="fixed inset-0 flex justify-center items-center z-50 bg-[#b9b9b9] bg-opacity-50 w-full h-screen">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white text opacity-100 z-[9999] py-[2rem] px-[4rem] space-y-[3rem] rounded-[2rem]">
            <div>
                <h1 className='text-3xl font-bold flex justify-center mb-[2rem]'>Help & Support</h1>
                <textarea name="help-box"
                           id="help-box"
                           placeholder="Enter your problem"
                           className="bg-white border border-gray text-[2.1rem] focus:outline-none rounded-lg px-4 py-4 w-[369px] h-[169px] placeholder:text-[2.1rem]"
                           value={message}
                           onChange={(e) => setMessage(e.target.value)}></textarea>
            </div>

            <div className="flex flex-row gap-x-4"> 
                <button className="bg-[#F6F6F6] py-[1.3rem] w-full text-[1.8rem] font-bold text-center rounded-lg hover:text-white hover:bg-[#F2243E] transition-all duration-300 cursor-pointer" onClick={onCloseModal}>Cancel</button>
                <button onClick={requestHelp} className={`${loading ? "bg-[#F2243E] text-white" : "bg-[#F6F6F6]"} py-[1.3rem] w-full text-[1.8rem] font-bold text-center rounded-lg hover:text-white hover:bg-[#F2243E] transition-all duration-300 cursor-pointer whitespace-nowrap inline-block`}>
                  {loading ? "Sending..." : "Send Help"}
                </button>
            </div>
          </motion.div>                                                                                                                                                                                         
        </motion.div>}
    </AnimatePresence>
  )
}

export default HelpModal
