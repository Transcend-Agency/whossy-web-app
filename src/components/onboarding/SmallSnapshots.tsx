import {ChangeEvent, FC, useRef, useState} from "react";
import { PictureData } from "@/store/onboarding/usePictureStore.ts";
import Modal from "../ui/Modal";
import { AnimatePresence } from "framer-motion";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useAuthStore } from "@/store/UserId";
import { usePhotoStore } from "@/store/PhotoStore";
import Skeleton from "../ui/Skeleton";
import toast from "react-hot-toast";

interface ImageProps {
  name: keyof PictureData;
}

const Image: FC<ImageProps> = ({ name }) => {

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const {auth} = useAuthStore();
    const {setPhotos, photos} = usePhotoStore();
    const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const storage = getStorage();
      const storageRef = ref(storage, `users/${auth?.uid}/profile_pictures/image_${file.name}`);
      setIsLoading(true);
        toast.loading("Uploading image...")
      uploadBytes(storageRef, file)
      .then(() => {
        getDownloadURL(storageRef)
          .then((url) => {
            setPhotos({[name]: url});
              toast.success("Image Upload Complete...")
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
    <figure className="relative mb-10">
      {photos[name] ? (<img className="absolute -top-[1rem] size-[2.5rem] cursor-pointer active:scale-[0.95] duration-200 ease-in-out" src="/assets/images/onboarding/menu.png" onClick={() => setOpenModal(true)} alt={``}/>)
      : 
      (<img className="absolute -top-[1rem] size-[2.5rem] cursor-pointer active:scale-[0.95] duration-200 ease-in-out" src="/assets/icons/camera-gray.png" alt={``} onClick={handleClick} />)}
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
              <button  className="w-full py-[14px] rounded-lg font-medium text-center text-[#8A8A8E]" style={{ border: "1px solid #D9D9D9" }} onClick={() => { handleClick(); setOpenModal(false); }} >  Re-upload</button>
              <button className="w-full py-[14px] rounded-lg font-medium text-[#8A8A8E] text-center" style={{ border: "1px solid #D9D9D9" }} onClick={() => {   setPhotos({[name]: null});   setOpenModal(false); }}>  Remove photo</button>
            </div>
          </Modal>
      )}
      </AnimatePresence>
      <input type="file" accept="image/jpeg, image/png, image/bmp, image/webp" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageSelect}/>
        {isLoading ? (
            <div className="rounded-lg overflow-hidden">
                <Skeleton width="8rem" height="6.4rem" />
            </div>
        ) : photos[name] ? (
            <img
                src={photos[name] as string}
                className="w-[8rem] h-[6.4rem] rounded-lg object-cover"
                alt="user photo"
            />
        ) : (
            <div className="w-[8rem] h-[6.4rem] rounded-lg bg-[#F0F0F0]" />
        )}
    </figure>
  );
};

const SmallSnapshots = () => {
  return (
    <section className="flex space-x-[0.8rem] mt-10">
      <Image name="imageTwo" />
      <Image name="imageThree" />
      <Image name="imageFour" />
      <Image name="imageFive" />
      <Image name="imageSix" />
    </section>
  );
};

export default SmallSnapshots;
