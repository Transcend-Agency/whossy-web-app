import {FC, useRef, useState} from 'react'
import {AnimatePresence, motion} from "framer-motion";
import {captureImage, startCamera} from "@/utils/cameraUtils.ts";
import toast from "react-hot-toast";
import {doc, Timestamp, updateDoc} from "firebase/firestore";
import {db} from "@/firebase";
import {useAuthStore} from "@/store/UserId.tsx";

interface FaceVerificationModalProps {
		show: boolean
		onCloseModal: () => void
		refetchUserData: () => void
}

const modalVariants = {
		hidden: { opacity: 0, },
		visible: { opacity: 1, },
		exit: { opacity: 0, }
};

export const FaceVerificationModal: FC<FaceVerificationModalProps> = ({show, onCloseModal, refetchUserData}) => {
		const videoRef = useRef<HTMLVideoElement>(null);
		const canvasRef = useRef<HTMLCanvasElement>(null);
		const [capturedImage, setCapturedImage] = useState<string | null>(null);
		const [cameraHasStarted, setCameraHasStarted] = useState<boolean>(false);
		const [pictureHasBeenTaken, setPictureHasBeenTaken] = useState<boolean>(false);
		const { auth } = useAuthStore();

		const updateFaceVerification = async () => {
				if (!auth?.uid) {
						console.error("User ID is undefined. Cannot update Firestore without a valid UID.");
						toast.error("An error occurred. Please try again.");
						return;
				}

				try {
						console.log(auth.uid);
						const userDocRef = doc(db, "users", auth.uid);
						if(capturedImage){
								await updateDoc(userDocRef, {
										face_verification:{
												retake_photo: false,
												photo: capturedImage,
												updated_at: Timestamp.now()
										}
								});
						}

						toast.success("Image has been uploaded successfully 🚀");

						setCameraHasStarted(false)
						setPictureHasBeenTaken(false)
						setCapturedImage(null)

						refetchUserData()
						onCloseModal()
				} catch (error) {
						console.error("Failed to update Firestore document:", error);
						toast.error("Failed to capture face. Please try again.");
				}
		}

		return (
				<AnimatePresence mode='wait'>
						{show &&
				<motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} transition={{ duration: 0.3 }} className="fixed inset-0 flex justify-center items-center z-50 bg-[#b9b9b9] bg-opacity-50 w-full h-screen">
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white text opacity-100 z-[9999] py-[2rem] px-[4rem] space-y-[3rem] rounded-[2rem]">
							<div>
									<h1 className='text-3xl font-bold flex justify-center mb-[2rem]'>Take A Selfie</h1>
									<div className={`w-[300px] h-[225px] bg-center bg-no-repeat bg-cover rounded-[15px] bg-opacity-20 bg-[#8A8A8E] relative overflow-hidden mb-8`}>
											<video className={`size-full absolute z-30 video-flip ${capturedImage ? "hidden" : "block"}`} ref={videoRef} autoPlay></video>
											<canvas className={`size-full absolute z-20`} ref={canvasRef} style={{display: 'none'}}></canvas>
											{capturedImage && <img className={`size-full absolute z-10 rounded-[15px] object-center`} src={capturedImage} alt="Captured"/>}

											<img onClick={() => {
													startCamera(cameraHasStarted, setCapturedImage, setPictureHasBeenTaken, setCameraHasStarted, videoRef)
															.then(() => console.log("Camera Started"))
											}} className={`size-[30px] cursor-pointer z-50 ${cameraHasStarted ? "opacity-10" : "opacity-70"} absolute top-[50%] -translate-y-[50%] left-[50%] -translate-x-[50%]`} src={`/assets/icons/black-camera.svg`} alt={``}/>

											{pictureHasBeenTaken && <div onClick={() => {
													setCapturedImage(null)
													setPictureHasBeenTaken(false)
											}} className={`absolute z-[60] bg-black/80 text-white px-3 py-2 rounded-[8px] top-[10px] left-[10px] font-bold text-[10px] cursor-pointer hover:cursor-pointer`}>Clear</div>}

											{cameraHasStarted &&
													<button onClick={() => captureImage(videoRef, canvasRef, setCapturedImage, setCameraHasStarted, setPictureHasBeenTaken, auth?.uid as string)} className={`absolute z-[60] bg-black/80 text-white px-3 py-2 rounded-[8px] bottom-[10px] right-[10px] font-bold text-[10px] cursor-pointer hover:cursor-pointer ${capturedImage ? "hidden" : "block"}`}>Capture</button>}

									</div>
									<div className={`flex gap-x-4`}>
										<button
											className="bg-[#F6F6F6] py-[1.3rem] w-full text-[1.8rem] font-bold text-center rounded-lg hover:text-white hover:bg-[#F2243E] transition-all duration-300 cursor-pointer"
											onClick={onCloseModal}>Close
										</button>
										<button
											className={`bg-gradient-to-br from-orange-400 hover:opacity-70  to-red text-white py-[1.3rem] w-full text-[1.8rem] font-bold text-center rounded-lg hover:text-white hover:bg-[#F2243E] transition-all duration-300 cursor-pointer whitespace-nowrap inline-block`}
											onClick={() => {
													if(capturedImage) {
															updateFaceVerification()
																	.catch((e) => {
																			toast.error("An error occurred.")
																			console.error("Error while taking picture: ",e)
																	})
													}else {
															toast.error("No image has been captured.")
													}
											}}>
											Submit
										</button>
									</div>
							</div>
					</motion.div>
				</motion.div>}
				</AnimatePresence>
		)
}