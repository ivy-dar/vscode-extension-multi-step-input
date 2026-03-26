import { QuickPickItem } from 'vscode';
import { validateNotEmptyNoWhitespace } from '../utils/validators';
import {
	IStateBase,
	InputStep,
	MultiStepInput,
	createMultiStepInputGeneric,
} from './multiStepInputGenerics';

const stepFunctionOne: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state: IMyState,
) => {
	state.stepOneText = await input.showTextInput({
		title: state.dialogTitle,
		titleSuffix: ' - Step One',
		step: state.currentStep, // TODO: Dynamic by input steparguments
		totalSteps: state.totalSteps,
		value: state.stepOneText,
		prompt: 'Enter text for step 1',
		validateInputFct: validateNotEmptyNoWhitespace,
	});

	return (input) => stepFunctionTwo(input, state);
};

const stepFunctionTwo: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state: IMyState,
) => {
	state.stepTwoText = await input.showTextInput({
		title: state.dialogTitle,
		titleSuffix: ' - Step Two',
		step: state.currentStep, // TODO: Dynamic by input steparguments
		totalSteps: state.totalSteps,
		value: state.stepTwoText,
		prompt: 'Enter text for step 2',
		validateInputFct: validateNotEmptyNoWhitespace,
		onBack: (typedValue) => {
			state.stepTwoText = typedValue;
		},
	});

	return (input) => stepFunctionThree(input, state);
};

const stepFunctionThree: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state: IMyState,
) => {
	console.log('State START step three', state);

	state.stepThreePick = await input.showQuickPick({
		title: state.dialogTitle,
		titleSuffix: ' - Step Three',
		step: state.currentStep, // TODO: Dynamic by input steparguments
		totalSteps: state.totalSteps,
		activeItem: state.stepThreePick,
		items: [
			{ label: 'Option 1', description: 'Description 1' },
			{ label: 'Option 2', description: 'Description 2' },
			{ label: 'Option 3', description: 'Description 3' },
		],
		onBack: (pickedValue) => {
			state.stepThreePick = pickedValue;
		},
		placeholder: 'Choose an option for step 3',
	});

	console.log('State AFTER step three', state);

	return (input) => stepFunctionFour(input, state);
};

const stepFunctionFour: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state: IMyState,
) => {
	state.stepFourText = await input.showTextInput({
		title: state.dialogTitle,
		titleSuffix: ' - Step Four',
		step: state.currentStep, // TODO: Dynamic by input steparguments
		totalSteps: state.totalSteps,
		value: state.stepFourText,
		prompt: 'Enter text for step 4',
		validateInputFct: validateNotEmptyNoWhitespace,
		onBack: (typedValue) => {
			state.stepFourText = typedValue;
		},
	});
};

// Ordered list of steps
const steps: [string, InputStep<IMyState>][] = [
	['Step 1 Initial Text', stepFunctionOne],
	['Step 2 Initial Text', stepFunctionTwo],
	['Step 3 Initial Pick', stepFunctionThree],
	['Step 4 Initial Text', stepFunctionFour],
];

interface IMyState extends IStateBase {
	stepOneText: string;
	stepTwoText: string;
	stepThreePick: QuickPickItem;
	stepFourText: string;
}

const myState: IMyState = {
	dialogTitle: 'Example Dialog Generics',
	currentStep: -1,
	totalSteps: steps.length,
	stepOneText: steps[0][0],
	stepTwoText: steps[1][0],
	stepThreePick: { label: steps[2][0] },
	stepFourText: steps[3][0],
};

export async function wrapper() {
	createMultiStepInputGeneric(myState, steps[0][1]);
}
