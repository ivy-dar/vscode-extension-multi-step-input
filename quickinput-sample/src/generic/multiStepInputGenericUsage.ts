import { validateNotEmptyNoWhitespace } from '../utils/validators';
import {
	IStateBase,
	InputStep,
	MultiStepInput,
	createMultiStepInputGeneric,
} from './multiStepInputGenerics';

const mySteps = [
	{
		stepName: 'Step 1',
	},
	{
		stepName: 'Step 2',
	},
];

interface IMyState extends IStateBase {
	stepOneText: string;
	stepTwoText: string;
}

const myState: IMyState = {
	dialogTitle: 'Example Dialog Generics',
	currentStep: -1,
	totalSteps: mySteps.length,
	stepOneText: mySteps[0].stepName,
	stepTwoText: mySteps[1].stepName,
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
	});
};

export async function wrapper() {
	createMultiStepInputGeneric(myState, stepFunctionOne);
}
