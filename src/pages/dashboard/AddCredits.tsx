import { db } from "@/firebase";
import { useNombaPayment } from "@/hooks/useNomba";
import { useObtainNombaAccessToken } from "@/hooks/useNombaAuth";
import { useNombaStore } from "@/store/Nomba";
import { useAuthStore } from "@/store/UserId";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion"
import { useState } from "react";
import toast from "react-hot-toast";
import { Oval } from "react-loader-spinner";
import { PaystackButton } from 'react-paystack'

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

const AddCredits: React.FC<AddCreditProps> = ({ activePage, closePage, refetchUserData }) => {
    const [selectedCreditOption, setSelectedCreditOption] = useState<{ credits: number, price: number, currency: 'usd' | 'ngn' | 'kes' } | null>(null);

    const handlePrice = (data: { credits: number, usd: number, ngn: number, kes: number }) => {
      const price =
        activeCurrency === "usd"
          ? data.usd
          : activeCurrency === "ngn"
          ? data.ngn
          : data.kes;

      const currency =
        activeCurrency === "usd"
          ? 'usd'
          : activeCurrency === "ngn"
          ? 'ngn'
          : 'kes';
    
      setSelectedCreditOption({ credits: data.credits, price, currency });
    };

    const [activeCurrency, setActiveCurrency] = useState<'usd' | 'ngn' | 'kes'>('usd')

    const { user } = useAuthStore();
    const publicKey = selectedCreditOption && selectedCreditOption.currency === "ngn" ? import.meta.env.VITE_PAYSTACK_PUBLIC_TEST_KEY_NGN : import.meta.env.VITE_PAYSTACK_PUBLIC_TEST_KEY_KES;
    const amount = selectedCreditOption ? selectedCreditOption.price * 100 : 0;

    const componentProps = {
      email: user?.email as string,
      amount,
      publicKey,
      text: "Pay Now",
      onSuccess: async () => {

        const userDocRef = doc(db, "users", user?.uid as string);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          await updateDoc(userDocRef, {
            credit_balance: data.credit_balance + selectedCreditOption?.credits,
            amount_paid_in_total: {
              naira: selectedCreditOption?.currency === 'ngn' ? data.amount_paid_in_total.naira + selectedCreditOption?.price : data.amount_paid_in_total.naira,
              kenyan_shillings: selectedCreditOption?.currency === 'kes' ? data.amount_paid_in_total.kenyan_shillings + selectedCreditOption?.price : data.amount_paid_in_total.kenyan_shillings
            }
          });
          closePage();
          refetchUserData();
        }

        toast.success("Thanks for doing business with us!");

      },
      onClose: () => toast.error("Payment cancelled"),
    }

    const obtainAccessToken = useObtainNombaAccessToken();
    const { setAuthResponse } = useNombaStore();

    const makeNombaPayment = useNombaPayment();

    const [isLoading, setIsLoading] = useState(false);

    const handleUsdPayment = () => {
      setIsLoading(true);
      obtainAccessToken.mutate({ grant_type: "client_credentials", client_id: import.meta.env.VITE_NOMBA_CLIENT_ID, client_secret: import.meta.env.VITE_NOMBA_CLIENT_SECRET }, {
        onSuccess: (res) => {
          setAuthResponse(res.data);
          makeNombaPayment.mutate({
            order: { amount: selectedCreditOption?.price as number, callbackUrl: "http://localhost:5173/dashboard/user-profile", 
            currency: "USD", customerEmail: user?.email as string }, 
          }, {
            onSuccess: (paymentRes) => {
              // window.open(paymentRes.data.checkoutLink);
              window.open(paymentRes.data.data.checkoutLink, '_self');
            }
          }
        )
        }
      });
    }

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
              onClick={() => {setActiveCurrency(item as 'usd' | 'ngn' | 'kes'); setSelectedCreditOption(null)}}
              >{item}</div>
              )
            }
          </div>
        </div>

        <div className="space-y-5 pb-[5rem]">
          {creditOptions.map((option) => (
            <label
              key={option.credits}
              className="flex justify-between rounded-[1.6rem] p-4 m-6 cursor-pointer"
              style={{
                    border: selectedCreditOption?.credits === option.credits ? '1px solid #F2243E' : '1px solid #8A8A8A',
               }}
              onClick={() => handlePrice(option)}
            >
              <div className="space-y-3">
                <div className="text-[1.6rem]">{option.credits} Credits</div>
                <div className="text-[1.6rem] font-semibold">{activeCurrency === "usd" ? `$ ${option.usd}` : activeCurrency === "ngn" ? `₦ ${option.ngn}` : `KES ${option.kes}`} </div>
              </div>

              <input
                type="radio" name="credits" value={option.credits} checked={selectedCreditOption?.credits === option.credits} readOnly className="form-radio accent-red text-red" />
            </label>
          ))}
        </div>

        {/* <div>
          {JSON.stringify(publicKey)}
        </div> */}

       {selectedCreditOption && (selectedCreditOption.currency === 'ngn' || selectedCreditOption?.currency === "kes") && <div className="flex justify-center mb-10">
            <PaystackButton disabled={ selectedCreditOption ? false : true } currency={selectedCreditOption?.currency} className={` w-full bg-red text-white py-[1.6rem] rounded-[0.8rem] mx-6 text-[1.8rem] text-center ${!selectedCreditOption && "cursor-not-allowed"}`} {...componentProps} />
        </div>}

        {selectedCreditOption && selectedCreditOption.currency === 'usd' && 
        <div className="flex justify-center mb-10">
            <button className={` w-full bg-red text-white py-[1.6rem] rounded-[0.8rem] mx-6 text-[1.8rem] text-center flex justify-center items-center`} onClick={handleUsdPayment}>{!isLoading ? 'Pay with card' : <Oval color="#ffffff" secondaryColor="#fefefe" width={20} height={20} />}</button>
        </div>
        }
        
    </motion.div>
  )
  
}

export default AddCredits