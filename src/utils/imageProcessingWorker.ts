// imageProcessingWorker.ts
self.onmessage = (event) => {
		const imageData = event.data.imageData;
		const width = event.data.width;
		const height = event.data.height;

		function calculateBrightness(imageData: Uint8ClampedArray, width: number, height: number) {
				let totalBrightness = 0;
				for (let i = 0; i < imageData.length; i += 4) {
						const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
						totalBrightness += avg;
				}
				const avgBrightness = totalBrightness / (width * height);
				return avgBrightness >= 50 && avgBrightness <= 200;
		}

		function calculateBlurriness(imageData: Uint8ClampedArray, width: number, height: number) {
				const laplacian = new Uint8ClampedArray(width * height);
				for (let i = 0; i < imageData.length; i += 4) {
						laplacian[i / 4] = 0.2989 * imageData[i] + 0.5870 * imageData[i + 1] + 0.1140 * imageData[i + 2];
				}
				let variance = 0;
				const mean = laplacian.reduce((a, b) => a + b) / laplacian.length;
				for (let i = 0; i < laplacian.length; i++) {
						variance += Math.pow(laplacian[i] - mean, 2);
				}
				variance /= laplacian.length;
				return variance > 100; // Adjust threshold if needed
		}

		const brightnessOK = calculateBrightness(imageData, width, height);
		const blurOK = calculateBlurriness(imageData, width, height);

		self.postMessage({ brightness: brightnessOK, blur: blurOK });
};
