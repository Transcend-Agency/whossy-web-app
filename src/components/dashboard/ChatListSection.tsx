import React from 'react'

interface ChatListSectionProps {
    data: [string, string, string, boolean, () => void][]
}

const ChatListSection: React.FC<ChatListSectionProps> = ({data}) => {
  return (
    <>
   { data.map((item, i)=> 
   <div key={i} className='flex  justify-between cursor-pointer pb-[0.6rem]' style={{borderBottom: '1px solid #F6F6F6'}} onClick={item[4]}>
        <div className='flex gap-x-[0.8rem]'> 
            <div className='relative'>
                <img className='size-[5.6rem] object-cover rounded-full' src={item[0]} alt="profile picture" />
                <div className='bg-white p-[0.2rem] absolute bottom-0 right-0 rounded-full'>
                    <div className='bg-[#0CB25A] size-[1.4rem] rounded-full'/>
                </div>
            </div>
            <div>
                <p className='text-[1.8rem] leading-[2.16rem]'>{item[1]}</p>
                <p className='text-[#8A8A8E] text-[1.6rem] leading-[1.92rem]'>{item[2]}</p>
            </div>
        </div>
       {item[3] && <p className='bg-[#F6F6F6] text-[1.4rem] flex items-center font-normal h-[28px] px-[0.6rem] rounded-[0.6rem]'>Unread</p>}
    </div>)}
    </>
  )
}

export default ChatListSection