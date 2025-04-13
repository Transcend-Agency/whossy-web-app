import toast from "react-hot-toast";
import upload from "@/hooks/upload.ts";
import React from "react";

export const startCamera = async (
		cameraHasStarted: boolean,
		setCapturedImage: (value: string | null) => void,
		setPictureHasBeenTaken: (value: boolean) => void,
		setCameraHasStarted: (value: boolean) => void,
		videoRef: React.RefObject<HTMLVideoElement>
) => {
		if (cameraHasStarted) {
				await stopCamera(videoRef, setCameraHasStarted);
		}

		toast.success("Camera Loading...");
		setCapturedImage(null);
		setPictureHasBeenTaken(false);
		setCameraHasStarted(true);

		try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true });
				if (videoRef.current) {
						videoRef.current.srcObject = stream;
				}
		} catch (err: any) {
				console.error("Error accessing camera:", err);
				// Check for a permission error (e.g., NotAllowedError)
				if (err.name === "NotAllowedError") {
						toast.error("Camera access is disabled. Please enable it in your browser settings.");
				} else {
						toast.error("There was an error accessing your camera.");
				}
				setCameraHasStarted(false);
				setPictureHasBeenTaken(false);
		}
};

export const stopCamera = async (
		videoRef: React.RefObject<HTMLVideoElement>,
		setCameraHasStarted: (value: boolean) => void
) => {
		if (videoRef.current) {
				const stream = videoRef.current.srcObject as MediaStream;
				if (stream) {
						stream.getTracks().forEach((track) => track.stop());
				}
				videoRef.current.srcObject = null;
		}

		setCameraHasStarted(false);
};

export const captureImage = async (
		videoRef: React.RefObject<HTMLVideoElement>,
		canvasRef: React.RefObject<HTMLCanvasElement>,
		setCapturedImage: (value: string | null) => void,
		setCameraHasStarted: (value: boolean) => void,
		setPictureHasBeenTaken: (value: boolean) => void,
		userId: string
) => {
		if (!videoRef.current || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context) return;

		toast.success("Processing Image...", { duration: 3000 });

		const video = videoRef.current;
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		context.save();
		context.translate(canvas.width, 0);
		context.scale(-1, 1);
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		context.restore();

		const imageData = canvas.toDataURL("image/png");
		const blob = await fetch(imageData).then((res) => res.blob());
		const file = new File([blob], "captured-image.png", { type: "image/png" });

		const imageUrl = await upload(file, `users/${userId}/face_verification`);
		setCapturedImage(imageUrl);

		await stopCamera(videoRef, setCameraHasStarted);
		setCameraHasStarted(false);

		const img = new Image();
		img.src = imageData;
		img.onload = async () => {
				const validation = await validateImageClarity(img);
				if (!validation.brightness) {
						toast.error("The image is too dark or too bright. Please try again.", {
								duration: 5000,
						});
						resetImageState(setCapturedImage, setCameraHasStarted, setPictureHasBeenTaken);
				} else if (!validation.blur) {
						toast.error("The image is too blurry. Please try again.", { duration: 5000 });
						resetImageState(setCapturedImage, setCameraHasStarted, setPictureHasBeenTaken);
				} else {
						setPictureHasBeenTaken(true);
						toast.success("Image captured successfully! Looks great.", { duration: 5000 });
				}
		};
};

const resetImageState = (
		setCapturedImage: (value: string | null) => void,
		setCameraHasStarted: (value: boolean) => void,
		setPictureHasBeenTaken: (value: boolean) => void
) => {
		setCapturedImage(null);
		setCameraHasStarted(false);
		setPictureHasBeenTaken(false);
};

export const validateImageClarity = async (
		image: HTMLImageElement
): Promise<{ brightness: boolean; blur: boolean }> => {
		return new Promise((resolve) => {
				const worker = new Worker(new URL("@/utils/imageProcessingWorker.ts", import.meta.url));

				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				if (!context) return resolve({ brightness: false, blur: false });

				canvas.width = image.width;
				canvas.height = image.height;
				context.drawImage(image, 0, 0, canvas.width, canvas.height);

				const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
				worker.postMessage({ imageData, width: canvas.width, height: canvas.height });

				worker.onmessage = (event) => {
						worker.terminate();
						resolve(event.data);
				};

				worker.onerror = (error) => {
						console.error("Worker error:", error);
						worker.terminate();
						resolve({ brightness: false, blur: false });
				};
		});
};
