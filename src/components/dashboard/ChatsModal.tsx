import DashboardSettingsModal from './DashboardSettingsModal'
import { IoSend } from "react-icons/io5";
import React from "react";

interface ActionsModalProps {
  show: boolean, hide: () => void, chatName: string, blockUser: () => void, reportUser: () => void
}

export const ActionsModal: React.FC<ActionsModalProps> = ({ show, hide, chatName, blockUser, reportUser }) => {
  return (
    <DashboardSettingsModal showing={show} title="Actions" hideModal={hide}>
      <div className="flex flex-col gap-y-4">
        <button className='cursor-pointer text-[1.8rem] font-medium bg-[#F6F6F6] py-[1.8rem] flex justify-center items-center gap-x-2 rounded-[0.8rem] hover:bg-[#ececec] transition duration-300 hover:scale-[1.02] active:scale-[0.9]' onClick={blockUser}>
            <img src='/assets/icons/block-user.svg' alt={``} /><p>Block {chatName} </p></button>
        <button className='cursor-pointer text-[1.8rem] font-medium bg-[#F6F6F6] text-[#F2243E] py-[1.8rem] flex justify-center items-center gap-x-4 rounded-[0.8rem] hover:bg-[#ececec] transition duration-300 hover:scale-[1.02] active:scale-[0.9]' onClick={reportUser}><img src='/assets/icons/report.svg' alt={``} /><p className='mt-2'>Report {chatName} </p></button>
      </div>
    </DashboardSettingsModal>
  )
}

export const ImagesModal: React.FC<ActionsModalProps & {imageUrl: string, sendImage: () => void, text: string, setText: (text: string) => void}> = ({show, hide, text, setText, imageUrl, sendImage}) => {
  return (
    <DashboardSettingsModal showing={show} title="Send Image" hideModal={hide}>
         <div className="flex flex-col gap-y-4 ">
          <div className='bg-[#F6F6F6]' style={{border: '1px solid #F6F6F6'}}><img src={imageUrl} className='w-full h-96 object-contain' alt="Selected Image" /></div>
          <div className="flex bg-[#F6F6F6] text-[1.3rem] w-full rounded-l-full px-5 py-5 items-center rounded-r-full overflow-hidden"><input type="text" className="bg-inherit outline-none w-full" placeholder="Write a message... "  value={text} onChange={(e) => setText(e.target.value)}
          // onKeyDown={(e) => {if (e.key == 'Enter') {console.log('Enter was pressed')} else return;}}
          /> <IoSend className='cursor-pointer' onClick={sendImage}/> </div>
         </div>
     </DashboardSettingsModal>
  )
}