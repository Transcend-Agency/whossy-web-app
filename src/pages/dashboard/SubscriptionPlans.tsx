import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PremiumPlansHeader } from "./PremiumPlans";
import { FreePlanBenefit, PremiumPlanBenefit } from "@/components/dashboard/PlanBenefit";
import { PaymentDetailsModal, StripePaymentDetailsModal, SubscriptionPlanModal } from "@/components/dashboard/SubscriptionPlanModal";


interface SubscriptionPlansProps {
    activePage: boolean;
    currentPlan : 'free' | 'premium';
    closePage: () => void;
}

// type SettingsModal = 'hidden' | 'name' | 'gender' | 'email' | 'phone' | 'relationship-preference' | 'love-language' | 'zodiac' | 'future-family-plans' | 'smoker' | 'religion' | 'drinking' | 'workout' | 'pet' | 'marital-status' | 'height' | 'weight' | 'education'

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ activePage, closePage, currentPlan }) => {

    const [plan, setPlan] = useState<'free' | 'premium'>(currentPlan);

    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const [mouseStartX, setMouseStartX] = useState<number | null>(null);

    const [isDragging, setIsDragging] = useState<boolean>(false);

    useEffect(() => {
        setPlan(currentPlan);
    }
    , [currentPlan]);

    // swiping with two fingers
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaX > 10) {
          setPlan('premium');
        } else if (e.deltaX < -10) {
          setPlan('free');
        }
    };

    // swiping on mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const touchEndX = e.touches[0].clientX;
    
        if (touchStartX - touchEndX > 50) {
          // Swiped left
          setPlan('premium');
        } else if (touchStartX - touchEndX < -50) {
          // Swiped right
          setPlan('free');
        }
    };
    
    const handleTouchEnd = () => {
        setTouchStartX(null); // Reset touch start after move ends
    };

    //mouse dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        setMouseStartX(e.clientX); // Store starting X position
        setIsDragging(true);       // Set dragging state
      };
    
      const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || mouseStartX === null) return;
        const mouseEndX = e.clientX;
    
        if (mouseStartX - mouseEndX > 50) {
            setPlan('premium'); // Dragged left
        } else if (mouseStartX - mouseEndX < -50) {
            setPlan('free'); // Dragged right
        }
      };
    
      const handleMouseUp = () => {
        setMouseStartX(null); // Reset mouse position
        setIsDragging(false); // End dragging
      };

      const [showPaymentOptionsModal, setShowPaymentOptionsModal] = useState<'hidden' | 'plan' | 'payment-detail' | 'stripe-payment'>('hidden');

    return (
        <>
            <SubscriptionPlanModal show={showPaymentOptionsModal === "plan"} hide={() => setShowPaymentOptionsModal('hidden')}  advance={ setShowPaymentOptionsModal }/>
            <PaymentDetailsModal show={showPaymentOptionsModal === "payment-detail"} hide={() => setShowPaymentOptionsModal('plan')}  />
            <StripePaymentDetailsModal show={showPaymentOptionsModal === "stripe-payment"} hide={() => setShowPaymentOptionsModal('plan')}  />
            <motion.div onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} animate={activePage ? { x: "-100%", opacity: 1 } : { x: 0 }} transition={{ duration: 0.25 }} className="dashboard-layout__main-app__body__secondary-page edit-profile settings-page">
                <div className="settings-page__container">
                    <div className="settings-page__title">
                        <button onClick={closePage} className="settings-page__title__left">
                            <img src="/assets/icons/back-arrow-black.svg" className="settings-page__title__icon" />
                            <p>Subscription Plans</p>
                        </button>
                        {/* <button className="settings-page__title__save-button">Save</button> */}
                    </div>
                    <section className="py-[0.8rem] flex relative h-[12rem]" >
                        <div className="w-full px-[2.4rem]">
                               <div className=" min-w-full px-[1.2rem] py-[1.6rem] text-[#FF5C00] bg-gradient-to-r from-[#ff5e0030] to-white  " style={{border: '1.5px solid #FF5C00', borderRadius: '1.2rem'}}>
                                    <h1 className="text-[2.4rem] font-bold ">Whossy Free Plan</h1>
                                    <p className="flex gap-[0.4rem]"><span className="text-[1.6rem] font-semibold self-center">$</span><span className="text-[3.2rem] font-medium self-end">0</span><span className="text-[1.6rem] font-bold self-end">/month</span></p>
                                </div>
                        </div>
                       <PremiumPlansHeader plan={plan === 'premium'}/>
                    </section>
                    <div className="flex justify-center gap-x-[0.8rem] relative">
                        <div className={`${plan !== 'free' ? 'w-[1rem]' : 'w-[2.4rem] bg-gradient-to-b from-[#FF5C00] to-[#F0174B] '} h-[1rem] cursor-pointer transition-all duration-700 ease-in-out`} style={{border: plan !== 'free' ? '1px solid #8A8A8E' : '', borderRadius: plan !== 'free' ? '100%' : '9999px'}} onClick={() => setPlan('free')}/>
                        <div className={`${plan !== 'premium' ? 'w-[1rem]' : 'w-[2.4rem] bg-gradient-to-b from-[#8A8A8E] to-[#E3E3E3] '} h-[1rem] cursor-pointer transition-all duration-700 ease-in-out`} style={{border: plan !== 'premium' ? '1px solid #FF5C00' : '', borderRadius: plan !== 'premium' ? '100%' : '9999px'}} onClick={() => setPlan('premium')}/>
                    </div>
                    <section className="py-[1.6rem] flex relative space-y-4">
                        <FreePlanBenefit plan={plan === 'free'} onSubscribe={() => setShowPaymentOptionsModal('plan')}/>
                        <PremiumPlanBenefit plan={plan === 'premium'}/>
                    </section>
                </div>
            </motion.div>
        </>
    )
}

export default SubscriptionPlans;