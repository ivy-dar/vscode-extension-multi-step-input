import {
	IStateBase,
	InputStep,
	MultiStepInput,
	createMultiStepInputGeneric,
} from './multiStepInputGenerics';

const stepFunctionOne: InputStep<IMyState> = async (
	input: MultiStepInput<IMyState>,
	state?: IMyState,
) => {
	console.log('Step Function One');
	console.log('State in Step Function One BEFORE mutation', state);
	if (state) {
		state.currentStep = 1;
	}
	console.log('State in Step Function One AFTER mutation', state);
	return stepFunctionTwo(input, state);
};
const stepFunctionTwo: InputStep<IMyState> = async (
	_input: MultiStepInput<IMyState>,
	state?: IMyState,
) => {
	console.log('Step Function Two');
	console.log('State in Step Function Two BEFORE mutation', state);
	if (state) {
		state.currentStep = 2;
	}
	console.log('State in Step Function Two AFTER mutation', state);
};

const mySteps = [
	{
		stepName: 'Step 1',
		stepFunction: stepFunctionOne,
	},
	{
		stepName: 'Step 2',
		stepFunction: stepFunctionTwo,
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

export async function wrapper() {
	createMultiStepInputGeneric(myState, stepFunctionOne);
}
