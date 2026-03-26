/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, Disposable, QuickInput, QuickInputButtons } from 'vscode';
import {
	validateNotEmptyNoWhitespace,
	validateDotSeparatedName,
	ValidationFunction,
	ValidationResult,
} from './utils/validators';

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function multiStepInputNewProject() {
	// TODO: Dynamic by input steparguments
	const TOTAL_STEPS = 3;

	interface State {
		title: string;
		step: number;
		totalSteps: number;
		projectName: string;
		groupId: string;
		projectId: string;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run((input) => inputProjectName(input, state));
		return state as State;
	}

	const title = 'Create New Axon Ivy Project'; // TODO: Dynamic by input steparguments

	async function inputProjectName(input: MultiStepInput, state: Partial<State>) {
		state.projectName = await input.showTextInput({
			title,
			titleSuffix: ' - Project Name',
			step: 1, // TODO: Dynamic by input steparguments
			totalSteps: TOTAL_STEPS,
			value: state.projectName || '', // Show the already chosen name when navigating back.
			prompt: 'Choose a name for the Axon Ivy Project',
			validateInputFct: validateNotEmptyNoWhitespace,
			onBack: (typedValue) => {
				state.projectName = typedValue;
			},
		});
		return (input: MultiStepInput) => inputGroupId(input, state);
	}

	async function inputGroupId(input: MultiStepInput, state: Partial<State>) {
		state.groupId = await input.showTextInput({
			title,
			titleSuffix: ' - Group ID',
			step: 2, // TODO: Dynamic by input steparguments
			totalSteps: TOTAL_STEPS,
			value: state.groupId || '', // Show the already chosen name when navigating back.
			prompt: 'Choose a group ID for the Axon Ivy Project (e.g. com.mycompany)',
			validateInputFct: validateDotSeparatedName,
			onBack: (typedValue) => {
				state.groupId = typedValue;
			},
		});
		return (input: MultiStepInput) => inputProjectId(input, state);
	}

	async function inputProjectId(input: MultiStepInput, state: Partial<State>) {
		state.projectId = await input.showTextInput({
			title,
			titleSuffix: ' - Project ID',
			step: 3, // TODO: Dynamic by input steparguments
			totalSteps: TOTAL_STEPS,
			value: state.projectId || '', // Show the already chosen name when navigating back.
			prompt: 'Choose a project ID for the Axon Ivy Project',
			validateInputFct: validateDotSeparatedName,
			onBack: (typedValue) => {
				state.projectId = typedValue;
			},
		});
	}

	const state = await collectInputs();
	window.showInformationMessage(
		`Creating Project with name '${state.projectName}' and project ID '${state.projectId}' in group ID '${state.groupId}'`,
	);
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

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

class MultiStepInput {
	static async run(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];

	private async stepThrough(start: InputStep) {
		let step: InputStep | void = start;
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
