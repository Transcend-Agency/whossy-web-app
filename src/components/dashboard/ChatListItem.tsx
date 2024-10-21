import Skeleton from "react-loading-skeleton";

interface ChatListItemProps {
    profileImage: string | undefined;
    contactName: string;
    message: string;
    messageStatus?: boolean;
    onlineStatus?: boolean;
    openChat?: () => void;
    chatInterface?: boolean;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({profileImage, contactName, message, messageStatus, openChat, onlineStatus, chatInterface}) => {
  return (
    <div className='flex justify-between cursor-pointer hover:bg-[#f9f8f8] px-[1.6rem] pb-[0.6rem] pt-[1.4rem] transition-all duration-300 ease-in-out transform hover:scale-[1.02]' style={{borderBottom: '1px solid #F6F6F6'}} onClick={openChat}>
        <div className='flex gap-x-[0.8rem]'> 
            <div className='relative'>
                {profileImage ? <img className='size-[5.6rem] object-cover rounded-full' src={profileImage} alt="profile picture" /> : <div className='bg-[#D3D3D3] size-[5.6rem] rounded-full text-[1.8rem] font-semibold flex justify-center items-center'>{contactName?.charAt(0)}</div>}
               { onlineStatus && <div className='bg-white p-[0.2rem] absolute bottom-0 right-0 rounded-full'>
                    <div className='bg-[#0CB25A] size-[1.4rem] rounded-full'/>
                </div>}
            </div>
            <div>
                <p className='text-[1.8rem] leading-[2.16rem]'>{contactName}</p>
                <p className={` text-[1.6rem] leading-[1.92rem] ${message === 'Image' ? 'italic text-[#b2b2b5]' : 'text-[#8A8A8E]'}`}>{ message !== "Image" ? chatInterface ? message.length > 25 ? message.slice(0,25) + '...' : message : message.length > 35 ? message.slice(0,35) + '...' : message : 'sent a photo'}</p>
            </div>
        </div>
       {messageStatus && <p className='bg-[#F6F6F6] text-[1.4rem] flex items-center font-normal h-[28px] px-[0.6rem] rounded-[0.6rem]'>Unread</p>}
    </div>
  )
}

export const ChatListItemLoading = () => {
    return (
        <>
        <div className='flex justify-between cursor-pointer hover:bg-[#f9f8f8] px-[1.6rem] pb-[0.6rem] pt-[1.4rem] transition-all duration-300 ease-in-out transform hover:scale-[1.02]' style={{borderBottom: '1px solid #F6F6F6'}}>
          <div className='flex gap-x-[0.8rem]'> 
              <div className='relative'>
                  {/* {profileImage ? <img className='size-[5.6rem] object-cover rounded-full' src={profileImage} alt="profile picture" /> : <div className='bg-[#D3D3D3] size-[5.6rem] rounded-full text-[1.8rem] font-semibold flex justify-center items-center'>{contactName.charAt(0)}</div>} */}
                  <Skeleton width={'5.6rem'} height={'5.6rem'} circle/>
                  {/* <div className='bg-white p-[0.2rem] absolute bottom-0 right-0 rounded-full'>
                      <div className='bg-[#0CB25A] size-[1.4rem] rounded-full'/>
                  </div> */}
              </div>
              <div>
                  <Skeleton width={'100px'} height={'20px'} className="mb-3"/>
                  <Skeleton width={'40rem'} height={'20px'}/>
              </div>
          </div>
         {/* <Skeleton width={'210px'} height={'28px'}/> */}
      </div>
      </>
    )
  }