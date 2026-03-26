import { window, Disposable, QuickInput, QuickInputButtons, QuickPickItem } from 'vscode';
import { ValidationFunction, ValidationResult } from '../utils/validators';

export interface IStateBase {
	dialogTitle: string;
	currentStep: number;
	totalSteps: number;
	[key: string]: string | number;
}

class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
}

export type InputStep<T extends IStateBase> = (
	input: MultiStepInput<T>,
	state?: T,
) => Thenable<InputStep<T> | void>;

interface TextInputParameters {
	title: string;
	titleSuffix?: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validateInputFct: ValidationFunction;
	onBack?: (typedValue: string) => void;
	ignoreFocusOut?: boolean;
	placeholder?: string;
}

interface QuickPickParameters<P extends QuickPickItem> {
	title: string;
	titleSuffix?: string;
	step: number;
	totalSteps: number;
	items: P[];
	activeItem?: P;
	ignoreFocusOut?: boolean;
	placeholder?: string;
}

export class MultiStepInput<T extends IStateBase> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static async run(start: InputStep<any>) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep<T>[] = [];

	private async stepThrough(start: InputStep<T>) {
		let step: InputStep<T> | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					throw err;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showTextInput({
		title,
		titleSuffix,
		step,
		totalSteps,
		value,
		prompt,
		validateInputFct,
		onBack,
		ignoreFocusOut,
		placeholder,
	}: TextInputParameters): Promise<string> {
		const disposables: Disposable[] = [];

		// Create the Promise that is resolved/rejected based on the event listeners
		const p = new Promise<string>((resolve, reject) => {
			const input = window.createInputBox();
			input.title = title + (titleSuffix ?? '');
			input.step = step;
			input.totalSteps = totalSteps;
			input.value = value || '';
			input.prompt = prompt;
			input.ignoreFocusOut = ignoreFocusOut ?? true;
			input.placeholder = placeholder;
			input.buttons = this.steps.length > 1 ? [QuickInputButtons.Back] : [];
			disposables.push(
				input.onDidTriggerButton((item) => {
					// If the back button is pressed. No other buttons are expected.
					if (item === QuickInputButtons.Back) {
						onBack?.(input.value);
						reject(InputFlowAction.back);
					}
				}),
				input.onDidAccept(async () => {
					input.enabled = false;
					input.busy = true;
					const validationResult: ValidationResult = validateInputFct(
						input.value,
					);
					if (!validationResult.isValid) {
						input.validationMessage =
							validationResult.errorMessage ?? 'Invalid input';
					} else {
						resolve(input.value);
					}
					input.enabled = true;
					input.busy = false;
				}),
				input.onDidHide(() => {
					reject(InputFlowAction.cancel);
				}),
				input.onDidChangeValue(async () => {
					input.validationMessage = undefined;
				}),
			);
			if (this.current) {
				this.current.dispose();
			}
			this.current = input;
			this.current.show();
		});

		// Resolve the Promise and clean up the event listeners when the input is accepted or canceled
		try {
			return await p;
		} finally {
			disposables.forEach((d) => d.dispose());
		}
	}

	async showQuickPick<T extends QuickPickItem>({
		title,
		titleSuffix,
		step,
		totalSteps,
		activeItem,
		items,
		ignoreFocusOut,
		placeholder,
	}: QuickPickParameters<T>): Promise<T> {
		const disposables: Disposable[] = [];

		// Create the Promise that is resolved/rejected based on the event listeners
		const p = new Promise<T>((resolve, reject) => {
			const input = window.createQuickPick<T>();
			input.title = title + (titleSuffix ?? '');
			input.step = step;
			input.totalSteps = totalSteps;
			input.ignoreFocusOut = ignoreFocusOut ?? true;
			input.placeholder = placeholder;
			input.items = items;
			if (activeItem) {
				input.activeItems = [activeItem];
			}
			input.buttons = this.steps.length > 1 ? [QuickInputButtons.Back] : [];
			disposables.push(
				input.onDidTriggerButton((item) => {
					// If the back button is pressed. No other buttons are expected.
					if (item === QuickInputButtons.Back) {
						reject(InputFlowAction.back);
					}
				}),
				input.onDidChangeSelection((items) => resolve(items[0])),
				input.onDidHide(() => {
					reject(InputFlowAction.cancel);
				}),
			);
			this.current?.dispose();
			this.current = input;
			this.current.show();
		});

		// Resolve the Promise and clean up the event listeners when the input is accepted or canceled
		try {
			return await p;
		} finally {
			disposables.forEach((d) => d.dispose());
		}
	}
}

export async function createMultiStepInputGeneric<T extends IStateBase>(
	state: T,
	initFunction: InputStep<T>,
): Promise<void> {
	async function collectInputs() {
		await MultiStepInput.run((input) => initFunction(input, state));
	}

	const finalState = await collectInputs();
	window.showInformationMessage(
		`All steps completed! Final state: ${JSON.stringify(finalState)}`,
	);
}
