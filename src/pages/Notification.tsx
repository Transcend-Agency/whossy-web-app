import DashboardPageContainer from '@/components/dashboard/DashboardPageContainer'
import { motion } from 'framer-motion'

const Notification = () => {
    const newNotification = true;
  return (
    <>
        <DashboardPageContainer className="block">
            <motion.div animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }} className='user-profile dashboard-layout__main-app__body__main-page '>
                <button className=' flex pb-[1.6rem] px-[2.4rem] gap-[1.2rem] cursor-pointer hover:scale-[1.02] active:scale-[0.95] transition duration-300' style={{borderBottom: '1px solid #ECECEC'}} onClick={() => window.history.back()} >
                    <img src="/assets/icons/back-arrow-black.svg" alt="" />
                    <span className='text-[1.8rem]'>Notifications</span>
                </button>
                <main className='px-[2.4rem] py-[1.6rem] space-y-[2rem]'>
                    <div className='flex justify-between pb-[1.2rem]' style={{borderBottom: '1px solid #ECECEC'}}>
                        <div className='space-y-[1.2rem]'>
                            <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>New like {newNotification && <div className='size-[0.8rem] bg-[#F2243E] rounded-full' />}</h1>
                            <p className='text-[1.6rem] text-[#8A8A8E]'>Someone new liked your profile. Check it out now.</p>
                        </div>
                        <img src="/assets/images/matches/stephen.png" className='size-[4.8rem] object-cover rotate-6 rounded-[1.2rem]' alt="" />
                    </div>
                    <div className='flex justify-between pb-[1.2rem]' style={{borderBottom: '1px solid #ECECEC'}}>
                        <div className='space-y-[1.2rem]'>
                            <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>New like {newNotification && <div className='size-[0.8rem] bg-[#F2243E] rounded-full' />}</h1>
                            <p className='text-[1.6rem] text-[#8A8A8E]'>Someone new liked your profile. Check it out now.</p>
                        </div>
                        <img src="/assets/images/matches/stephen.png" className='size-[4.8rem] object-cover rotate-6 rounded-[1.2rem]' alt="" />
                    </div>
                    <div className='flex justify-between pb-[1.2rem]' style={{borderBottom: '1px solid #ECECEC'}}>
                        <div className='space-y-[1.2rem]'>
                            <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>You've matched with Jessica {newNotification && <div className='size-[0.8rem] bg-[#F2243E] rounded-full' />}</h1>
                            <p className='text-[1.6rem] text-[#8A8A8E]'>Message Jessica to know more about them.</p>
                        </div>
                        <div className='relative'>
                            <img src="/assets/images/matches/stephen.png" className='size-[4.8rem]  object-cover -rotate-6  rounded-[1.2rem] ' alt="" />
                            <img src="/assets/images/matches/stephen.png" className='size-[4.8rem] absolute top-0 rotate-12 object-cover rounded-[1.2rem] translate-y-4 translate-x-4' style={{border: '0.3rem solid #FFFFFF'}} alt="" />
                        </div>
                    </div>
                </main>
            </motion.div>
        </DashboardPageContainer>
    </>
  )
}

export default Notification