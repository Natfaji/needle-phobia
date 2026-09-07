export type BlowDetectionOptions = {
	fftSize?: number;
	smoothingTimeConstant?: number;
	power?: number;
	sampleIntervalMs?: number;
	onLevel?: (percentage: number) => void;
};

export type BlowDetectionController = {
	start: () => Promise<void>;
	stop: () => void;
};

export function createBlowDetection(
	options: BlowDetectionOptions = {},
): BlowDetectionController {
	const {
		fftSize = 2048,
		smoothingTimeConstant = 0.1,
		power = 500,
		sampleIntervalMs = 0,
		onLevel,
	} = options;

	let stream: MediaStream | undefined;
	let audioContext: AudioContext | undefined;
	let animationFrameId: number | undefined;

	const stop = () => {
		if (animationFrameId !== undefined) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = undefined;
		}

		stream?.getTracks().forEach((track) => track.stop());
		stream = undefined;

		if (audioContext && audioContext.state !== "closed") {
			void audioContext.close();
		}
		audioContext = undefined;
	};

	const start = async () => {
		stop();

		stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		audioContext = new AudioContext();
		const analyser = audioContext.createAnalyser();

		analyser.fftSize = fftSize;
		analyser.smoothingTimeConstant = smoothingTimeConstant;

		const source = audioContext.createMediaStreamSource(stream);
		source.connect(analyser);

		const data = new Uint8Array(analyser.fftSize);
		let lastSampleTime = -Infinity;
		let sampleSum = 0;
		let sampleCount = 0;

		const update = (timestamp: number) => {
			analyser.getByteTimeDomainData(data);

			let sum = 0;
			for (const sample of data) {
				const value = (sample - 128) / 128;
				sum += value * value;
			}

			const rms = Math.sqrt(sum / data.length);
			sampleSum += rms;
			sampleCount += 1;

			if (timestamp - lastSampleTime >= sampleIntervalMs) {
				const averageRms = sampleSum / sampleCount;
				onLevel?.(Math.min(100, Math.round(averageRms * power)));
				lastSampleTime = timestamp;
				sampleSum = 0;
				sampleCount = 0;
			}
			animationFrameId = requestAnimationFrame(update);
		};

		animationFrameId = requestAnimationFrame(update);
	};

	return { start, stop };
}
