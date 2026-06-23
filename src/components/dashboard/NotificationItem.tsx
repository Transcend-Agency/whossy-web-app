import React from "react";

interface NotificationItemProps {
    newNotification: boolean;
    header: string;
    desc: string;
}

const NotificationItem:React.FC<NotificationItemProps> = ({newNotification, header, desc}) => {
return (
    <div className='flex justify-between pb-[1.2rem]' style={{borderBottom: '1px solid #ECECEC'}}>
        <div className='space-y-[1.2rem]'>
            <h1 className='text-[2rem] font-bold flex items-center gap-x-2'>{header} {newNotification && <div className='size-[0.8rem] bg-[#F2243E] rounded-full' />}</h1>
            <p className='text-[1.6rem] text-[#8A8A8E]'>{desc}</p>
        </div>
        <img src="/assets/images/matches/stephen.png" className='size-[4.8rem] object-cover rotate-6 rounded-[1.2rem]' alt="Image" />
        <div className='relative'>
            <img src="/assets/images/matches/stephen.png" className='size-[4.8rem] object-cover -rotate-6  rounded-[1.2rem] ' alt="" />
            <img src="/assets/images/matches/stephen.png" className='size-[4.8rem] absolute top-0 rotate-12 object-cover rounded-[1.2rem] translate-y-4 translate-x-4' style={{border: '0.3rem solid #FFFFFF'}} alt="" />
        </div>
    </div>
)
}

export default NotificationItem