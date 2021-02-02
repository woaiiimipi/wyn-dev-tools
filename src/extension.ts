'use strict';

import * as vscode from 'vscode';
// @ts-ignore
import * as translate from 'translate'; 
import simpleGit, { SimpleGit } from 'simple-git';
// @ts-ignore
import * as OpenCC from 'node-opencc';
import { template } from './utils/template';
import { scenarioMap, fileEnum } from './utils/enums';
import { createFile, openFileAndInsertText, space, addActionForDefFiles, getGit, getFileText, getParentFolderName, getCurrentFileName, readDirectory, getFile, getHeadSpaceCount, gotoRange, getWebviewContent, registerWebViewCommands } from './utils/utils';
import { getStatementPosition } from './utils/astUtils';
import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import { getTestSitesInfo } from './utils/netUtils';
import { toDoListHtml } from './utils/htmls';
const { 
  window: { showInputBox, showQuickPick, showInformationMessage, showTextDocument, createWebviewPanel },
  workspace: { getConfiguration },
  commands: { registerCommand, executeCommand },
  scm: {},
  languages: { registerHoverProvider },
  extensions: {},
	env: {},
	Position, Range,
} = vscode;
export function activate(context: vscode.ExtensionContext) {

	const hover = registerHoverProvider({ scheme: '*', language: '*' }, {
		provideHover(document, position, token) {
			const hoveredWord = document.getText(document.getWordRangeAtPosition(position));
			const config = getConfiguration();

			const hoverMappingResult = (config.get('hoverMapping') as any)[hoveredWord].split('\n');
			return {
				contents: [...hoverMappingResult],
			};
		}
	});
	const deleteAllBranch = registerCommand('wyn.deleteAllBranch', async () => {
		try {
			// @ts-ignore
			const git: SimpleGit = getGit();
			const data = await git.branchLocal();
			const regex = new RegExp(`release|develop|${data.current}`);
			
			const items = data.all.map((branch): vscode.QuickPickItem => ({ label: branch, picked: !regex.test(branch) }));
			const result = await vscode.window.showQuickPick(items, { canPickMany: true, ignoreFocusOut: true });
			if (!result?.length) {
				return;
			}
			const deleteBranches = result!.map(i => i.label);
			if (deleteBranches.includes(data.current)) {
				const existBranch = items.find(i => !i.picked)?.label!;
				await git.checkout(existBranch);
				showInformationMessage(`Your branch has checkout to branch <${existBranch}>.`);
			}
			await git.deleteLocalBranches(deleteBranches, true);
			showInformationMessage('^-^:Delete branches success!');
		} catch (error) {
			vscode.window.showErrorMessage('~_~: Delete branches failed! The git register must have at least one branch.');
		}
	});
	const addAction = registerCommand('wyn.addAction', async () => {
		const actionName = await showInputBox({ placeHolder: '请输入action名称' });

		const preItems: vscode.QuickPickItem[] = [
			{ label: 'pivotCharts', picked: true },
			{ label: 'richEditor', },
			{ label: 'picture', },
			{ label: 'container', },
			{ label: 'tabContainer' },
			{ label: 'slicer' },
			{ label: 'spreadChart' },
			{ label: 'webContent' },
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
			const snap22 = `import { show${upperName}Dialog } from '../../dataAnalyze/${lowerName}/index';\n`;
			await openFileAndInsertText(fileEnum.ActionBarUtils, '// import show dialog', snap22);
		}
		if (isExtensionAction) {
			const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionDefNS.ExtensionType.${upperName}, position, descriptor, scenario, dispatch);`;
			const snapAddExtension = `case ActionDefNS.ExtensionType.${upperName}: {\n${space(10)}return${showDialog ? showDialogLogic : ';'}${space(8)}}\n${space(8)}`;
			await openFileAndInsertText(fileEnum.ActionBarUtils, '// add extension action handler here', snapAddExtension);
		} else {
			const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionMenuType.${upperName}, position, descriptor, scenario, dispatch);`;
			const snap2 = `case ActionMenuType.${upperName}: {\n${space(6)}return${showDialog ? showDialogLogic : ';'}\n${space(4)}}\n${space(2)}`;
			await openFileAndInsertText(fileEnum.ActionBarUtils, '// add action handler here', snap2);
    }
    const snap3 = `${upperName}Action,\n${space(2)}`;
    if (!isExtensionAction) {
      await openFileAndInsertText(fileEnum.ActionExecutor, '// import action here', snap3);
    }
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
	const _getNextLineInfo = (editor: vscode.TextEditor) => {
		const selection = editor.selection;
		const nextLineRange = new Range(new Position(selection.end.line + 1, 0), new Position(selection.end.line + 2, 0));
		const nextLineText = editor.document.getText(nextLineRange);
		const nextLineHeadSpaceCount = getHeadSpaceCount(nextLineText);
		const isEndLine = nextLineText.trimLeft().startsWith('}');
		const startPosition = isEndLine ? selection.start.translate(0, -2) : selection.start;
		return {
			isEndLine,
			nextLineText,
			startPosition,
			nextLineHeadSpaceCount,
		}
	}
	const zhToTw = registerCommand('wyn.zhTw', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		const { isEndLine, nextLineHeadSpaceCount, startPosition } = _getNextLineInfo(editor);
		const selection = editor.selection;
		const text = editor.document.getText(selection);
		const nextLineRange = new Range(new Position(selection.end.line + 1, 0), new Position(selection.end.line + 2, 0));
		const result = OpenCC.simplifiedToTaiwanWithPhrases(text);
		const fileName = editor.document.fileName;
		const twPath = fileName.includes('zh.js') ? fileName.replace('zh.js', 'zh_TW.ts'): fileName.replace('zh-CN.json', 'zh-TW.json');
		const insertText = (isEndLine ? space(2): '') + result + '\n' + space(nextLineHeadSpaceCount);
		await openFileAndInsertText(twPath, '', insertText, startPosition);
		console.log(nextLineRange.start.line);
		gotoRange(new Range(selection.start, selection.end), selection);
		// await executeCommand('workbench.action.gotoLine', nextLineRange.start.line);
	});
	const pushToOrigin = registerCommand('wyn.pushToOrigin', async () => {
		try {
			const git = getGit();
			await git.add('.');
			const commitMsg = await showInputBox({ value: 'fix', prompt: 'Please input commit message.' });
			await git.commit(commitMsg || '');
			await git.push();
		} catch (error) {
			showInformationMessage(error);
		}
	});
	const importScssToMain = registerCommand('wyn.importScssToMain', async () => {
		const findMainScss = async (folderName: string, data: any): Promise<void> => {
			const files = await readDirectory(folderName);
			const fileNames = files.map(i => i[0].replace(/\\/g, '/'));
			const mainScss = fileNames.find(i => i.includes('main.scss'));
			if (mainScss) {
				if (!data.mainScss) {
					data.mainScss = mainScss;
					data.folder = folderName;
					return Promise.resolve();
				}
			}
			const newFolderName = getParentFolderName(folderName);
			if (newFolderName.endsWith('frontend')) {
				return Promise.resolve();
			}
		 	return await findMainScss(newFolderName, data);
		};

		const curFile = getCurrentFileName()?.replace(/\\/g, '/');
		if (!curFile?.endsWith('scss')) {
			return;
		}
		const parentFolder = getParentFolderName(curFile);
		const data = { mainScss: '', folder: '' };
		await findMainScss(parentFolder!, data);
		if (!data.mainScss) {
			return;
		}
		const relativePath = curFile?.replace(getParentFolderName(data.folder + '/' + data.mainScss), '');
		const importContent = `@import '.${relativePath}';`;
		let similarLineIndex = -1;
		const findSimilarLine = (fileContent: string, text: string) => {
			if (similarLineIndex !== -1) {
				return;
			}
			const index = fileContent.lastIndexOf(text);
			if (index !== -1) {
				similarLineIndex = index;
				return;
			}
			const newFolder = getParentFolderName(text);
			if (!newFolder.includes('/')) {
				return;
			}
			findSimilarLine(fileContent, newFolder);
		};
		const mainScss = await getFile(data.folder + '/' + data.mainScss);
		findSimilarLine(mainScss.getText(), getParentFolderName(relativePath));
		
		const editor = await showTextDocument(mainScss, 1, false);
		await editor.edit(e => {
			if (similarLineIndex !== -1) {
				const position = new Position(mainScss.positionAt(similarLineIndex).line + 1, 0);
				e.insert(position, importContent + '\n');
			} else {
				e.insert(new Position(mainScss.eol, 0), importContent);
			}
		});
	});
	const i18n = registerCommand('wyn.enZhZhTw', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		const { isEndLine, nextLineHeadSpaceCount, startPosition } = _getNextLineInfo(editor);
		const selection = editor.selection;
		const text = editor.document.getText(selection);
		const nextLineRange = new Range(new Position(selection.end.line + 1, 0), new Position(selection.end.line + 2, 0));
		const zhText = (isEndLine ? space(2): '') + text + '\n' + space(nextLineHeadSpaceCount);
		const fileName = editor.document.fileName;
		const zhPath = fileName.includes('en.js') ? fileName.replace('en.js', 'zh.js'): fileName.replace('en-US.json', 'zh-CN.json');
		const esPath = fileName.includes('en.js') ? fileName.replace('en.js', 'es.ts'): fileName.replace('en-US.json', 'es.json');
		const plPath = fileName.includes('en.js') ? fileName.replace('en.js', 'pl.ts'): fileName.replace('en-US.json', 'pl.json');
		const twPath = editor.document.fileName.replace('en.js', 'zh_TW.ts');
		await openFileAndInsertText(esPath, '', zhText, startPosition);
		await openFileAndInsertText(plPath, '', zhText, startPosition);
		await openFileAndInsertText(zhPath, '', zhText, startPosition);
		gotoRange(new Range(selection.start, selection.end), selection);
		// await openFileAndInsertText(twPath, '', OpenCC.simplifiedToTaiwanWithPhrases(zhText), selection.start);
	});
	// const toRender = registerCommand('wyn.toRender', async () => {
	// 	const curFileText = await getFileText(getCurrentFileName()!);
	// 	const renderLine = getStatementPosition(curFileText, 'render', AST_NODE_TYPES.MethodDefinition)!.line; 
	// 	executeCommand('workbench.action.gotoLine', renderLine);
	// });
	const testSitesInf = registerCommand('wyn.testSitesInfo', async () => {
		 const info = await getTestSitesInfo();
		 const generateHtml = () => {
			 const convertedArr = [];
			 for(let key in info) {
				 const { name, owner } = info[key];
				 convertedArr.push({ name, owner });
			 };
			 const dom = convertedArr.map(({ owner, name }) => `<div class="owner">${owner}:</div><div class="site-name">${name}</div>`).join('');
			 const style = `
			 	 .owner {
					font-size: 25px;
					 color: skyblue;
				 }
				 .site-name {
					 color: yellow;
					 margin-bottom: 10px;
					 font-size: 30px;
				 }	
			 `;
			 return `
			 <!DOCTYPE html>
			 <html lang="en">
			 <head>
				 <meta charset="UTF-8">
				 <meta name="viewport" content="width=device-width, initial-scale=1.0">
				 <title>Document</title>
				 <style>
				 	 ${style}
				 </style>
			 </head>
			 <body>
				 ${dom}
			 </body>
			 </html>
			 `;
		 };
		 const panel = createWebviewPanel(
			'catCodiDng', // Identifies the type of the webview. Used internally
				'Test Sites', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{
					enableScripts: true,
				} // Webview options. More on these later.
			);
			panel.webview.html = generateHtml();
	});
	// const toDo = registerCommand('wyn.todo', async () => {
	// 	 const generateHtml = toDoListHtml;
	// 	 const panel = createWebviewPanel(
	// 		'ToDoList', // Identifies the type of the webview. Used internally
	// 			'To Do List', // Title of the panel displayed to the user
	// 			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
	// 			{
	// 				enableScripts: true,
	// 			} // Webview options. More on these later.
	// 		);
	// 		panel.webview.html = generateHtml();
	// });
	const webViewsCommands = registerWebViewCommands([
		{ command: 'wyn.diff', url: 'https://www.diffchecker.com/', title: 'Diff' },
		{ command: 'wyn.regexTester', url: 'https://www.regextester.com/', title: 'Regex Tester' },
		{ command: 'wyn.jsonTree', url: 'https://jsonformatter.org/json-viewer', title: 'JSON Tree' },
		{ command: 'wyn.ramda', url: 'https://ramdajs.com/docs/#', title: 'Ramda Docs' },
	]);
	context.subscriptions.push(hover, deleteAllBranch, addAction, zhToTw, importScssToMain, i18n, testSitesInf, ...webViewsCommands);
}

export function deactivate() { }