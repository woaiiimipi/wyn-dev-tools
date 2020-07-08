'use strict';

import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
// @ts-ignore
import translate from 'translate';
import { template } from './template';
const openFileAndInsertText = async (fileName: string, findText: string, insertText: string) => {
	const doc = await vscode.workspace.openTextDocument(fileName);
	const content = doc.getText();
	const offset = content.indexOf(findText);
	const position = doc.positionAt(offset);
	const editor = await vscode.window.showTextDocument(doc, 1, false);
	await editor.edit(e => {
		e.insert(position, insertText);
	});
};
const space = (count: number) => ' '.repeat(count);
export function activate(context: vscode.ExtensionContext) {

	let hover = vscode.languages.registerHoverProvider({ scheme: '*', language: '*' }, {
		provideHover(document, position, token) {
			var hoveredWord = document.getText(document.getWordRangeAtPosition(position));
			const config = vscode.workspace.getConfiguration();

			const hoverMappingResult = (config.get('hoverMapping') as any)[hoveredWord].split('\n');
			return {
				contents: [...hoverMappingResult],
			};
			// return new vscode.Hover('hover text');
		}
	});
	let deleteAllBranch = vscode.commands.registerCommand('extension.deleteAllBranch', () => {
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
		const text = await translate('Hello World', 'zh');
		if (text) {
			vscode.window.showInformationMessage(text);
			return;
		}
		
		const path = vscode.workspace.rootPath + '/test.ts';
		const actionName = await vscode.window.showInputBox({ placeHolder: '请输入action名称' });
		const scenarioMap = {
			pivotCharts: (picked: boolean): vscode.QuickPickItem[] => [
				{ label: 'column', picked },
				{ label: 'bar', picked },
				{ label: 'area', picked },
			],
			richEditor: (picked: boolean): vscode.QuickPickItem[] => [
				{ label: 'richEditor', picked },
			],
			picture: (picked: boolean): vscode.QuickPickItem[] => [
				{ label: 'picture', picked },
			],
			slicer: (picked: boolean): vscode.QuickPickItem[] => [
				{ label: 'tree', picked },
				{ label: 'dateRange', picked },
				{ label: 'comboBox', picked },
				{ label: 'label', picked },
				{ label: 'relativeDate', picked },
				{ label: 'dataRange', picked },
			],
			container: (picked: boolean): vscode.QuickPickItem[] => [
				{ label: 'container', picked },
			],
			tabContainer: (picked: boolean): vscode.QuickPickItem[] => [
				{ label: 'tabContainer', picked },
			],
			spreadChart: (picked: boolean): vscode.QuickPickItem[] => [
				{ label: 'spreadChart', picked },
			],
		};
		const preItems: vscode.QuickPickItem[] = [
			{ label: 'pivotCharts', picked: true },
			{ label: 'richEditor', },
			{ label: 'picture', },
			{ label: 'container', },
			{ label: 'tabContainer' },
			{ label: 'slicer' },
			{ label: 'spreadChart' },
		];
		const preResult = await vscode.window.showQuickPick(preItems, { canPickMany: true, ignoreFocusOut: true, placeHolder: '请选择需要应用的Scenario类型' });
		const preResultList = preResult?.map(i => i.label);
		const items: vscode.QuickPickItem[] = ['pivotCharts', 'richEditor', 'picture', 'container', 'tabContainer', 'slicer', 'spreadChart'].reduce((acc: vscode.QuickPickItem[], key) => {
			// @ts-ignore
			return acc.concat(scenarioMap[key](preResultList!.includes(key)));
		}, []);

		const selectedScenarios = await vscode.window.showQuickPick(items, { canPickMany: true, ignoreFocusOut: true, placeHolder: '确认子项' });
		const isExtensionAction = await vscode.window.showQuickPick(['No', 'Yes'], { ignoreFocusOut: true, placeHolder: '是否是Extension类型的Action?' });
		const root = vscode.workspace.rootPath;
		const fileEnum = {
			'Action': root + '/src/common/core/visual/interfaces/Action.ts',
			'Enum': root + '/src/common/interfaces/Enums.ts',
			'ActionBarUtils': root + '/src/pcBrowser/runTime/scenario/actionBar/utils/ActionBarUtils.ts',
			'ActionExecutor': root + '/src/common/core/visual/visualDef/interaction/ActionExecutor.ts',
			'ActionIndex': root + '/src/common/core/visual/visualDef/interaction/actions/index.ts',
			'ActionTemplate': (actionName: string) => `${root}/src/common/core/visual/visualDef/interaction/actions/${actionName}Action.ts`
		};
		if (!actionName) {
			return;
		}
		const upperName = `${actionName.charAt(0).toUpperCase()}${actionName.slice(1)}`;
		const lowerName = `${actionName.charAt(0).toLowerCase()}${actionName.slice(1)}`;
		const snap1 = `${upperName} = '${lowerName}',\n`;
		await openFileAndInsertText(fileEnum.Action, '// add action type here', snap1);
		await openFileAndInsertText(fileEnum.Enum, '// add action menu type here', snap1);
		const snap2 = `case ActionMenuType.${upperName}: {\n${space(6)}return;\n${space(4)}}\n`;
		await openFileAndInsertText(fileEnum.ActionBarUtils, '// add action handler here', snap2);
		const snap3 = `${upperName}Action,\n`;
		await openFileAndInsertText(fileEnum.ActionExecutor, '// import action here', snap3);
		const snap4 = `case ActionType.${upperName}:\n${space(8)}list = [new ${upperName}Action()];\n${space(8)}break;\n`;
		await openFileAndInsertText(fileEnum.ActionExecutor, '// create action here', snap4);
		const snap5 = `import ${upperName}Action from './${upperName}Action;\n`;
		await openFileAndInsertText(fileEnum.ActionIndex, '// import action here', snap5);
		await openFileAndInsertText(fileEnum.ActionIndex, '// export action here', snap3);
		const content1 = Buffer.from(template.action(lowerName, upperName));
		await vscode.workspace.fs.writeFile(vscode.Uri.file(fileEnum.ActionTemplate(upperName)), content1);
	});
	// const detectChange = vscode.languages.registerCodeActionsProvider({ scheme: '*', language: '*' }, {
	// 	provideCodeActions(document, range, context, token) {
	// 		return [{ title: 'a', kind: 'a', tooltip: 'aaaa' }];
	// 	}
	// });
	context.subscriptions.push(hover);
	context.subscriptions.push(deleteAllBranch);
	context.subscriptions.push(addAction);
}

export function deactivate() { }