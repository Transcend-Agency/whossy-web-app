import React from "react";
import { motion } from "framer-motion";

type OnboardingPageProps = {
  children: React.ReactNode | React.ReactNode[];
};

const OnboardingPage: React.FC<OnboardingPageProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="onboarding-page__section-one__page"
    >
      {children}
    </motion.div>
  );
};
export default OnboardingPage;
