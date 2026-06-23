// import {AnimatePresence, motion} from 'framer-motion'
import { useEffect, useRef } from 'react';
import DashboardSettingsModal from './DashboardSettingsModal';

interface PhotoModalProps {
    showing: boolean;
    onModalClose: () => void;
    changeImage: () => void;
    deleteImage: () => void;
}

interface UploadPhotoModalProps {
    showing: boolean;
    onModalClose: () => void;
    changeImage: () => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({onModalClose, showing, changeImage, deleteImage}) => {

	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if ( dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onModalClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);
  return (
    <> 
    <DashboardSettingsModal showing={showing} hideModal={onModalClose} title='Edit Photo'>
    <div className="space-y-6 text-[1.4rem] text-[#8A8A8E]">
              <button className="rounded-lg w-full gap-x-2 py-3 cursor-pointer flex justify-center items-center" style={{ border: "1px solid #D9D9D9" }} onClick={() =>  {deleteImage(); changeImage()}}>
               <img src="/assets/icons/re-upload-photo.svg" alt="" /> <p>Re-upload</p>
              </button>
              <button className="rounded-lg w-full gap-x-2 py-3 cursor-pointer flex justify-center items-center" style={{ border: "1px solid #D9D9D9" }} onClick={() =>  {deleteImage()}}>
               <img src="/assets/icons/delete-photo.svg" alt="" /> <p>Delete photo</p>
              </button>
            </div>
    </DashboardSettingsModal>
    {/* <AnimatePresence mode='wait'>
        {showing && <motion.div
          className="absolute inset-0 bg-[#0000004D] flex justify-center items-center z-[9999]"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white w-[35rem] h-fit rounded-lg shadow-lg z-50"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            ref={dropdownRef}
          >
            <header className="flex items-center justify-between p-[1.6rem] border-b">
              <h1 className="text-black text-[1.6rem]">Edit Photo</h1>
              <button className="text-black" aria-label="Close modal"  onClick={onModalClose}>
                <img src="/assets/icons/close.svg" className="cursor-pointer" alt="Close icon"/>
              </button>
            </header>
            <hr />
            {/* <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageSelect}/> */}
            {/* <div className="p-[1.6rem] space-y-3 text-[1.4rem] text-[#8A8A8E]">
              <button className="rounded-lg w-full py-3 cursor-pointer text-center" style={{ border: "1px solid #D9D9D9" }} onClick={() =>  {deleteImage(); changeImage()}}>
                Re-upload
              </button>
              <button className="rounded-lg w-full py-3 cursor-pointer text-center" style={{ border: "1px solid #D9D9D9" }} onClick={deleteImage}>
                Delete Photo
              </button>
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence> */}
    </>
  )
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({onModalClose, showing, changeImage}) => {

	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if ( dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onModalClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);
  return (
    <> 
    <DashboardSettingsModal showing={showing} hideModal={onModalClose} title='Edit Photo'>
    <div className="text-[1.4rem] text-[#8A8A8E]">
              <button className="rounded-lg w-full py-3 cursor-pointer text-center" style={{ border: "1px solid #D9D9D9" }} onClick={changeImage}>
                Upload Photo
              </button>
    </div>
    </DashboardSettingsModal>
    {/* <AnimatePresence mode='wait'>
        showing && <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white w-[35rem] h-fit rounded-lg shadow-lg z-50"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            ref={dropdownRef}
          >
            <header className="flex items-center justify-between p-[1.6rem] border-b">
              <h1 className="text-black text-[1.6rem]">Add Photo</h1>
              <button className="text-black" aria-label="Close modal"  onClick={onModalClose}>
                <img src="/assets/icons/close.svg" className="cursor-pointer" alt="Close icon"/>
              </button>
            </header>
            <hr />
            {/* <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageSelect}/>
            <div className="p-[1.6rem] space-y-3 text-[1.4rem] text-[#8A8A8E]">
              <button className="rounded-lg w-full py-3 cursor-pointer text-center" style={{ border: "1px solid #D9D9D9" }} onClick={changeImage}>
                Upload Photo
              </button>
            </div>
          </motion.div>
        </motion.div>
    </AnimatePresence> */}
    </>
  )
}