import React, { useState } from 'react';
import DashboardSettingsModal from './DashboardSettingsModal'
import toast from 'react-hot-toast';
import { Oval } from 'react-loader-spinner';
import { User } from '@/types/user';
import { useCancelSubscription } from '@/hooks/usePayments';
import WebPaymentsUnavailable from './WebPaymentsUnavailable';


interface SubscriptionPlanModalProps {
  show: boolean, hide: () => void; refetchUserData?: () => void
}

// The monthly premium price in US dollars. Mirrors SUBSCRIPTION_PLANS.usd in
// functions/src/payments.ts, which is what is actually charged.
export const PREMIUM_PRICE_USD = 10;

// Web payments are switched off until a payment provider is set up, so
// this shows the price and sends people to the Android app to subscribe.
export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({ show, hide }) => {
  return (
    <DashboardSettingsModal showing={show} title="Whossy Premium" hideModal={hide}>
      <div className="flex flex-col gap-y-4 ">
        <div className='text-[1.8rem] font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] rounded-[0.8rem] text-center' style={{border: '1px solid #ececec'}}>
            <p className='text-[2.4rem] font-semibold text-black'>${PREMIUM_PRICE_USD}<span className='text-[1.6rem] font-medium text-[#8A8A8E]'> /month</span></p>
        </div>
        <WebPaymentsUnavailable />
      </div>
    </DashboardSettingsModal>
  )
}

// export const StripePaymentDetailsModal: React.FC<SubscriptionPlanModalProps> = ({ show, hide}) => {
//   return (
//     <DashboardSettingsModal showing={show} title="Select a payment option" hideModal={hide}>
//       <StripeCheckoutForm />
//     </DashboardSettingsModal>
//   )
// }

export const CancelPlanModal: React.FC<SubscriptionPlanModalProps & { userData: User }> = ({ show, hide, refetchUserData }) => {

  const [isLoading, setIsLoading] = useState(false);

  const { mutate: cancelSubscription } = useCancelSubscription();

  const handleUnsubscription = () => {
    setIsLoading(true);

    cancelSubscription(undefined, {
      onSuccess: () => {
        refetchUserData && refetchUserData();
        toast.success('Subscription cancelled successfully');
        window.location.reload();
        hide();
      },
      onError: () => { setIsLoading(false); toast.error('An error occurred while trying to cancel subscription. Please try again later') },
    });
  }

  return (
    <DashboardSettingsModal showing={show} title="Select a payment option" hideModal={hide}>
    <div className="flex flex-col gap-y-4">
      <h1 className='text-center text-[2.4rem] font-medium'>Are you sure you want to unsubscribe</h1>
      <div className='flex gap-x-5'>
        <button  className='cursor-pointer text-[1.8rem] w-full font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] flex justify-center gap-x-2 rounded-[0.8rem] hover:bg-[#f6f6f6] transition duration-300 hover:scale-[1.01] text-center ' style={{border: '2px solid #f6f6f6'}} onClick={
          hide
        }>Cancel</button>
        <button className='cursor-pointer text-[1.8rem] w-full font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] flex justify-center gap-x-2 rounded-[0.8rem] hover:bg-[#f6f6f6] transition duration-300 hover:scale-[1.01] text-center ' style={{border: '2px solid #f6f6f6'}} onClick={
          handleUnsubscription
        }>{!isLoading ? 'Yes' : <Oval color="#000000" secondaryColor="#000000" width={20} height={20} />}</button>
      </div>
    </div>
  </DashboardSettingsModal>
  )
}