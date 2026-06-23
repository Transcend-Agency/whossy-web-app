import { motion } from 'framer-motion'

const FindYourSoulMate = () => {
  return (
    <section className="onboarding-page__section-two flex flex-col justify-center">
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4 } }}
        exit={{ opacity: 0 }}
        src="/assets/images/onboarding/soul-mate.svg"
        className="onboarding-page__section-two__image"
        alt=""
      />
      <motion.div initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4 } }}
        exit={{ opacity: 0 }}>
        <h1 className="onboarding-page__header">Find your soul mate</h1>
        <p className="onboarding-page__text">
          Whether you swipe right or left. Your perfect match can be found on
          Whossy. Just keep swiping
        </p>
      </motion.div>
    </section>
  );
};

export default FindYourSoulMate;
