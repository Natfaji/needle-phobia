"use client";

import { useEffect, useRef, useState } from "react";
import {
	createBlowDetection,
	type BlowDetectionOptions,
	type BlowDetectionController,
} from "@/lib/blowDetection";

type BlowDetectionHookOptions = Omit<BlowDetectionOptions, "onLevel">;

export function useBlowDetection(
	onLevel?: (percentage: number) => void,
	options: BlowDetectionHookOptions = {},
) {
	const controllerRef = useRef<BlowDetectionController | null>(null);
	const [isActive, setIsActive] = useState(false);
	const [percentage, setPercentage] = useState(0);
	const [error, setError] = useState<Error | null>(null);

	const start = async () => {
		setError(null);

		const controller = createBlowDetection({
			...options,
			onLevel: (level) => {
				setPercentage(level);
				onLevel?.(level);
			},
		});
		controllerRef.current = controller;

		try {
			await controller.start();
			setIsActive(true);
		} catch (startError) {
			controller.stop();
			controllerRef.current = null;
			setError(
				startError instanceof Error
					? startError
					: new Error("Unable to access the microphone."),
			);
		}
	};

	const stop = () => {
		controllerRef.current?.stop();
		controllerRef.current = null;
		setIsActive(false);
		setPercentage(0);
	};

	useEffect(() => stop, []);

	return { error, isActive, percentage, start, stop };
}
