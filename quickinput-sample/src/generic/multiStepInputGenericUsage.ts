import { QuickPickItem } from 'vscode';
import { validateNotEmptyNoWhitespace } from '../utils/validators';
import {
	IStateBase,
	InputStep,
	MultiStepInput,
	createMultiStepInputGeneric,
} from './multiStepInputGenerics';

const stepNames: string[] = [
	'Step 1 Initial Text',
	'Step 2 Initial Text',
	'Step 3 Initial Pick',
];

interface IMyState extends IStateBase {
	stepOneText: string;
	stepTwoText: string;
	stepThreePick: QuickPickItem;
}

const myState: IMyState = {
	dialogTitle: 'Example Dialog Generics',
	currentStep: -1,
	totalSteps: stepNames.length,
	stepOneText: stepNames[0],
	stepTwoText: stepNames[1],
	stepThreePick: { label: stepNames[2] },
};

const stepFunctionOne: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state?: IMyState,
) => {
	if (state === undefined) {
		throw new Error('state must not be undefined');
	}

	console.log('Step Function One');
	console.log('State in Step Function One BEFORE mutation', state);
	state.currentStep = 1;
	console.log('State in Step Function One AFTER mutation', state);

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
	state?: IMyState,
) => {
	if (state === undefined) {
		throw new Error('state must not be undefined');
	}

	console.log('Step Function Two');
	console.log('State in Step Function Two BEFORE mutation', state);
	if (state) {
		state.currentStep = 2;
	}
	console.log('State in Step Function Two AFTER mutation', state);

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
	state?: IMyState,
) => {
	if (state === undefined) {
		throw new Error('state must not be undefined');
	}

	console.log('Step Function Three');
	console.log('State in Step Function Three BEFORE mutation', state);
	if (state) {
		state.currentStep = 3;
	}
	console.log('State in Step Function Three AFTER mutation', state);

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
		onBack: (typedValue) => {
			state.stepThreePick = typedValue;
		},
		placeholder: 'Choose an option for step 3',
	});
};

export async function wrapper() {
	createMultiStepInputGeneric(myState, stepFunctionOne);
}
