import { AnimatePresence, motion} from "framer-motion"

type PlanBenefitProps = {plan: boolean, onSubscribe?: () => void}

export const FreePlanBenefit: React.FC<PlanBenefitProps> = ({plan, onSubscribe}) => {

  return (
    <AnimatePresence>
    { plan &&  
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ duration: 0.5, ease: 'easeInOut' }}
    className="absolute w-full px-[2.4rem] space-y-[1.2rem]">
         {free_benefits.map((benefit, i) =>
         <div
          className="  py-[1.2rem] rounded-[0.8rem]  w-full px-[1.6rem] "
          style={{border: '1.5px solid #D9D9D9'}} key={i}
          >
              <h1 className="text-[1.8rem] font-bold ">{benefit.title}</h1>
              <div className="flex justify-between items-center leading-[1.92rem]"><p className="text-[1.6rem] text-[#8A8A8E] font-medium"><span>{benefit.isAvailable ? '✅' : '❌' }</span> <span>{benefit.desc}</span></p> <span className="bg-gradient-to-b from-[#FF5C00] to-[#F0174B] text-white rounded-full px-[1rem] py-[0.5rem]">Likes</span> </div>
          </div>)}
          <div className="sticky bottom-0 bg-white w-full py-[2.4rem] px-[3.2rem]"><button className="bg-[#FF5C00] w-full py-[2rem] text-center rounded-[0.8rem] text-[1.8rem] text-white font-medium tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300" onClick={onSubscribe}>Subscribe</button></div>
      </motion.div>}
    </AnimatePresence>
  )
}

export const PremiumPlanBenefit: React.FC<PlanBenefitProps> = ({plan}) => {
  return (
    <AnimatePresence>
       {plan &&  <motion.div 
         initial={{ x: "100%" }}   animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.5 }}
        className="absolute w-full px-[2.4rem] space-y-[1.2rem]" style={{marginTop: 0}}>
            {premium_benefits.map((benefit, i) => 
            <div key={i} className="px-[1.6rem] space-y-[1.2rem] w-full py-[1.2rem] rounded-[0.8rem] bg-white" style={{border: '1.5px solid #D9D9D9'}}>
                <h1 className="text-[1.8rem] font-bold ">{benefit.title}</h1>
                <div className="flex justify-between items-center"><p className="text-[1.6rem] text-[#8A8A8E] font-medium">✅ {benefit.desc}</p> <span className="bg-gradient-to-b from-[#FF5C00] to-[#F0174B] text-white rounded-full px-[1rem] py-[0.5rem]">Likes</span> </div>
            </div>)}
          <div className="sticky bottom-0 bg-white w-full py-[2.4rem] px-[3.2rem]"><button className="bg-[#AAAAAA] w-full py-[2rem] text-center rounded-[0.8rem] text-[1.8rem] text-white font-medium tracking-wide cursor-pointer">Subscribe</button></div>
        </motion.div>}
    </AnimatePresence>
  )
}

// export default PlanBenefit

const free_benefits = [ 
  {title: 'Swipe and Match', desc: 'Unlimited likes', isAvailable: true},
  {title: 'Explore Feature', desc: 'Limited Basic Filters (New Members, Popular, In My Area, Online Members)', isAvailable: true},
  {title: 'Chat Initiation', desc: 'Cannot Chat', isAvailable: false},
  {title: 'Advertisements', desc: 'Display Ads', isAvailable: false},
  {title: 'Rewind (Undo Accidental Swipes)', desc: 'Not Available', isAvailable: false},
  {title: 'See who liked you', desc: 'Available', isAvailable: true},
  {title: 'See who liked you', desc: 'Available', isAvailable: true},
  {title: 'Top Picks', desc: 'Not Available', isAvailable: false},
  {title: 'Pofile boost visibility', desc: 'Limited Visibility', isAvailable: true},
  {title: 'Pofile boosts', desc: 'Available via credits', isAvailable: true},
]

const premium_benefits = [ 
  {title: 'Swipe and Match', desc: 'Unlimited likes', cat: 'Likes'},
  {title: 'Explore Feature', desc: 'Limited Basic Filters (New Members, Popular, In My Area, Online Members)', cat: 'Experience'},
  {title: 'Chat Initiation', desc: 'Cannot Chat', cat: 'Chat'},
  {title: 'Advertisements', desc: 'Display Ads', cat: 'Experience'},
  {title: 'Rewind (Undo Accidental Swipes)', desc: 'Not Available', cat: 'Experience'},
  {title: 'See Who Liked You', desc: 'Available', cat: 'Likes'},
  {title: 'Top Picks', desc: 'Not Available', cat: 'Experience'},
  {title: 'Profile Boost Visibility', desc: 'Limited Visibility', cat: 'Visibility'},
  {title: 'Profile Boosts', desc: 'Available via credits', cat: 'Visibility'},
  {title: 'Dark Mode', desc: 'Available via credits', cat: 'Bonus'},
]