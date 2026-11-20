import WebPaymentsUnavailable from "@/components/dashboard/WebPaymentsUnavailable";
import { motion } from "framer-motion"

type AddCreditProps = {
    activePage: string;
    closePage: () => void;
    activeSubPage?: number;
    refetchUserData: () => void
};

interface CreditOption {
  credits: number;
  usd: number;
}

// Mirrors CREDIT_OPTIONS in functions/src/payments.ts. Display-only while
// web payments are switched off; when they come back, the index into this
// list is what is sent as `creditOptionIndex`, so keep the order the same.
const creditOptions: CreditOption[] = [
  { credits: 5, usd: 1 },
  { credits: 10, usd: 2 },
  { credits: 50, usd: 10 },
  { credits: 100, usd: 20 },
  { credits: 200, usd: 30 },
  { credits: 1000, usd: 40 },
];

const AddCredits: React.FC<AddCreditProps> = ({ activePage, closePage }) => {
  return (
    <motion.div animate={activePage == 'add-credits' ? { x: "-100%", opacity: 1, transition: {duration: 0.25 , ease: 'easeInOut'} } : {x: "100%", opacity: 0}} className="dashboard-layout__main-app__body__secondary-page add-credits-page">
        <div className="settings-page__title">
            <button onClick={closePage} className="settings-page__title__left text-black">
                <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" alt={``} />
                <p>Whossy Credits</p>
            </button>
        </div>
        <div className="bg-yellow m-6 py-[5rem] rounded-[1.6rem] text-center space-y-2">
        <div className="flex justify-center">
            <img src="/assets/icons/coin.svg" alt="Credits Icon" />
        </div>


          <h3 className="font-bold text-[2.4rem]">Whossy Credits</h3>
          <p className="text-gray text-[1.4rem]">
            Buy credits to boost your profile and get more visibility on Whossy
          </p>
        </div>

        <div className="m-6">
          <WebPaymentsUnavailable />
        </div>

        {/* The packs are listed for reference only: nothing here can be bought. */}
        <div className="space-y-5 pb-[5rem]">
          {creditOptions.map((option) => (
            <div
              key={option.credits}
              className="flex justify-between rounded-[1.6rem] p-4 m-6"
              style={{ border: '1px solid #D9D9D9' }}
            >
              <div className="space-y-3">
                <div className="text-[1.6rem]">{option.credits} Credits</div>
                <div className="text-[1.6rem] font-semibold">${option.usd}</div>
              </div>
            </div>
          ))}
        </div>

    </motion.div>
  )

}

export default AddCredits
