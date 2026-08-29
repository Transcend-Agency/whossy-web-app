import {FC, useEffect, useRef, useState} from "react";
import {getUserProfile, updateUserProfile} from "@/hooks/useUser";
import {useAuthStore} from "@/store/UserId";
import {PhotoModal, UploadPhotoModal} from "./PhotoModal";
import toast from "react-hot-toast";
import {getDownloadURL, getStorage, ref, uploadBytes} from "firebase/storage";
import {Oval} from "react-loader-spinner";
import {User} from "@/types/user";
import {doc, getDoc, setDoc} from "firebase/firestore";
import {db} from "@/firebase";
import {deriveVerificationStatus} from "@/utils/verification";
import Modal from "@/components/ui/Modal";
interface CardProps {
  photo?: string;
  colspan?: string;
  rowspan?: string;
  height?: string;
}

const Card: FC<CardProps & { onDelete?: () => void; index?: number; onPress?: () => void }> = ({
  photo,
  rowspan = "",
  colspan = "",
  height = "",
  onPress,
}) => {

  return (
    <>
      <div className={`relative group w-full ${colspan} ${rowspan} xs:h-[128px] ${height} cursor-pointer hover:scale-[0.98] transition ease-in-out duration-200`}
        onClick={onPress}
      >
        {photo ? (
          <>
            <img className={`object-cover xs:h-[128px] ${height} w-full rounded-2xl`} src={photo} alt="Profile photo" />
            {/* Always-visible edit affordance — hover-only overlays are
                invisible on touch devices, so the badge never hides. */}
            <div className="absolute bottom-[0.8rem] right-[0.8rem] size-[2.8rem] rounded-full bg-black/50 border border-white/60 flex items-center justify-center group-hover:bg-black/75 transition-colors duration-200">
              <img className="size-[1.5rem] invert brightness-0" src="/assets/icons/black-camera.svg" alt="" />
            </div>
          </>
        ) : (
          <div className={`bg-white w-full xs:h-[128px] ${height} rounded-2xl flex items-center justify-center`}>
            <img className="size-[2.4rem] opacity-70" src="/assets/icons/add-image.svg" alt="Add photo" />
          </div>
        )}
      </div>
    </>
  );
};

type PhotoModal = "hidden" | "photo-one" | "photo-two" | "photo-three" | "photo-four" | "photo-five" | "photo-six" | "photo-one-first-upload" | 'photo-two-first-upload' | 'photo-three-first-upload' | 'photo-four-first-upload' | 'photo-five-first-upload' | "photo-six-first-upload";

const Photos: FC<{ refetchUserData: () => void }> = ({ refetchUserData }) => {
  const [photo, setPhoto] = useState<string[]>([]);
  const [mutatedPhoto, setMutatedPhoto] = useState<string[]>([]);
  // Keyed by the data-URI value itself (what actually sits in `mutatedPhoto`
  // for a not-yet-uploaded file), not by array index — an index shifts under
  // deletion/reorder, which previously left `finalizePhotos` looking up the
  // wrong (or no) file for a slot and silently saving the raw base64 string
  // instead of an uploaded URL.
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  // Set while a "Re-upload" is in flight: the next file picked replaces this
  // slot in place instead of being appended as a new one.
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [faceVerification, setFaceVerification] = useState<User["face_verification"]>();
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const { auth } = useAuthStore();

  const [isUpdating, setIsUpdating] = useState(false)

  const fetchUserPhotos = async () => {
    const data = await getUserProfile("users", auth?.uid as string) as User;
    setPhoto(data?.photos as string[] || [])
    setFaceVerification(data?.face_verification)
  }

  // The main photo is what a reviewer approved against — changing it (a new
  // upload in slot 1, or moving an existing photo into slot 1) invalidates
  // that approval. Adding/removing/reordering any other slot doesn't.
  const isMainPhotoChange = (newPhotos: string[]) => newPhotos[0] !== photo[0];
  const isCurrentlyVerified = deriveVerificationStatus(faceVerification) === 'approved';

  const updateUserPhotos = async (s: string[]) => {
    if (!auth?.uid) {
      console.error("User is not authenticated");
      return;
    }

    const userId = auth.uid;
    const deletePicRef = doc(db, `deletePicQueue/${userId}`);
    const revokesVerification = isMainPhotoChange(s) && isCurrentlyVerified;

    try {
      await updateUserProfile("users", userId, async () => {
        await fetchUserPhotos().catch(e => console.error(e));
        refetchUserData();
        setIsUpdating(false);
      }, {
        photos: s,
        ...(revokesVerification ? {
          is_approved: false,
          face_verification: { ...faceVerification, status: 'revoked' },
        } : {}),
      });

      const existingDeleteRequest = await getDoc(deletePicRef);
      if (!existingDeleteRequest.exists()) {
        await setDoc(deletePicRef, { uid: userId });
      } else {
        console.log("Deletion request already exists, skipping duplicate request.");
      }

    } catch (error) {
      // Previously left `isUpdating` stuck true forever on any failure (e.g.
      // Firestore rejecting an oversized payload) — the spinner would never
      // stop and the user got no indication anything had gone wrong.
      console.error("Error updating photos or queuing deletion:", error);
      setIsUpdating(false);
      toast.error("Couldn't save your photos — please try again.");
    }
  };

  const requestSave = () => {
    if (mutatedPhoto.length < 2) {
      toast.error("A minumum of 2 images is required");
      return;
    }
    if (isMainPhotoChange(mutatedPhoto) && isCurrentlyVerified) {
      setShowRevokeConfirm(true);
      return;
    }
    finalizePhotos();
  };

  useEffect(() => { fetchUserPhotos().catch(err => console.log("Error occurred while fetching photos: ", err)) }, [])
  useEffect(() => { setPhoto(photo); setMutatedPhoto(photo) }, [photo])

  const [photoModalShowing, setPhotoModalShowing] = useState<PhotoModal>('hidden')

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const storage = getStorage();
      // Per-user folder — this used to interpolate the whole auth object
      // (`${auth}` → the literal string "[object Object]"), so every user's
      // uploads collided in one shared, un-scoped folder.
      const storageRef = ref(storage, `users/${auth?.uid}/profile_pictures/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading file: ", error);
      throw error;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset now so picking the same file again still fires a change event.
    event.target.value = '';
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setMutatedPhoto((prev) =>
          replacingIndex !== null && replacingIndex < prev.length
            ? prev.map((p, i) => (i === replacingIndex ? dataUri : p))
            : [...prev, dataUri]
        );
        setFileMap((prev) => new Map(prev).set(dataUri, file));
        setReplacingIndex(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Opens the picker to replace an existing slot's photo in place — used by
  // "Re-upload" so the old photo stays put until a new one is actually
  // chosen, instead of being deleted immediately and the replacement then
  // landing at the end of the list as a new slot.
  const startReplacePhoto = (index: number) => {
    setReplacingIndex(index);
    setPhotoModalShowing('hidden');
    handleButtonClick();
  };

  // Opens the picker to add a new photo into a currently-empty slot — clears
  // any stale replace-intent (e.g. a previous "Re-upload" whose file picker
  // was cancelled) so this add can't be mistaken for that replacement.
  const startAddPhoto = () => {
    setReplacingIndex(null);
    setPhotoModalShowing('hidden');
    handleButtonClick();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const finalizePhotos = async () => {
    setIsUpdating(true)
    try {
      const newMutatedPhotos = await Promise.all(
        mutatedPhoto.map(async (photo) => {
          if (!photo.startsWith("https://")) {
            const file = fileMap.get(photo);
            if (file) {
              return await uploadImage(file);
            }
          }
          return photo;
        })
      );
      await updateUserPhotos(newMutatedPhotos);
    } catch (error) {
      // Covers an upload failure specifically — updateUserPhotos handles its
      // own failure (and its own spinner reset) internally.
      console.error("Error uploading photos:", error);
      toast.error("Couldn't upload your photos — please try again.");
      setIsUpdating(false);
    }
  };

  return (
    <>
    <PhotoModal showing={photoModalShowing === 'photo-one'} onModalClose={() => setPhotoModalShowing('hidden')} deleteImage={() => { const updatedPhotos = mutatedPhoto.filter(item => item !== mutatedPhoto[0]); setMutatedPhoto(updatedPhotos); setPhotoModalShowing('hidden')}} changeImage={() => startReplacePhoto(0)}/>
    <PhotoModal showing={photoModalShowing === 'photo-two'} onModalClose={() => setPhotoModalShowing('hidden')} deleteImage={() => { const updatedPhotos = mutatedPhoto.filter(item => item !== mutatedPhoto[1]); setMutatedPhoto(updatedPhotos); setPhotoModalShowing('hidden')}} changeImage={() => startReplacePhoto(1)}/>
    <PhotoModal showing={photoModalShowing === 'photo-three'} onModalClose={() => setPhotoModalShowing('hidden')} deleteImage={() => { const updatedPhotos = mutatedPhoto.filter(item => item !== mutatedPhoto[2]); setMutatedPhoto(updatedPhotos); setPhotoModalShowing('hidden')}} changeImage={() => startReplacePhoto(2)}/>
    <PhotoModal showing={photoModalShowing === 'photo-four'} onModalClose={() => setPhotoModalShowing('hidden')} deleteImage={() => { const updatedPhotos = mutatedPhoto.filter(item => item !== mutatedPhoto[3]); setMutatedPhoto(updatedPhotos); setPhotoModalShowing('hidden')}} changeImage={() => startReplacePhoto(3)}/>
    <PhotoModal showing={photoModalShowing === 'photo-five'} onModalClose={() => setPhotoModalShowing('hidden')} deleteImage={() => { const updatedPhotos = mutatedPhoto.filter(item => item !== mutatedPhoto[4]); setMutatedPhoto(updatedPhotos); setPhotoModalShowing('hidden')}} changeImage={() => startReplacePhoto(4)}/>
    <PhotoModal showing={photoModalShowing === 'photo-six'} onModalClose={() => setPhotoModalShowing('hidden')} deleteImage={() => { const updatedPhotos = mutatedPhoto.filter(item => item !== mutatedPhoto[5]); setMutatedPhoto(updatedPhotos); setPhotoModalShowing('hidden')}} changeImage={() => startReplacePhoto(5)}/>
    <UploadPhotoModal showing={photoModalShowing === 'photo-one-first-upload'} onModalClose={() => setPhotoModalShowing('hidden')} changeImage={startAddPhoto}/>
    <UploadPhotoModal showing={photoModalShowing === 'photo-two-first-upload'} onModalClose={() => setPhotoModalShowing('hidden')} changeImage={startAddPhoto}/>
    <UploadPhotoModal showing={photoModalShowing === 'photo-three-first-upload'} onModalClose={() => setPhotoModalShowing('hidden')} changeImage={startAddPhoto}/>
    <UploadPhotoModal showing={photoModalShowing === 'photo-four-first-upload'} onModalClose={() => setPhotoModalShowing('hidden')} changeImage={startAddPhoto}/>
    <UploadPhotoModal showing={photoModalShowing === 'photo-five-first-upload'} onModalClose={() => setPhotoModalShowing('hidden')} changeImage={startAddPhoto}/>
    <UploadPhotoModal showing={photoModalShowing === 'photo-six-first-upload'} onModalClose={() => setPhotoModalShowing('hidden')} changeImage={startAddPhoto}/>


      <section className="bg-[#F6F6F6] py-[1.2rem] px-[1.6rem] flex flex-col">
        <div className="grid grid-cols-6 grid-rows-2 gap-4">
          <input ref={fileInputRef} accept="image/jpeg, image/png, image/bmp, image/webp" type="file" className="hidden" onChange={handleImageUpload} />
          <Card photo={mutatedPhoto[0] || ''} index={1} colspan="col-span-3 xs:col-span-2 " rowspan="row-span-2 xs:row-span-1" height="h-[184px]" onPress={() => { if (mutatedPhoto[0]) { setPhotoModalShowing('photo-one') } else { setPhotoModalShowing('photo-one-first-upload') } }} onDelete={() => { const updatedPhotos = photo.filter(item => item !== photo[0]); updateUserPhotos(updatedPhotos); }} />
          <Card photo={mutatedPhoto[1]} index={2} colspan="col-span-3 xs:col-span-2 " onPress={() => { if (mutatedPhoto[1]) { setPhotoModalShowing('photo-two') } else { setPhotoModalShowing('photo-two-first-upload') } }} height="h-[88px]" onDelete={() => { const updatedPhotos = photo.filter(item => item !== photo[1]); updateUserPhotos(updatedPhotos); }} />
          <Card photo={mutatedPhoto[2]} index={3} colspan="col-span-3 xs:col-span-2 " onPress={() => { if (mutatedPhoto[2]) { setPhotoModalShowing('photo-three') } else { setPhotoModalShowing('photo-three-first-upload') } }} height="h-[88px]" onDelete={() => { const updatedPhotos = photo.filter(item => item !== photo[2]); updateUserPhotos(updatedPhotos); }} />
          <Card photo={mutatedPhoto[3]} index={4} colspan="col-span-2" height="h-[88px]" onPress={() => { if (mutatedPhoto[3]) { setPhotoModalShowing('photo-four') } else { setPhotoModalShowing('photo-four-first-upload') } }} onDelete={() => { const updatedPhotos = photo.filter(item => item !== photo[3]); updateUserPhotos(updatedPhotos); }} />
          <Card photo={mutatedPhoto[4]} index={5} colspan="col-span-2" height="h-[88px]" onPress={() => { if (mutatedPhoto[4]) { setPhotoModalShowing('photo-five') } else { setPhotoModalShowing('photo-five-first-upload') } }} onDelete={() => { const updatedPhotos = photo.filter(item => item !== photo[4]); updateUserPhotos(updatedPhotos); }} />
          <Card photo={mutatedPhoto[5]} index={6} colspan="col-span-2" height="h-[88px]" onPress={() => { if (mutatedPhoto[5]) { setPhotoModalShowing('photo-six') } else { setPhotoModalShowing('photo-six-first-upload') } }} />
        </div>
        {JSON.stringify(mutatedPhoto) !== JSON.stringify(photo) && <button className="text-center modal__body__header__save-button mt-4 flex justify-center" onClick={requestSave}>{!isUpdating ? 'Save' : <Oval color="#485FE6" secondaryColor="#485FE6" width={20} height={20} />}</button>}
      </section>
      {showRevokeConfirm && (
        <Modal>
          <div className="bg-white w-[47rem] p-8 rounded-2xl text-center flex flex-col relative gap-y-6">
            <h1 className="text-[2.4rem] font-bold">Change your main photo?</h1>
            <p className="text-[1.6rem] text-[#8A8A8E] leading-[130%]">
              Your verified badge was approved against your current main photo. Changing it
              will <span className="font-bold text-[#121212]">remove your verified badge</span> and
              stop liking and messaging until a reviewer approves your profile again.
            </p>
            <div className="flex gap-x-4">
              <button
                className="bg-[#F6F6F6] py-[1.3rem] w-full text-[1.6rem] font-bold text-center rounded-lg hover:bg-[#ececec] transition-all duration-300 cursor-pointer"
                onClick={() => setShowRevokeConfirm(false)}>
                Cancel
              </button>
              <button
                className="bg-gradient-to-br from-orange-400 to-red text-white py-[1.3rem] w-full text-[1.6rem] font-bold text-center rounded-lg hover:opacity-80 transition-all duration-300 cursor-pointer"
                onClick={() => { setShowRevokeConfirm(false); finalizePhotos(); }}>
                Change photo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Photos;
