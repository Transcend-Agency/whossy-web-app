import {ChangeEvent, useRef, useState} from "react";
import Modal from "../ui/Modal";
import { AnimatePresence } from "framer-motion";
import { usePhotoStore } from "@/store/PhotoStore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useAuthStore } from "@/store/UserId";
import Skeleton from "../ui/Skeleton";
import toast from "react-hot-toast";

const BigSnapshots = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const {setPhotos, photos} = usePhotoStore();
  const {auth} = useAuthStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = event.target.files?.[0];

    if (file) {
      toast.loading("Uploading image...")
      const storage = getStorage();
      const storageRef = ref(storage, `users/${auth?.uid}/profile_pictures/image_${file.name}`);
      setIsLoading(true);
      toast.success("Your image is being uploaded");
      uploadBytes(storageRef, file)
      .then(() => {
        getDownloadURL(storageRef)
          .then((url) => {
            setPhotos({imageOne: url});
            toast.success("Image Upload Complete")
          })
          .catch((error) => console.log(error));
      }).then(() => { setIsLoading(false); })
      .catch((err) => console.log(err));
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <figure className="relative h-[35rem] mt-20">
      {photos.imageOne && (
        <img className="absolute -top-[2rem] size-[5rem] z-[50] cursor-pointer active:scale-[0.90] duration-200 ease-in-out" src="/assets/images/onboarding/menu.png" alt="show more" onClick={() => setOpenModal(true)}/>
      )}
      <AnimatePresence>
        {openModal && (
          <Modal onClose={() => setOpenModal(false)}>
            <div className="bg-white w-[45rem] text-[1.8rem] p-6 space-y-8 rounded-2xl">
              <header className="flex  items-center space-x-6">
                <img
                  className="py-[8px] px-[12px] rounded-md cursor-pointer bg-[#F6F6F6] active:scale-[0.90] duration-200 ease-in-out hover:scale-[1.1]"
                  src="/assets/icons/left-arrow-black.svg"
                  alt="Go back"
                  onClick={() => setOpenModal(false)}
                />
                <h1 className=" font-medium">Edit Photo</h1>
              </header>
              <button
                className="w-full py-[14px] rounded-lg text-center font-medium cursor-pointer text-[#8A8A8E]"
                style={{ border: "1px solid #D9D9D9" }}
                onClick={() => {
                  handleClick();
                  setOpenModal(false);
                }}
              >
                Re-upload
              </button>
              <button
                className="w-full py-[14px] rounded-lg text-center font-medium cursor-pointer text-[#8A8A8E]"
                style={{ border: "1px solid #D9D9D9" }}
                onClick={() => {
                  setPhotos({imageOne: null});
                  setOpenModal(false);
                }}
              >
                Remove photo
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      {!photos.imageOne && (
        <img className="absolute -top-[2rem] size-[5rem] z-[99] cursor-pointer active:scale-[0.90] ease-in-out duration-200" src="/assets/icons/camera.png" alt="add pictures" onClick={handleClick} />
      )}
      <input  type="file"  accept="image/jpeg, image/png, image/bmp, image/webp"   ref={fileInputRef} style={{ display: "none" }} onChange={handleImageSelect}/>
      {photos.imageOne && (
        <img src={photos.imageOne} style={{ position: "absolute", top: 0, left: 0, width: `30rem`, height: `33.5rem`, zIndex: 40, borderRadius: "22px", objectFit: "cover",}} alt="user image"/>
      )}
      <div style={{ position: "absolute", width: `30rem`, height: `33.5rem`, zIndex: `30`, borderRadius: "22px", backgroundColor: `#E2E2E2` }} />

      {isLoading && <div style={{ position: "absolute", top: `0rem`, left: `0rem`, width: `30rem`, height: `33.5rem`, zIndex: `70`, borderRadius: "22px", backgroundColor: '', transform: `rotate(${0}deg)`, overflow: 'hidden'}}>
            <Skeleton width="30rem" height="33.5rem" />
      </div>}

    </figure>
  );
};

export default BigSnapshots;
