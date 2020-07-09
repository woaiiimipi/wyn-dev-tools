'use strict';

import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { template } from './template';
import { scenarioMap, fileEnum } from './enums';
import { createFile, openFileAndInsertText, space, addActionForDefFiles } from './utils';
const { showInputBox, showQuickPick } = vscode.window;
export function activate(context: vscode.ExtensionContext) {

	const hover = vscode.languages.registerHoverProvider({ scheme: '*', language: '*' }, {
		provideHover(document, position, token) {
			const hoveredWord = document.getText(document.getWordRangeAtPosition(position));
			const config = vscode.workspace.getConfiguration();

			const hoverMappingResult = (config.get('hoverMapping') as any)[hoveredWord].split('\n');
			return {
				contents: [...hoverMappingResult],
			};
			// return new vscode.Hover('hover text');
		}
	});
	const deleteAllBranch = vscode.commands.registerCommand('extension.deleteAllBranch', () => {
		try {
			// @ts-ignore
			const git: SimpleGit = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
			git.branchLocal().then((data) => {
				const deleteAllBranch = `git branch | grep -v "${data.current}" | xargs git branch -D`;
				const terminal = vscode.window.createTerminal('delete branch');
				terminal.sendText(deleteAllBranch);
				setTimeout(() => {
					terminal.dispose();
				}, 3000);
			});
		} catch (error) {

		}
	});
	let addAction = vscode.commands.registerCommand('extension.addAction', async () => {
		const actionName = await showInputBox({ placeHolder: '请输入action名称' });

		const preItems: vscode.QuickPickItem[] = [
			{ label: 'pivotCharts', picked: true },
			{ label: 'richEditor', },
			{ label: 'picture', },
			{ label: 'container', },
			{ label: 'tabContainer' },
			{ label: 'slicer' },
			{ label: 'spreadChart' },
		];
		const preResult = await showQuickPick(preItems, { canPickMany: true, ignoreFocusOut: true, placeHolder: '请选择需要应用的Scenario类型' });
		const preResultList = preResult?.map(i => i.label);
		const items: vscode.QuickPickItem[] = Object.keys(scenarioMap).reduce((acc: vscode.QuickPickItem[], key) => {
			// @ts-ignore
			return acc.concat(scenarioMap[key](preResultList!.includes(key)));
		}, []);

		const selectedScenarios = await showQuickPick(items, { canPickMany: true, ignoreFocusOut: true, placeHolder: '确认子项' });
		const isExtensionAction = (await showQuickPick(['No', 'Yes'], { ignoreFocusOut: true, placeHolder: '是否是Extension类型的Action?' })) === 'Yes';
		const showDialog = (await showQuickPick(['Yes', 'No'], { ignoreFocusOut: true, placeHolder: '是否显示Dialog?' })) === 'Yes';

		if (!actionName) {
			return;
		}
		const upperName = `${actionName.charAt(0).toUpperCase()}${actionName.slice(1)}`;
		const lowerName = `${actionName.charAt(0).toLowerCase()}${actionName.slice(1)}`;
		if (isExtensionAction) {
			await openFileAndInsertText(fileEnum.Action, '// add extension action type here', `${upperName} = '_${lowerName}',\n${space(4)}`);
			await openFileAndInsertText(fileEnum.commonActions, '// add extension action here', template.extensionCommonAction(upperName, lowerName));
		} else {
			const snap1 = `${upperName} = '${lowerName}',\n${space(4)}`;
			await openFileAndInsertText(fileEnum.Action, '// add action type here', snap1);
			await openFileAndInsertText(fileEnum.Enum, '// add action menu type here', snap1);
		}
		if (showDialog) {
			const snap22 = `import { show${upperName}Dialog } from '../../dataAnalyze/${upperName}/index';\n`;
			await openFileAndInsertText(fileEnum.ActionBarUtils, '// import show dialog', snap22);
		}
		if (isExtensionAction) {
			const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionDefNS.ExtensionType.${upperName}, position, descriptor, scenario, dispatch);`;
			const snapAddExtension = `case ActionDefNS.ExtensionType.${upperName}: {
          return${showDialog ? showDialogLogic : ';'};
		    }
		  	`;
			await openFileAndInsertText(fileEnum.ActionBarUtils, '// add extension action handler here', snapAddExtension);
		} else {
			const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionMenuType.${upperName}, position, descriptor, scenario, dispatch);`;
			const snap2 = `case ActionMenuType.${upperName}: {\n${space(6)}return${showDialog ? showDialogLogic : ';'}\n${space(4)}}\n${space(2)}`;
			await openFileAndInsertText(fileEnum.ActionBarUtils, '// add action handler here', snap2);
		}
		const snap3 = `${upperName}Action,\n${space(2)}`;
		await openFileAndInsertText(fileEnum.ActionExecutor, '// import action here', snap3);
		if (!isExtensionAction) {
			const snap4 = `case ActionType.${upperName}:\n${space(8)}list = [new ${upperName}Action(def)];\n${space(8)}break;\n${space(6)}`;
			await openFileAndInsertText(fileEnum.ActionExecutor, '// create action here', snap4);
		}
		const snap5 = `import ${upperName}Action from './${upperName}Action';\n`;
		await openFileAndInsertText(fileEnum.ActionIndex, '// import action here', snap5);
		await openFileAndInsertText(fileEnum.ActionIndex, '// export action here', snap3);
		await createFile(fileEnum.ActionTemplate(upperName), template.action(lowerName, upperName));
		if (showDialog) {
			const folder = fileEnum.DataAnalyzeFolder(lowerName);
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(folder));
			await createFile(folder + fileEnum.containerts(upperName), template.containerts(upperName));
			await createFile(folder + fileEnum.containerscss(upperName), template.containerscss(upperName));
			await createFile(folder + fileEnum.containerindex, template.containerindex(upperName, lowerName));
			await openFileAndInsertText(fileEnum.mainScss, '// add import here', `@import './scenario/dataAnalyze/${lowerName}/${upperName}Container.scss';\n`);
		}
		const snap6 = `${lowerName}: '${upperName.replace(/\B([A-Z])/g, ' $1')}',\n${space(4)}`;
		await openFileAndInsertText(fileEnum.en, '// add action name here', snap6);
		const snap7 = `${lowerName}: '',\n${space(4)}`;
		await openFileAndInsertText(fileEnum.zh, '// add action name here', snap7);
		await openFileAndInsertText(fileEnum.zh_TW, '// add action name here', snap7);
		if (showDialog) {
			const snap8 = `${lowerName}: {\n${space(6)}title: '${upperName.replace(/\B([A-Z])/g, ' $1')}',\n${space(4)}},\n${space(4)}`;
			await openFileAndInsertText(fileEnum.en, '// add action dialog here', snap8);
			const snap9 = `${lowerName}: {\n${space(6)}title: '',\n${space(4)}},\n${space(4)}`;
			await openFileAndInsertText(fileEnum.zh, '// add action dialog here', snap9);
			await openFileAndInsertText(fileEnum.zh_TW, '// add action dialog here', snap9);
		}
		if (!selectedScenarios) {
			return;
		}
		addActionForDefFiles(selectedScenarios, upperName, lowerName, isExtensionAction);
	});

	context.subscriptions.push(hover, deleteAllBranch, addAction);
}

export function deactivate() { }