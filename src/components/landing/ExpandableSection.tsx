import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Add } from "iconsax-react";

interface SectionProps {
  placeholder: string;
  answer: string;
  index: number
  isOpen: boolean
  toggleSection: (index: number) => void
}

// One FAQ row. The whole question is the toggle button; the row grows with
// the question so long ones wrap instead of overflowing a fixed height.
const ExpandableSection: React.FC<SectionProps> = ({ placeholder, answer, index, isOpen, toggleSection }) => {
  const answerId = `faq-answer-${index}`;

  return (
    <div className="flex justify-center items-center">
      <div className="my-[8px] lg:my-[1.6rem] w-full max-w-[80rem] bg-lightgray rounded-[8px] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(index)}
          aria-expanded={isOpen}
          aria-controls={answerId}
          className="w-full flex justify-between items-center gap-[16px] text-left px-[20px] lg:px-12 py-[16px] lg:py-[1.6rem] min-h-[56px] lg:min-h-[5.1rem] text-[15px] leading-[22px] lg:text-[1.8rem] lg:leading-[2.6rem]"
        >
          <span>{placeholder}</span>
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.25 }}
            className="flex-none"
            aria-hidden="true"
          >
            <Add size="20" color="#8A8A8E" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={answerId}
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <p className="text-gray px-[20px] lg:px-12 pb-[16px] lg:pb-[2rem] text-[14px] leading-[22px] lg:text-[1.6rem] lg:leading-[2.5rem]">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExpandableSection;
