import { User } from "@/types/user";
import Skeleton from "react-loading-skeleton";
import {Chat, Messages} from "@/types/chat.ts";
import { FC, useEffect, useState} from "react";
import {useAuthStore} from "@/store/UserId.tsx";
import {getLastValidMessage} from "@/utils/chatService.ts";

interface ChatListItemProps {
    profileImage?: string | null;
    contactName: string;
    onlineStatus?: boolean;
    openChat?: () => void;
    chatInterface?: boolean;
    userData?: User;
    chatUnlocked?: boolean;
    chat?: Chat
}

export const ChatListItem: FC<ChatListItemProps> = ({profileImage, contactName, openChat, onlineStatus, chatInterface, userData, chatUnlocked, chat}) => {

    const [lastMessage, setLastMessage] = useState('...');
    const [messageStatus, setMessageStatus] = useState(false);
    const {auth} = useAuthStore()

    useEffect(() => {
        const fetchLastMessage = async () => {
            const message = await getLastValidMessage(chat as Chat, userData?.uid as string) as Messages;
            const messageStatus = await getMessageStatus(chat as Chat, userData?.uid as string) as boolean
            if(message != null){
                if(message.message == null) {
                    setLastMessage('Image')
                }else{
                    setLastMessage(message.message as string);
                }
            }
            setMessageStatus(messageStatus)
        };

        fetchLastMessage();
    }, [chat, userData?.uid]);

    const getMessageStatus = async (chat: Chat, currentUserUid: string) => {
        const lastMessage = await getLastValidMessage(chat, currentUserUid) as Messages;

        if (!lastMessage) {
            return false;
        }

        return (
            chat.status === "sent" ||
            (!chat.is_unlocked && userData?.is_premium === false)
        ) && lastMessage.sender_id_blocked === false && lastMessage.sender_id !== auth?.uid;
    };

    return ( <div className='flex justify-between cursor-pointer hover:bg-[#f9f8f8] px-[1.6rem] pb-[0.6rem] pt-[1.4rem] transition-all duration-300 ease-in-out transform hover:scale-[1.02]' style={{borderBottom: '1px solid #F6F6F6'}} onClick={openChat} >
        <div className='flex gap-x-[0.8rem]'> 
            <div className='relative'>
                { profileImage ? <img className='size-[5.6rem] object-cover rounded-full' src={profileImage} alt="profile picture" /> : <div className='bg-[#D3D3D3] size-[5.6rem] rounded-full text-[16px] font-semibold flex justify-center items-center'>{contactName?.charAt(0)}</div>}
                {onlineStatus && <div className='bg-white p-[0.2rem] absolute bottom-0 right-0 rounded-full'>
                    <div className='bg-[#0CB25A] size-[1.4rem] rounded-full'/>
                </div>}
            </div>
            <div>
                <p className='text-[15px] leading-[3rem]'>{contactName} </p>
                {userData?.is_premium || chatUnlocked ? (<p className={`text-[12px] leading-[1.92rem] ${lastMessage === 'Image' ? 'italic text-[#b2b2b5]' : 'text-[#8A8A8E]'}`}> {lastMessage !== "Image" ? (chatInterface ? lastMessage.length > 25 ? lastMessage.slice(0, 25) + '...' : lastMessage : lastMessage.length > 35 ? lastMessage.slice(0, 35) + '...' : lastMessage) : 'sent a photo'}
                        </p> ) : (<p className="text-[12px] leading-[1.92rem] text-[#8A8A8E]">Upgrade plan or use credits to chat</p>)}
            </div>
        </div>
       {messageStatus && <p className='bg-[#F6F6F6] text-[14px] flex items-center font-normal h-[28px] px-[0.6rem] rounded-[0.6rem]'>Unread</p>}
    </div>
  )
}

export const ChatListItemLoading = () => {
    return (
        <>
        <div className='flex justify-between cursor-pointer hover:bg-[#f9f8f8] px-[1.6rem] pb-[0.6rem] pt-[1.4rem] transition-all duration-300 ease-in-out transform hover:scale-[1.02]' style={{borderBottom: '1px solid #F6F6F6'}}>
          <div className='flex gap-x-[0.8rem]'> 
              <div className='relative'>
                  <Skeleton width={'5.6rem'} height={'5.6rem'} circle/>
              </div>
              <div>
                  <Skeleton width={'100px'} height={'20px'} className="mb-3"/>
                  <Skeleton width={'40rem'} height={'20px'}/>
              </div>
          </div>
      </div>
      </>
    )
  }