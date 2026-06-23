import {StepType} from "@reactour/tour";

export type CompletedTours = {
		[key: string]: boolean;
}

export type Tour = {
		[key: string]: StepType[];
}