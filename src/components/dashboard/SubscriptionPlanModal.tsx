import React, { useState } from 'react';
import DashboardSettingsModal from './DashboardSettingsModal'
// import StripeCheckoutForm from './StripeCheckoutForm';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '@/firebase';
import { useAuthStore } from '@/store/UserId';
import { Oval } from 'react-loader-spinner';
import { useGetCustomerInformation, useSubscribe, useUnsubscribe } from '@/hooks/usePaystack';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/user';
import { addCommasToNumber } from '@/constants';
import { useNombaRecurringPayment } from '@/hooks/useNomba';
import { useNombaStore } from '@/store/Nomba';


interface SubscriptionPlanModalProps {
  show: boolean, hide: () => void; advance?: (val: 'stripe-payment' | 'payment-detail') => void, refetchUserData?: () => void
}

// type UserDetails = {name: string, phone: string, amount: number}



export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps & { setCurrency: (currency: 'ngn' | 'kes' | 'usd') => void }> = ({ show, hide, advance, setCurrency}) => {

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ngn' | 'kes' | 'usd'>('ngn');

  const makeRecurringPayment = useNombaRecurringPayment();
  const { auth_response } = useNombaStore();

  const { user } = useAuthStore();

  const [ isLoading, setIsLoading ] = useState(false);

  const handlePayment = async () => {
    if ( advance && (selectedPaymentMethod === 'ngn' || selectedPaymentMethod === 'kes') ) {
      setCurrency(selectedPaymentMethod);
      advance( 'payment-detail' );
    } else {
      toast.success('This is a dollar payment');
      setIsLoading(true);
      // obtainAccessToken.mutate({ grant_type: "client_credentials", client_id: import.meta.env.VITE_NOMBA_CLIENT_ID, client_secret: import.meta.env.VITE_NOMBA_CLIENT_SECRET }, {
      //   onSuccess: (res) => {
      //     setAuthResponse(res.data);
      //     makeRecurringPayment.mutate({
      //       order: { amount: 30, callbackUrl: "http://localhost:5173/dashboard/user-profile", currency: "USD", customerEmail: user?.email as string }, 
      //         }, {
      //             onSuccess: (paymentRes) => {
      //             window.open(paymentRes.data.checkoutLink);
      //             setIsLoading(false);
      //             },
      //             onError: () => {
      //               setIsLoading(false);
      //             }
      //     })
      //   },
      //   onError: () => {
      //     setIsLoading(false);
      //   }
      // })
      makeRecurringPayment.mutate({
        order: { amount: 30, callbackUrl: "http://localhost:5173/dashboard/user-profile", currency: "USD", customerEmail: user?.email as string }, 
          }, {
              onSuccess: (paymentRes) => {
              window.open(paymentRes.data.checkoutLink);
              setIsLoading(false);
              // window.open(paymentRes.data.checkoutLink, '_blank');
              },
              onError: () => {
                setIsLoading(false);
              }
      })
    }
  }

  

  return (
    <DashboardSettingsModal showing={show} title="Select a payment option" hideModal={hide}>
      <div className="flex flex-col gap-y-4 ">
        <div className='cursor-pointer text-[1.8rem] font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] flex items-center gap-x-2 rounded-[0.8rem] hover:bg-[#fafafa] transition duration-300 hover:scale-[1.01] ' style={{border: '1px solid', borderColor: selectedPaymentMethod === 'ngn' ? '#f46a1afa' : '#ececec'}}
          onClick={() => setSelectedPaymentMethod('ngn')}>
            <div className={`size-[2rem] rounded-full transition-all duration-300 ${selectedPaymentMethod === 'ngn' ? 'bg-[#f46a1afa]' : 'bg-white'}`} style={{border: '1px solid #ececec'}}/>
            <p className='text-center w-full text-[#8A8A8E]'>Pay using Naira (NGN)</p>
        </div>
        <div className='cursor-pointer text-[1.8rem] font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] flex items-center gap-x-2 rounded-[0.8rem] hover:bg-[#fafafa] transition duration-300 hover:scale-[1.01] ' style={{border: '1px solid', borderColor: selectedPaymentMethod === 'kes' ? '#f46a1afa' : '#ececec'}}
          onClick={() => setSelectedPaymentMethod('kes')}>
            <div className={`size-[2rem] rounded-full transition-all duration-300 ${selectedPaymentMethod === 'kes' ? 'bg-[#f46a1afa]' : 'bg-white'}`} style={{border: '1px solid #ececec'}}/>
            <p className='text-center w-full text-[#8A8A8E]'>Pay using Kenyan Shellings (KES)</p>
        </div>
        <div className='cursor-pointer text-[1.8rem] font-medium bg-[#FFFFFF] px-[1.8rem] py-[1.8rem] flex items-center gap-x-2 rounded-[0.8rem] hover:bg-[#fafafa] transition duration-300 hover:scale-[1.01] ' style={{border: '1px solid', borderColor: selectedPaymentMethod === 'usd' ? '#f46a1afa' : '#ececec'}}
          onClick={() => setSelectedPaymentMethod('usd')}>
            <div className={`size-[2rem] rounded-full transition-all duration-300 ${selectedPaymentMethod === 'usd' ? 'bg-[#f46a1afa]' : 'bg-white'}`} style={{border: '1px solid #ececec'}}/>
            <p className='text-center w-full text-[#8A8A8E]'>Pay using Dollars (USD) {auth_response?.data.access_token} </p>
        </div>
        <button className="bg-[#ff5e00f7] w-full py-[1.5rem] text-center flex justify-center rounded-[0.8rem] text-[1.8rem] text-white font-medium tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" onClick={
          handlePayment
        }>{!isLoading ? 'Next' : <Oval color="#ffffff" secondaryColor="#fefefe" width={20} height={20} />}</button>
        {/* <Oval color="#FFFFFF" secondaryColor="#FFFFFF" width={20} height={20} /> */}
      </div>
    </DashboardSettingsModal>
  )
}

export const PaystackPaymentDetailsModal: React.FC<SubscriptionPlanModalProps & { currency: 'ngn' | 'kes' | 'usd', userData: User }> = ({ show, hide, currency, userData}) => {

const navigate = useNavigate();

const { reset } = useAuthStore();

const { mutate } = useSubscribe(currency === 'ngn' ? import.meta.env.VITE_PAYSTACK_SECRET_TEST_KEY_NGN : import.meta.env.VITE_PAYSTACK_SECRET_TEST_KEY_KES);

const logout = () => {
  firebaseAuth.signOut().then(
      () => { console.log('signed out'); reset(); navigate('/')}
  ).catch((err) =>{
      console.log("An error occurred while trying to logout", err); toast.error("Error Logging out")
})
}

const [isLoading, setIsLoading] = useState(false);

return (
  <DashboardSettingsModal showing={show} title="Details" hideModal={hide}>
    <form className="flex flex-col gap-y-6" 
      onSubmit= { (e) => { 
        e.preventDefault(); 
        if (userData) {
        setIsLoading(true);

        if (currency === 'ngn') {
          mutate({email: userData?.email as string, amount: 50000, plan: 'PLN_pmtergy4o4vv216', metadata: { userId: userData?.uid as string } }, { onSuccess: async(res) => {  
            // const userDocRef = doc(db, "users", user?.uid as string);
            // await updateDoc(userDocRef, {
            //   paystack: {
            //     reference: res.data.reference
            //   },
            //   currency: 'ngn'
            // });
  
            // setTimeout(() => { 
              window.open(res.data.authorization_url, '_blank');
              logout();
            //  }, 2000)
          }, onError: () => { toast.error('Payment failed. Please try again'); setIsLoading(false); }});
        }
        else {
          toast.error('Plan for kenyan shellings hasn\'t been created');
          setIsLoading(false);
        }
        
        } else {
            toast.error("Please fill in all fields");
          }
        }
      }
      >
      <div className='flex flex-col space-y-2 text-[1.8rem]'>
          <label htmlFor="name" className='text-[#666]'>Name</label>
          <input id='name' type="text" value={(userData?.first_name as string) + ' ' + (userData?.last_name as string)} readOnly placeholder='Enter your full name' className='border py-4 px-4 outline-none border-[#ccc] rounded-lg placeholder:text-[#dad9d9]'/>
      </div>
      <div className='flex flex-col space-y-2 text-[1.8rem]'>
          <label htmlFor="name" className='text-[#666]'>Phone Number</label>
          <input id='name' type="text" value={(userData?.phone_number as string)} readOnly placeholder='Enter your phone number' className='border py-4 px-4 outline-none border-[#ccc] rounded-lg placeholder:text-[#dad9d9]'/>
      </div>
      <div className='flex flex-col space-y-2 text-[1.8rem]'>
          <label htmlFor="name" className='text-[#666]'>Email</label>
          <input id='name' type="email"  placeholder='Enter your email address' className='border py-4 px-4 outline-none border-[#ccc] rounded-lg placeholder:text-[#dad9d9]'
          value={(userData?.email as string)} readOnly
          />
      </div>
      <button 
      className="bg-[#ff5e00f7] w-full py-[1.5rem] text-center flex justify-center items-center rounded-[0.8rem] text-[1.8rem] text-white font-medium tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" 
      >{ !isLoading ? `Pay - ${currency === 'ngn' ? '₦' + addCommasToNumber(50000) : 'KES' + addCommasToNumber(2000) }` : <Oval color="#ffffff" secondaryColor="#f6f6f6" width={20} height={20} /> }</button>
      {/* <PaystackButton text='Pay Now' className="paystack-button" email={userDetails.email}  amount={userDetails.amount} publicKey={publicKey} onSuccess={handleSuccessfulPayment}/> */}
      {/* <button onClick={(e) => {alert('pay now'); e.preventDefault()}}>click</button> */}
    </form>
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

export const CancelPlanModal: React.FC<SubscriptionPlanModalProps & { userData: User }> = ({ show, hide, refetchUserData, userData}) => {

  const { auth, user } = useAuthStore();

  const userDoc = doc(db, "users", auth?.uid as string );

  const [isLoading, setIsLoading] = useState(false);

  const sk = userData?.paystack?.charge_success?.currency === 'NGN' ? import.meta.env.VITE_PAYSTACK_SECRET_TEST_KEY_NGN : import.meta.env.VITE_PAYSTACK_SECRET_TEST_KEY_KES;

  const { mutate } = useUnsubscribe();
  const fetchCustomerInfo = useGetCustomerInformation();

  const handleUnsubscription = async () => {
    setIsLoading(true);

    if (user) {
      fetchCustomerInfo.mutate({email_or_code: user.email as string, sk}, {onSuccess: (res) => {
        console.log(res);
        mutate ({
          code: res.data.subscriptions[0].subscription_code,
          token: res.data.subscriptions[0].email_token,
          sk
          }, { onSuccess: async() => {
          await updateDoc(userDoc, {
            is_premium: false,
            paystack: {}
          });
          refetchUserData && refetchUserData();
          toast.success('Subscription cancelled successfully');
          window.location.reload();
          hide();
          }, onError: () => { setIsLoading(false); toast.error('An error occurred while trying to cancel subscription. Please try again later') }})
      }})
    }
  }

  //   if (userData) {
  //     console.log(userData)
  //     mutate ({
  //       code: userData.paystack?.subscription_code as string,
  //       token: userData.paystack?.email_token as string,
  //       sk
  //     }, { onSuccess: async() => {
  //       await updateDoc(userDoc, {
  //         is_premium: false,
  //         paystack: {}
  //       });
  //       refetchUserData && refetchUserData();
  //       toast.success('Subscription cancelled successfully');
  //       window.location.reload();
  //       hide();
  //     }, onError: () => { setIsLoading(false); toast.error('An error occurred while trying to cancel subscription. Please try again later') }})
  //   } 
  // } 

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