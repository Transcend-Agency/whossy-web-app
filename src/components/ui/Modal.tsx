import {FC, ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

import  {motion as m} from 'framer-motion';

const Modal: FC<ModalProps> = ({ children, onClose, className = "" }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose && onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  return (
    <m.div
      className={`fixed inset-0 flex justify-center z-50 items-center transition-colors bg-black/20
      ${className}`}
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div ref={modalRef} className="mx-5">
        {children}
      </div>
    </m.div>
  );
};

export default Modal;
