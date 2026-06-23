import React, {useEffect, useRef, useState} from 'react';
import {OnboardingProps} from "@/types/onboarding.ts";
import OnboardingPage from "@/components/onboarding/OnboardingPage.tsx";
import Skip from "@/components/onboarding/Skip.tsx";
import OnboardingBackButton from "@/components/onboarding/OnboardingBackButton.tsx";
import Button from "@/components/ui/Button.tsx";
import {useNavigate} from "react-router-dom";
import {useAuthStore} from "@/store/UserId.tsx";
import {usePhotoStore} from "@/store/PhotoStore.tsx";
import {useOnboardingStore} from "@/store/OnboardingStore.tsx";
import toast from "react-hot-toast";
import {doc, getDoc, Timestamp, updateDoc} from "firebase/firestore";
import {db} from "@/firebase";
import {User} from "@/types/user.ts";
import Modal from "../ui/Modal";
import Lottie from "lottie-react";
import Cat from "../../Cat.json";
import {captureImage, startCamera} from "@/utils/cameraUtils.ts";

export const TakeASelfie: React.FC<OnboardingProps> = ({ goBack }) => {
		const [openModal, setOpenModal] = useState(false);

		const navigate = useNavigate();
		const { auth, setAuth } = useAuthStore();
		const { reset: resetPhoto } = usePhotoStore();
		const { "onboarding-data": data, reset } = useOnboardingStore();

		const videoRef = useRef<HTMLVideoElement>(null);
		const canvasRef = useRef<HTMLCanvasElement>(null);
		const [capturedImage, setCapturedImage] = useState<string | null>(null);
		const [cameraHasStarted, setCameraHasStarted] = useState<boolean>(false);
		const [pictureHasBeenTaken, setPictureHasBeenTaken] = useState<boolean>(false);

		useEffect(() => {
				if (auth?.has_completed_onboarding) {
						navigate('/dashboard/explore');
				}
		}, [auth?.has_completed_onboarding]);

		const handleFaceVerificationSkip = () => {
				setOpenModal(true);
				uploadToFirestore()
						.catch((e) => {
								toast.error("An error occurred while onboarding")
								console.error("Error onboarding user: ", e)
						});
		}

		const uploadToFirestore = async () => {

				if (!auth?.uid) {
						console.error("User ID is undefined. Cannot update Firestore without a valid UID.");
						toast.error("An error occurred. Please try again.");
						return;
				}

				try {
						console.log(auth.uid);
						console.log(data['date-of-birth']);
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

						toast.success("Account has been created successfully 🚀");
						resetPhoto();
						reset();

						const updatedUserDoc = await getDoc(userDocRef);
						const updatedUserData = updatedUserDoc.data();

						if (updatedUserData) {
								setAuth({
										uid: auth.uid,
										has_completed_onboarding: updatedUserData.has_completed_onboarding,
								}, updatedUserData as User);

								console.log("Updated local auth state:", updatedUserData);
								navigate('/dashboard/explore');
						}

				} catch (error) {
						console.error("Failed to update Firestore document:", error);
						toast.error("Failed to set up profile. Please try again.");
				}
		};

		return (
				<OnboardingPage>
						<section className="h-[500px] overflow-hidden">
								<Skip advance={handleFaceVerificationSkip} />
								<div className={`flex flex-col gap-y-[30px] h-full`}>
										<div className={`grid gap-y-4`}>
												<h1 className={`text-[30px] font-neue-montreal font-bold`}>Take a Selfie</h1>
												<p className={`text-[12px] max-w-[280px] text-[#8A8A8E] leading-[120%]`}>
														Tap on the camera icon to take a snapshot of yourself for verification. Kindly use a well-lighted background and avoid blurry photos.
												</p>
										</div>

										<div className={`grid gap-y-6`}>
												<div className={`w-[300px] h-[225px] bg-center bg-no-repeat bg-cover rounded-[15px] bg-opacity-20 bg-[#8A8A8E] relative overflow-hidden`}>
														<video className={`size-full absolute z-30 video-flip ${capturedImage ? "hidden" : "block"}`} ref={videoRef} autoPlay></video>
														<canvas className={`size-full absolute z-20`} ref={canvasRef} style={{ display: 'none' }}></canvas>
														{capturedImage && <img className={`size-full absolute z-10 rounded-[15px] object-center`} src={capturedImage} alt="Captured" />}
														<img onClick={() => {
																startCamera(cameraHasStarted, setCapturedImage, setPictureHasBeenTaken, setCameraHasStarted, videoRef)
																		.then(() => console.log("Camera Started"))
														}} className={`size-[30px] cursor-pointer z-50 ${cameraHasStarted ? "opacity-10" : "opacity-70"} absolute top-[50%] -translate-y-[50%] left-[50%] -translate-x-[50%]`} src={`/assets/icons/black-camera.svg`} alt={``} />
														{pictureHasBeenTaken && <div onClick={() => {
															setCapturedImage(null)
															setPictureHasBeenTaken(false)
														}} className={`absolute z-[60] bg-black/80 text-white px-3 py-2 rounded-[8px] top-[10px] left-[10px] font-bold text-[10px] cursor-pointer hover:cursor-pointer`}>Clear</div> }
														{cameraHasStarted &&
														<button onClick={() => captureImage(videoRef, canvasRef, setCapturedImage, setCameraHasStarted, setPictureHasBeenTaken, auth?.uid as string)} className={`absolute z-[60] bg-black/80 text-white px-3 py-2 rounded-[8px] bottom-[10px] right-[10px] font-bold text-[10px] cursor-pointer hover:cursor-pointer ${capturedImage ? "hidden" : "block"}`}>Capture</button> }
												</div>
												<div className="onboarding-page__section-one__buttons">
														<OnboardingBackButton onClick={goBack} />
														<Button text='Get Started' onClick={() => {
																if (capturedImage) {
																		setOpenModal(true);
																		uploadToFirestore()
																				.catch((e) => {
																						toast.error("An error occurred while onboarding")
																						console.error("Error onboarding user: ", e)
																				});
																}else {
																		toast.error("No image has been captured.");
																}
														}} />
												</div>
										</div>
								</div>
						</section>
						{openModal && (
								<Modal>
									<div className="bg-white w-[47rem] pt-10 p-6 rounded-2xl text-center flex flex-col relative">
										<div className="space-y-6">
											<h1 className="text-[3.2rem] font-bold">All set and ready 🔥</h1>
											<p className="text-[1.8rem] text-[#8A8A8E]">
												We are setting up your profile and getting your match ready :)
											</p>
										</div>
										<Lottie animationData={Cat} className="h-96" />
									</div>
								</Modal>
						)}
				</OnboardingPage>
		)
}
