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
		step: state.currentStep,
		totalSteps: state.totalSteps,
		value: state.stepOneText,
		prompt: 'Enter text for step 1',
		placeholder: 'Placeholder for step 1',
		validateInputFct: validateNotEmptyNoWhitespace,
	});
};

const stepFunctionTwo: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state: IMyState,
) => {
	state.stepTwoText = await input.showTextInput({
		title: state.dialogTitle,
		titleSuffix: ' - Step Two',
		step: state.currentStep,
		totalSteps: state.totalSteps,
		value: state.stepTwoText,
		prompt: 'Enter text for step 2',
		placeholder: 'Placeholder for step 2',
		validateInputFct: validateNotEmptyNoWhitespace,
		onBack: (typedValue) => {
			state.stepTwoText = typedValue;
		},
	});
};

const stepFunctionThree: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state: IMyState,
) => {
	state.stepThreePick = await input.showQuickPick({
		title: state.dialogTitle,
		titleSuffix: ' - Step Three',
		step: state.currentStep,
		totalSteps: state.totalSteps,
		activeItem: state.stepThreePick,
		placeholder: 'Choose an option for step 3',
		items: [
			{ label: 'Option 1', description: 'Description 1' },
			{ label: 'Option 2', description: 'Description 2' },
			{ label: 'Option 3', description: 'Description 3' },
		],
		onBack: (pickedValue) => {
			state.stepThreePick = pickedValue;
		},
	});
};

const stepFunctionFour: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state: IMyState,
) => {
	state.stepFourText = await input.showTextInput({
		title: state.dialogTitle,
		titleSuffix: ' - Step Four',
		step: state.currentStep,
		totalSteps: state.totalSteps,
		value: state.stepFourText,
		prompt: 'Enter text for step 4',
		placeholder: 'Placeholder for step 4',
		validateInputFct: validateNotEmptyNoWhitespace,
		onBack: (typedValue) => {
			state.stepFourText = typedValue;
		},
	});
};

// Ordered list of step functions that build the chain of steps for the multi step input dialog
const steps: InputStep<IMyState>[] = [
	stepFunctionOne,
	stepFunctionTwo,
	stepFunctionThree,
	stepFunctionFour,
];

interface IMyState extends IStateBase {
	stepOneText: string;
	stepTwoText: string;
	stepThreePick: QuickPickItem;
	stepFourText: string;
}

export async function wrapper() {
	const myState: IMyState = {
		dialogTitle: 'Example Dialog Generics',
		currentStep: -1,
		totalSteps: steps.length,
		stepOneText: 'Step 1 Initial Text',
		stepTwoText: 'Step 2 Initial Text',
		stepThreePick: { label: '' },
		stepFourText: 'Step 4 Initial Text',
	};
	createMultiStepInputGeneric(myState, steps);
}
