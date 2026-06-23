import React, { useState } from 'react';
import { Add, Minus } from "iconsax-react";

interface SectionProps {
  placeholder: string;
  answer: string;
  index: number
  isOpen: boolean
  toggleSection: (index: number) => void
}

const ExpandableSection: React.FC<SectionProps> = ({ placeholder, answer, index, isOpen, toggleSection }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex justify-center items-center">
      <div className="my-[1.6rem] w-full max-w-[80rem]">
        <div className="flex justify-between items-center bg-lightgray px-12 h-[5.1rem]" onClick={() => toggleSection(index)}>
          <p>{placeholder}</p>
          <button className="text-gray" onClick={toggleExpand}>
            {isOpen ? <Minus size="18" color="#8A8A8E" /> : <Add size="18" color="#8A8A8E" />}
          </button>
        </div>
        <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
          <div className="text-gray py-5 px-12 bg-lightgray text-[1.4rem] lg:leading-[2.5rem]">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableSection;
