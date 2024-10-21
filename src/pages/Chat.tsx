import { motion } from 'framer-motion';
import  { useEffect, useState } from 'react';
import DashboardPageContainer from '@/components/dashboard/DashboardPageContainer';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/store/UserId';
import { useNavigate } from 'react-router-dom';
import SelectedChatTwo from '@/components/dashboard/SelectedChatTwo';
import { User } from '@/types/user';
import { Chat } from '@/types/chat';
import { useChatIdStore } from '@/store/ChatStore';
import { ChatListItem, ChatListItemLoading } from '@/components/dashboard/ChatListItem';

// type UserProfileProps = {};

interface ChatDataWithUserData extends Chat {
  user: User;
}

const ChatPage = () => {
    const [activePage, setActivePage] = useState<'chats' | 'selected-chat'>('chats');
    const navigate = useNavigate();

    const { setChatId } = useChatIdStore();

  const {auth} = useAuthStore();
  const currentUserId= auth?.uid as string;

  // const [allChats, setAllChats] = useState<string[]>([]);
  const [allChats, setAllChats] = useState<ChatDataWithUserData[]>([]);


  const fetchUserData = async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {  return userDocSnap.data();} 
    else {  console.log(`No such user document for user_id: ${userId}`); return null;}
  };

  const fetchUserChats = async (id: string) => {
    const userChatsDocRef = doc(db, "allchats", id);
    const userChatsDocSnap = await getDoc(userChatsDocRef);
    if (userChatsDocSnap.exists()) {  return userChatsDocSnap.data() as Chat;} 
    else {  console.log(`No such user chats document for user_id: ${id}`); return null;}
  }
  
//   const updateSeenStatus = async (participants: string[], selectedUserId: string) => {
//     const first_participant = participants[0];
//     const second_participant = participants[1];

//     // Determine if the selected user is the initiator or recipient
//     const isInitiator = selectedUserId === first_participant;
//     const isReceiver = selectedUserId === second_participant;

//     if (!isInitiator && !isReceiver) {
//         // If the user is neither the initiator nor the recipient, do nothing
//         return;
//     }

//     // Construct the chat document reference based on the participants
//     const userChatsRef = doc(db, 'allchats', first_participant + '_' + second_participant);

//     // Update the appropriate seen status in Firestore
//     await updateDoc(userChatsRef, 
//      !isInitiator 
//       ? { isSeenByInitiator: true } 
//       : { isSeenByReceiver: true }
//     );
// };

  const [isLoadingChats, setIsLoadingChats] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingChats(true);
    const unSub = onSnapshot(collection(db, "allchats"), async (snapshot) => {

        if (!isMounted) return;

        const chatIds: string[] = [];

        snapshot.forEach((doc) => {
          if (doc.id.includes(currentUserId)) {
            chatIds.push(doc.id);
          }
        });

        const userChats = await Promise.all(
            chatIds.map((chatUserId) => fetchUserChats(chatUserId))
        );

        const chatDataWithUserData = await Promise.all(
            userChats
            .filter(chat => chat !== null)
            .map(async (chat: Chat) => {
                const recipientData = chat?.participants?.filter((participant: string) => participant !== currentUserId);
                const recipientUserData = await fetchUserData(recipientData[0]) as User;
                return { ...chat, user: recipientUserData }; 
            })
        );

        if (isMounted) {
            setAllChats(chatDataWithUserData);  // Update the state with the chat data
        }

        setIsLoadingChats(false);  
    });

    return () => {
        isMounted = false;
        unSub();
    };
}, [])
  
  const queryParams = new URLSearchParams(location.search);
  const reciepientUserId = queryParams.get('recipient-user-id');

  useEffect(() => {
    if (reciepientUserId) {
      setActivePage('selected-chat');
    } else {
      setActivePage('chats');
    }
  }, [reciepientUserId])


  const [chatParticipants, setChatParticipants] = useState<string>('');

  const updateChatId = (newChatId: string) => {
    setChatId(newChatId);
  };

    return <>
       {/* <ImagesModalMobile show={true}/> */}
        <DashboardPageContainer className="block">
            <motion.div animate={activePage == 'chats' ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0.3 }} transition={{ duration: 0.25 }} className='user-profile h-full space-y-10'>
                <section className='space-y-[1.6rem] px-[1.6rem]'>
                  <h1 className='text-[1.6rem] font-medium '>New Likes and Matches</h1>
                  <div className='flex gap-x-4'>
                    <div className='w-[11.2rem] h-[12rem] rounded-[1.2rem] p-2 relative' style={{border: '2px solid #FF5C00'}}>
                      <img src="/assets/images/matches/stephen.png" className='w-full h-full object-cover rounded-[1.2rem] blur-sm' alt="" />
                      <div className='absolute from-[#FF5C00] top-16 left-10 to-[#F0174B] rounded-full bg-gradient-to-b text-white font-medium text-[1.4rem] flex gap-x-1 p-[0.8rem]'><p>24</p> <img src='/assets/icons/likes.svg'/></div>
                      <div className='text-[1.2rem] text-white font-medium bg-gradient-to-b from-[#FF5C00] to-[#F0174B] absolute bottom-4 left-10 rounded-full w-fit p-2 px-4'>Likes</div>
                    </div>
                    <div className='w-[11.2rem] h-[12rem] flex flex-col justify-center items-center rounded-[1.2rem] p-2 relative bg-[#F6F6F6]'>
                      <img src="/assets/icons/no-matches-yet.svg" alt="" />
                      <p className='text-[#8A8A8E] text-[1.4rem]'>No match found!</p>
                      {/* <p className='text-[#8A8A8E] text-[1.4rem] mt-2'>{JSON.stringify(allChats)}</p> */}
                      <p className='leading-[0.8px] text-[#8A8A8E] text-[1.4rem]'>-</p>
                    </div>
                  </div>
                </section>
                {/* <button className='bg-red-600 text-white rounded-lg p-4 cursor-pointer' onClick={() => {console.log(chats); }}>Chat With User</button> */}
                <section>

                  {allChats && allChats.length !==0 && <h1 className='text-[1.6rem] font-medium mb-4 px-[1.6rem]'>Messages</h1>}
                  {/* {chats?.map((item: any, i: number) => (
                    <ChatListItem key={i} contactName={item.user.first_name} message={item.lastMessage ? item.lastMessage : 'No messages'} profileImage={item.preferences.photos[0]} messageStatus={!item.isSeen} openChat={() => {setActivePage('selected-chat'); setSelectedChatData(item); setChatId(item.chatId); handleSelectedChat(item); navigate(`/dashboard/chat?user_id=${item.user.uid}`)}}/>
                  ))} */}

                  {!isLoadingChats ? allChats.length === 0 ? <div className='text-[1.6rem] font-medium mb-4 px-[1.6rem] flex flex-col justify-center items-center h-full text-[#D3D3D3]'><p>No messages yet, go to the explore page to start chatting</p>. <button className='bg-[#F2243E] text-white py-3 px-6 rounded-lg active:scale-[0.95] transition ease-in-out duration-300 hover:scale-[1.02]' onClick={(e) => {e.preventDefault(); navigate('/dashboard/swipe-and-match');}}>Explore</button></div> : 
                  allChats.map((chat, i) => (
                    chat ? <><ChatListItem key={i} messageStatus={chat.status === "sent" ? chat.lastSenderId === auth?.uid ? false : true : false} onlineStatus={chat.user.status?.online} contactName={chat.user.first_name as string} message={chat.lastMessage} profileImage={ chat.user.photos && chat.user.photos[0] } 
                    // messageStatus={chat.user.uid !== chat.participants[0] ? !chat.isSeenByInitiator : !chat.isSeenByReceiver} 
                    openChat={() => {setActivePage('selected-chat'); navigate(`/dashboard/chat?recipient-user-id=${chat.user.uid}`); setChatId(chat.participants[0] + '_' + chat.participants[1]); setChatParticipants(chat.participants[0] + '_' + chat.participants[1]);
                    //  updateSeenStatus(chat.participants, chat.user.uid as string)
                    }}
                     />
                      {/* <button onClick={() => console.log(chat.participants[0] + '_' + chat.participants[1])}>click</button> */}
                      {/* {JSON.stringify(chat.lastSenderId + '_' + auth?.uid )} */}
                      </>
                       : null
                  ))
                   : Array.from({ length: 7 }).map(() => <ChatListItemLoading />)}
                  {/* <button onClick={() => console.log(allChats)}>click</button> */}
                </section>

            </motion.div>
            {/* <SelectedChat chatData={selectedChatData} activePage={activePage === "selected-chat"} closePage={() => {setActivePage('chats'); setSelectedChatData(null); navigate('/dashboard/chat')}} /> */}
            {/* <SelectedChatTwo activePage={activePage === "selected-chat"} closePage={() => {setActivePage('chats'); setSelectedChatData(null); navigate('/dashboard/chat')}} /> */}
            <SelectedChatTwo activePage={activePage} closePage={() => {setActivePage('chats'); navigate('/dashboard/chat')}} chatId={chatParticipants} updateChatId={updateChatId}/>

        </DashboardPageContainer>
        {/* <AnimatePresence mode="wait">
            <MobileProfile onEditProfilePage={() => setActivePage('edit-profile')} activePage='user-profile' onSettingsPage={() => setActivePage('profile-settings')} onFiltersPage={() => setActivePage('preferences')} userData={userData} userPrefencesData={userPrefencesData}/>
            <EditProfileMobile  activePage={activePage} closePage={() => setActivePage('user-profile')} onPreviewProfile={() => setActivePage('preview-profile')} userData={userData} userPrefencesData={userPrefencesData} refetchUserData={refetchUserData} refetchUserPreferencesData={refetchUserPreferences}/> 
            <PreviewProfileMobile  activePage={activePage == 'preview-profile'} closePage={() => setActivePage('edit-profile')} userData={userData} userPrefencesData={userPrefencesData}/> 
            <SettingsMobile activePage={activePage == 'profile-settings'} closePage={() => setActivePage('user-profile')}/>
            <PreferencesMobile activePage={activePage == 'preferences'} closePage={() => setActivePage('user-profile')} onInterests={() => setActivePage("interests")} userData={userData} userPrefencesData={userFilters} refetchUserData={refetchUserData} refetchUserPreferencesData={refetchUserFilters}/>
            <PreferredInterestsMobile activePage={activePage == 'interests'} closePage={() => setActivePage('preferences')} onInterests={() => setActivePage('interests')} userPrefencesData={userFilters} refetchUserPreferencesData={refetchUserFilters}/> */}

            {/* <Interests activePage={activePage === "interests"} closePage={() => setActivePage('preferences')} /> */}

            {/* <AnimatePresence>
              
            </AnimatePresence> */}

        {/* </AnimatePresence> */}
    </>
}
export default ChatPage;