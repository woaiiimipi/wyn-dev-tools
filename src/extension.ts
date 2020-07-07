'use strict';

import * as vscode from 'vscode';
import { win32 } from 'path';
// @ts-ignore
import simpleGit, { SimpleGit } from 'simple-git';

export function activate(context: vscode.ExtensionContext) {

	var enableExtension: Boolean = false;
	vscode.commands.registerCommand('extension.enableHoverconverter', () => {

		vscode.window.showInformationMessage('Hover Converter Enabled');
		enableExtension = true;

	});

	const textEditor = vscode.window.activeTextEditor;
	const firstLine = textEditor!.document.lineAt(0);
	const lastLine = textEditor!.document.lineAt(textEditor!.document.lineCount - 1);
	const textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
	vscode.window.showInformationMessage(textEditor?.document.getText() || '');
	vscode.window.showInformationMessage(vscode.window.activeTextEditor?.document.fileName || '');
	vscode.commands.registerCommand('extension.disableHoverconverter', () => {

		enableExtension = false;
		vscode.window.showInformationMessage('Hover Converter Disabled');

	});

	var regexHex = /^0x[0-9a-fA-F]+$/g;
	var regexHexc = /^[0-9a-fA-F]+[h]$/g;
	var regexDec = /^-?[0-9]+$/g;
	const terminal1 = vscode.window.createTerminal('t1');
	terminal1.sendText('git --version');
	const terminals = vscode.window.terminals;
	terminal1.show(true);
	const t = terminals.find(t => t.name === 't1');
	let hover = vscode.languages.registerHoverProvider({ scheme: '*', language: '*' }, {
		provideHover(document, position, token) {
			var hoveredWord = document.getText(document.getWordRangeAtPosition(position));
			var markdownString = new vscode.MarkdownString();
			const config = vscode.workspace.getConfiguration();


			if ((regexHex.test(hoveredWord.toString()) || regexHexc.test(hoveredWord.toString())) && enableExtension) {

				markdownString.appendCodeblock(`Dec:\n${parseInt(hoveredWord, 16)}\nBinary:\n${parseInt(hoveredWord, 16).toString(2)}`, 'javascript');

				return {
					contents: [markdownString]
				};
			}

			else if (regexDec.test(hoveredWord.toString()) && enableExtension) {

				var input: Number = Number(hoveredWord.toString());
				markdownString.appendCodeblock(`Hex:\n0x${input.toString(16).toUpperCase()}\nBinary:\n${input.toString(2).replace(/(^\s+|\s+$)/, '')} `, 'javascript');

				return {
					contents: [markdownString]
				};
			} else {
				const hoverMappingResult = (config.get('hoverMapping') as any)[hoveredWord].split('\n');
				return {
					contents: [...hoverMappingResult],
				};
				// return new vscode.Hover('hover text');
			}

		}
	});
	let deleteAllBranch = vscode.commands.registerCommand('extension.deleteAllBranch', () => {
		try {
			// @ts-ignore
			const git = simpleGit(vscode.workspace.workspaceFolders[0].uri.fsPath);
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
	// const detectChange = vscode.languages.registerCodeActionsProvider({ scheme: '*', language: '*' }, {
	// 	provideCodeActions(document, range, context, token) {
	// 		return [{ title: 'a', kind: 'a', tooltip: 'aaaa' }];
	// 	}
	// });
	context.subscriptions.push(hover);
	context.subscriptions.push(deleteAllBranch);
}

export function deactivate() { }