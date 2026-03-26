/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext } from 'vscode';
import { multiStepInputNewProject } from './multiStepInputNewProject';
import { multiStepInputNewProcess } from './multiStepInputNewProcess';
import { wrapper } from './generic/multiStepInputGenericUsage';

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand('samples.multiStepInputNewProject', () => {
			multiStepInputNewProject();
		}),
		commands.registerCommand('samples.multiStepInputNewProcess', () => {
			multiStepInputNewProcess();
		}),
		commands.registerCommand('samples.multiStepInputGeneric', () => {
			wrapper();
		}),
	);
}
