import { bio, preference } from "@/assets/icons";
import Icon from "../ui/Icon";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface InformationProps {
  hide: boolean;
}

const Information: React.FC<InformationProps> = ({ hide }) => {
  return (
    <AnimatePresence>
      {!hide && (
        <motion.div
          initial={{ opacity: 0, translateY: 20 }} // Start off-screen and transparent
          animate={{ opacity: 1, translateY: 0 }} // Animate to visible position
          exit={{ opacity: 0, translateY: 20 }} // Animate off-screen when hidden
          transition={{ duration: 0.3 }} // Set the duration of the animation
          className="mt-10 w-full max-w-[359px] space-y-[2rem]"
        >
          <article className="bg-[#F6F6F6] px-[0.8rem] py-[1.2rem] text-[1.4rem] rounded-lg space-y-[1.2rem]">
            <div className="bg-white px-[0.8rem] flex space-x-[0.8rem] items-center font-medium rounded-lg">
              <Icon className="mt-3" src={preference} />
              <p>Relationship Preference</p>
            </div>
            <p className="font-medium">Just for fun</p>
          </article>
          <article className="bg-[#F6F6F6] px-[0.8rem] py-[1.2rem] text-[1.4rem] rounded-lg space-y-[1.2rem]">
            <div className="bg-white px-[0.8rem] flex space-x-[0.8rem] items-center font-medium rounded-lg">
              <Icon className="mt-3" src={bio} />
              <p>Bio</p>
            </div>
            <p className="font-medium">
              I am very excited to meet new people and make friends. Let’s start
              with that and see where it takes us 🚀
            </p>
          </article>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Information;
