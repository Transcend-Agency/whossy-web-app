import { useCreateTransaction } from "@/hooks/usePayments";
import { motion } from "framer-motion"
import { useState } from "react";
import toast from "react-hot-toast";
import { Oval } from "react-loader-spinner";

type AddCreditProps = {
    activePage: string;
    closePage: () => void;
    activeSubPage?: number;
    refetchUserData: () => void
};

interface CreditOption {
  credits: number;
    usd: number;
    ngn: number;
    kes: number;
  }

  // Mirrors CREDIT_OPTIONS in functions/src/payments.ts — the server is the
  // actual source of truth for amounts, this is display-only. Index into
  // this array is what's sent as `creditOptionIndex`.
  const creditOptions: CreditOption[] = [
    { credits: 50, usd: 10, ngn: 10000, kes: 800 },
    { credits: 100, usd: 20, ngn: 20000, kes: 1600  },
    { credits: 200, usd: 30, ngn: 30000, kes: 2400  },
    { credits: 1000, usd: 40, ngn: 40000, kes: 3200  },
  ];

  const currency: string[] = [
    "usd",
    "ngn",
    "kes",
  ]

const AddCredits: React.FC<AddCreditProps> = ({ activePage, closePage }) => {
    const [selectedCreditOptionIndex, setSelectedCreditOptionIndex] = useState<number | null>(null);

    const [activeCurrency, setActiveCurrency] = useState<'usd' | 'ngn' | 'kes'>('usd')

    const { mutate: createTransaction, isPending } = useCreateTransaction();

    const handlePayment = () => {
      if (selectedCreditOptionIndex === null) return;
      createTransaction(
        { purpose: "credits", currency: activeCurrency, creditOptionIndex: selectedCreditOptionIndex },
        {
          onSuccess: (data) => {
            window.open(data.checkoutUrl, "_self");
          },
          onError: (err) => {
            console.error(err);
            toast.error("Couldn't start payment. Please try again.");
          },
        }
      );
    };

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

        <div className="mx-6 flex gap-x-6 items-center">
          <p className="text-[1.8rem] font-medium">SELECT CURRENCY </p>
          <div className="flex gap-x-4">
            {currency.map((item, i) =>
              <div key={i} className={`p-4 text-[1.4rem] rounded-2xl cursor-pointer ${activeCurrency === item && "bg-black text-white"}`} style={{ border: "1px solid #8A8A8A" }}
              onClick={() => {setActiveCurrency(item as 'usd' | 'ngn' | 'kes'); setSelectedCreditOptionIndex(null)}}
              >{item}</div>
              )
            }
          </div>
        </div>

        <div className="space-y-5 pb-[5rem]">
          {creditOptions.map((option, i) => (
            <label
              key={option.credits}
              className="flex justify-between rounded-[1.6rem] p-4 m-6 cursor-pointer"
              style={{
                    border: selectedCreditOptionIndex === i ? '1px solid #F2243E' : '1px solid #8A8A8A',
               }}
              onClick={() => setSelectedCreditOptionIndex(i)}
            >
              <div className="space-y-3">
                <div className="text-[1.6rem]">{option.credits} Credits</div>
                <div className="text-[1.6rem] font-semibold">{activeCurrency === "usd" ? `$ ${option.usd}` : activeCurrency === "ngn" ? `₦ ${option.ngn}` : `KES ${option.kes}`} </div>
              </div>

              <input
                type="radio" name="credits" value={option.credits} checked={selectedCreditOptionIndex === i} readOnly className="form-radio accent-red text-red" />
            </label>
          ))}
        </div>

        {selectedCreditOptionIndex !== null && <div className="flex justify-center mb-10">
            <button
              disabled={isPending}
              onClick={handlePayment}
              className="w-full bg-red text-white py-[1.6rem] rounded-[0.8rem] mx-6 text-[1.8rem] text-center flex justify-center items-center"
            >
              {!isPending ? 'Pay Now' : <Oval color="#ffffff" secondaryColor="#fefefe" width={20} height={20} />}
            </button>
        </div>}

    </motion.div>
  )

}

export default AddCredits
