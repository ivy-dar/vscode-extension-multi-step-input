/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	window,
	Disposable,
	QuickInput,
	QuickInputButtons,
	Uri,
	QuickPickItem,
	ExtensionContext,
} from 'vscode';
import {
	validateNotEmpty,
	validateDotSeparatedName,
	ValidationFunction,
	ValidationResult,
} from './utils/validators';

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 *
 * Process: Receives possible list of project URIs.
 */
export async function multiStepInputNewProcess(_context: ExtensionContext) {
	// TODO: Dynamic by input steparguments
	const TOTAL_STEPS = 3;

	// TODO: Receive as argument, troubles with the types
	const DUMMY_PROJECT_URIS: Uri[] = [
		Uri.parse(
			'file:///home/dominik/Projects/vscode-extension-multi-step-input/quickinput-sample/src',
		),
		Uri.parse(
			'file:///home/dominik/Projects/vscode-extension-multi-step-input/quickinput-sample/test',
		),
	];

	const projectsToPick: ProjectSpec[] = DUMMY_PROJECT_URIS.map((uri) => ({
		fullUri: uri,
		label: uri.fsPath.split('/').slice(-1)[0],
		description: uri.fsPath,
	}));

	interface State {
		title: string;
		step: number;
		totalSteps: number;
		project: ProjectSpec;
		processName: string;
		processNamespace: string;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run((input) => pickProjectName(input, state));
		return state as State;
	}

	const title = 'Create New Axon Ivy Process'; // TODO: Dynamic by input steparguments

	async function pickProjectName(input: MultiStepInput, state: Partial<State>) {
		state.project = await input.showQuickPick({
			title,
			step: 1, // TODO: Dynamic by input steparguments
			totalSteps: TOTAL_STEPS,
			activeItem: state.project, // Show the already chosen pick when navigating back
			items: projectsToPick,
			placeholder:
				"Choose the Axon Ivy Project to create the process in (press 'Enter' to confirm or 'Escape' to cancel)",
		});
		return (input: MultiStepInput) => inputProcessName(input, state);
	}

	async function inputProcessName(input: MultiStepInput, state: Partial<State>) {
		state.processName = await input.showTextInput({
			title,
			step: 2, // TODO: Dynamic by input steparguments
			totalSteps: TOTAL_STEPS,
			value: state.processName || '', // Show the already chosen name when navigating back.
			prompt: 'Choose a name for the Axon Ivy Process',
			validateInputFct: validateNotEmpty,
			onBack: (typedValue) => {
				state.processName = typedValue;
			},
		});
		return (input: MultiStepInput) => inputProcessNamespace(input, state);
	}

	async function inputProcessNamespace(input: MultiStepInput, state: Partial<State>) {
		state.processNamespace = await input.showTextInput({
			title,
			step: 3, // TODO: Dynamic by input steparguments
			totalSteps: TOTAL_STEPS,
			value: state.processNamespace || '', // Show the already chosen name when navigating back.
			prompt: 'Choose a namespace for the Axon Ivy Process (e.g. /my/namespace)',
			validateInputFct: validateDotSeparatedName,
			onBack: (typedValue) => {
				state.processNamespace = typedValue;
			},
		});
	}

	const state = await collectInputs();
	window.showInformationMessage(
		`Creating Process with name
		'${state.processName}' and namespace '${state.processNamespace}' in project '${state.project.label}
		(full URI: ${state.project.fullUri})'`,
	);
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

interface ProjectSpec extends QuickPickItem {
	fullUri: Uri;
}

class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface TextInputParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validateInputFct: ValidationFunction;
	onBack?: (typedValue: string) => void;
	ignoreFocusOut?: boolean;
	placeholder?: string;
}

interface QuickPickParameters {
	title: string;
	step: number;
	totalSteps: number;
	items: ProjectSpec[];
	activeItem?: ProjectSpec;
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
			input.title = title;
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
				// No listener for onDidChangeValue, since validation is only triggered when accepting the input
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

	async showQuickPick({
		title,
		step,
		totalSteps,
		activeItem,
		items,
		ignoreFocusOut,
		placeholder,
	}: QuickPickParameters): Promise<ProjectSpec> {
		const disposables: Disposable[] = [];

		// Create the Promise that is resolved/rejected based on the event listeners
		const p = new Promise<ProjectSpec>((resolve, reject) => {
			const input = window.createQuickPick<ProjectSpec>();
			input.title = title;
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
