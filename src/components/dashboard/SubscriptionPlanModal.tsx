import { useState } from 'react';
import DashboardSettingsModal from './DashboardSettingsModal'
import { PaystackButton } from 'react-paystack'
import StripeCheckoutForm from './StripeCheckoutForm';


interface SubscriptionPlanModalProps {
  show: boolean, hide: () => void; advance: (val: 'stripe-payment' | 'payment-detail') => void;
}

type UserDetails = {name: string, email: string, phone: string, amount: number}



export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({ show, hide, advance}) => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'naira' | 'usd'>('naira');
  return (
    <DashboardSettingsModal showing={show} title="Select a payment option" hideModal={hide}>
      <div className="flex flex-col gap-y-4">
        <div className='cursor-pointer text-[1.8rem] font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] flex  items-center gap-x-2 rounded-[0.8rem] hover:bg-[#F6F6F6] transition duration-300 hover:scale-[1.01] ' style={{border: '1px solid', borderColor: selectedPaymentMethod === 'naira' ? '#f46a1afa' : '#8A8A8E'}}
         onClick={() => setSelectedPaymentMethod('naira')}>
            <div className={`size-[2rem] rounded-full transition-all duration-300 ${selectedPaymentMethod === 'naira' ? 'bg-[#f46a1afa]' : 'bg-white'}`} style={{border: '1px solid #8A8A8E'}}/>
            <p className='text-center w-full'>Pay using Naira (Paystack)</p>
        </div>
        <div className='cursor-pointer text-[1.8rem] font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] flex  items-center gap-x-2 rounded-[0.8rem] hover:bg-[#F6F6F6] transition duration-300 hover:scale-[1.01] ' style={{border: '1px solid', borderColor: selectedPaymentMethod === 'usd' ? '#f46a1afa' : '#8A8A8E'}}
         onClick={() => setSelectedPaymentMethod('usd')}>
            <div className={`size-[2rem] rounded-full transition-all duration-300 ${selectedPaymentMethod === 'usd' ? 'bg-[#f46a1afa]' : 'bg-white'}`} style={{border: '1px solid #8A8A8E'}}/>
            <p className='text-center w-full'>Pay using USD (Stripe)</p>
        </div>
        <button className="bg-[#ff5e00f7] w-full py-[1.5rem] text-center rounded-[0.8rem] text-[1.8rem] text-white font-medium tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" onClick={() => advance(selectedPaymentMethod === 'naira' ? 'payment-detail' : 'stripe-payment')}>Pay - $12</button>
      </div>
    </DashboardSettingsModal>
  )
}

export const PaymentDetailsModal: React.FC<SubscriptionPlanModalProps> = ({ show, hide}) => {

const amount = 2000000;

const [userDetails, setUserDetails] = useState<UserDetails>({name: "", email: "", phone: "", amount});


return (
  <DashboardSettingsModal showing={show} title="Select a payment option" hideModal={hide}>
    <form className="flex flex-col gap-y-6">
      <div className='flex flex-col space-y-2 text-[1.8rem]'>
          <label htmlFor="name">Name</label>
          <input id='name' type="text" value={userDetails.name} placeholder='Enter your full name' className='border py-4 px-4 rounded-lg placeholder:text-[#dad9d9]'
          onChange={(e) => setUserDetails((prev) => ({...prev, name: e.target.value}) )} />
      </div>
      <div className='flex flex-col space-y-2 text-[1.8rem]'>
          <label htmlFor="name">Phone Number</label>
          <input id='name' type="text" value={userDetails.phone} placeholder='Enter your phone number' className='border py-4 px-4 rounded-lg placeholder:text-[#dad9d9]'
          onChange={(e) => setUserDetails((prev) => ({...prev, phone: e.target.value}) )} />
      </div>
      <div className='flex flex-col space-y-2 text-[1.8rem]'>
          <label htmlFor="name">Email</label>
          <input id='name' type="text" placeholder='Enter your email address' className='border py-4 px-4 rounded-lg placeholder:text-[#dad9d9]'
          onChange={(e) => setUserDetails((prev) => ({...prev, email: e.target.value}) )} />
      </div>
      <button className="bg-[#ff5e00f7] w-full py-[1.5rem] text-center rounded-[0.8rem] text-[1.8rem] text-white font-medium tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" onClick={() => {}}>Pay - $12</button>
      <PaystackButton className="paystack-button" email={userDetails.email} amount={userDetails.amount} publicKey='xxxx' />
    </form>
  </DashboardSettingsModal>
)
}

export const StripePaymentDetailsModal: React.FC<SubscriptionPlanModalProps> = ({ show, hide}) => {
  return (
    <DashboardSettingsModal showing={show} title="Select a payment option" hideModal={hide}>
      <StripeCheckoutForm />
    </DashboardSettingsModal>
  )
}