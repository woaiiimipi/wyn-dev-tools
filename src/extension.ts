'use strict';

import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { template } from './template';
import { scenarioMap } from './enums';
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
		const path = vscode.workspace.rootPath + '/test.ts';
		const actionName = await vscode.window.showInputBox({ placeHolder: '请输入action名称' });

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
		const items: vscode.QuickPickItem[] = Object.keys(scenarioMap).reduce((acc: vscode.QuickPickItem[], key) => {
			// @ts-ignore
			return acc.concat(scenarioMap[key](preResultList!.includes(key)));
		}, []);

		const selectedScenarios = await vscode.window.showQuickPick(items, { canPickMany: true, ignoreFocusOut: true, placeHolder: '确认子项' });
		const isExtensionAction = (await vscode.window.showQuickPick(['No', 'Yes'], { ignoreFocusOut: true, placeHolder: '是否是Extension类型的Action?' })) === 'Yes';
		const showDialog = (await vscode.window.showQuickPick(['Yes', 'No'], { ignoreFocusOut: true, placeHolder: '是否显示Dialog?' })) === 'Yes';
		const root = vscode.workspace.rootPath;
		const fileEnum = {
			'Action': root + '/src/common/core/visual/interfaces/Action.ts',
			'commonActions': root + '/src/common/widgets/buildIn/defs/commonActions.ts',
			'Enum': root + '/src/common/interfaces/Enums.ts',
			'ActionBarUtils': root + '/src/pcBrowser/runTime/scenario/actionBar/utils/ActionBarUtils.ts',
			'ActionExecutor': root + '/src/common/core/visual/visualDef/interaction/ActionExecutor.ts',
			'ActionIndex': root + '/src/common/core/visual/visualDef/interaction/actions/index.ts',
			'ActionTemplate': (actionName: string) => `${root}/src/common/core/visual/visualDef/interaction/actions/${actionName}Action.ts`,
			'DataAnalyzeFolder': (actionName: string) => `${root}/src/pcBrowser/runTime/scenario/dataAnalyze/${actionName}`,
			'containerts': (upperName: string) => `/${upperName}Container.tsx`,
			'containerscss': (upperName: string) => `/${upperName}Container.scss`,
			'containerindex': `/index.ts`,
			'en': root + `/src/common/services/i18n/locales/en.js`,
			'zh': root + `/src/common/services/i18n/locales/zh.js`,
			'zh_TW': root + `/src/common/services/i18n/locales/zh_TW.ts`,
			'pivotCharts': root + '/src/common/widgets/buildIn/pivotCharts',
			'slicers': root + '/src/common/widgets/buildIn/slicers',
			'others': root + '/src/common/widgets/buildIn/others',
		};
		if (!actionName) {
			return;
		}
		const upperName = `${actionName.charAt(0).toUpperCase()}${actionName.slice(1)}`;
		const lowerName = `${actionName.charAt(0).toLowerCase()}${actionName.slice(1)}`;
		if (isExtensionAction) {
			await openFileAndInsertText(fileEnum.Action, '// add extension action type here', `${upperName} = '_${lowerName}',\n${space(4)}`);
		const extensionCommonAction = `export const ${lowerName} = {
		type: ActionDefNS.ActionType.Extension,
		name: '${lowerName}',
		path: '${lowerName}',
		extensionType: ActionDefNS.ExtensionType.${upperName},
		displayNameKey: 'actionBar.${lowerName}',
		iconCss: 'icon-${lowerName.replace(/\B([A-Z])/g, '-$1').toLowerCase()}',
	};
  `;
			await openFileAndInsertText(fileEnum.commonActions, '// add extension action here', extensionCommonAction);
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
		const content1 = Buffer.from(template.action(lowerName, upperName));
		await vscode.workspace.fs.writeFile(vscode.Uri.file(fileEnum.ActionTemplate(upperName)), content1);
		if (showDialog) {
			const folder = fileEnum.DataAnalyzeFolder(lowerName);
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(folder));
			await vscode.workspace.fs.writeFile(vscode.Uri.file(folder + fileEnum.containerts(upperName)), Buffer.from(template.containerts(upperName)));
			await vscode.workspace.fs.writeFile(vscode.Uri.file(folder + fileEnum.containerscss(upperName)), Buffer.from(template.containerscss(upperName)));
			await vscode.workspace.fs.writeFile(vscode.Uri.file(folder + fileEnum.containerindex), Buffer.from(template.containerindex(upperName, lowerName)));
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
		for (let i = 0; i < selectedScenarios.length; i++) {
			const def = selectedScenarios[i].label;
			let actionDef = `{
			  type: ActionDefNS.ActionType.${upperName},
			},\n${space(6)}`;
			if (isExtensionAction) {
				actionDef = `DVChartActions.${lowerName},\n${space(6)}`;
			}
			try {
				await openFileAndInsertText(`${fileEnum.pivotCharts}/${def}.ts`, '// add action here', actionDef);
			} catch (error) {
				try {
					await openFileAndInsertText(`${fileEnum.slicers}/${def}.ts`, '// add action here', actionDef);
				} catch (error) {
					if (def === 'spreadChart') {
						actionDef = `{
	  	type: ActionDefNS.ActionType.${upperName},
		},\n${space(4)}`;
						if (isExtensionAction) {
							actionDef = `DVChartActions.${lowerName},\n${space(4)}`;
						}
					}
					await openFileAndInsertText(`${fileEnum.others}/${def}.ts`, '// add action here', actionDef);
				}
			}
		}
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