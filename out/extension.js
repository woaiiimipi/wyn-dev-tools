'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const simple_git_1 = require("simple-git");
const template_1 = require("./template");
const enums_1 = require("./enums");
const openFileAndInsertText = (fileName, findText, insertText) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield vscode.workspace.openTextDocument(fileName);
    const content = doc.getText();
    const offset = content.indexOf(findText);
    const position = doc.positionAt(offset);
    const editor = yield vscode.window.showTextDocument(doc, 1, false);
    yield editor.edit(e => {
        e.insert(position, insertText);
    });
});
const space = (count) => ' '.repeat(count);
function activate(context) {
    let hover = vscode.languages.registerHoverProvider({ scheme: '*', language: '*' }, {
        provideHover(document, position, token) {
            var hoveredWord = document.getText(document.getWordRangeAtPosition(position));
            const config = vscode.workspace.getConfiguration();
            const hoverMappingResult = config.get('hoverMapping')[hoveredWord].split('\n');
            return {
                contents: [...hoverMappingResult],
            };
            // return new vscode.Hover('hover text');
        }
    });
    let deleteAllBranch = vscode.commands.registerCommand('extension.deleteAllBranch', () => {
        try {
            // @ts-ignore
            const git = simple_git_1.default(vscode.workspace.workspaceFolders[0].uri.fsPath);
            git.branchLocal().then((data) => {
                const deleteAllBranch = `git branch | grep -v "${data.current}" | xargs git branch -D`;
                const terminal = vscode.window.createTerminal('delete branch');
                terminal.sendText(deleteAllBranch);
                setTimeout(() => {
                    terminal.dispose();
                }, 3000);
            });
        }
        catch (error) {
        }
    });
    let addAction = vscode.commands.registerCommand('extension.addAction', () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const path = vscode.workspace.rootPath + '/test.ts';
        const actionName = yield vscode.window.showInputBox({ placeHolder: '请输入action名称' });
        const preItems = [
            { label: 'pivotCharts', picked: true },
            { label: 'richEditor', },
            { label: 'picture', },
            { label: 'container', },
            { label: 'tabContainer' },
            { label: 'slicer' },
            { label: 'spreadChart' },
        ];
        const preResult = yield vscode.window.showQuickPick(preItems, { canPickMany: true, ignoreFocusOut: true, placeHolder: '请选择需要应用的Scenario类型' });
        const preResultList = (_a = preResult) === null || _a === void 0 ? void 0 : _a.map(i => i.label);
        const items = Object.keys(enums_1.scenarioMap).reduce((acc, key) => {
            // @ts-ignore
            return acc.concat(enums_1.scenarioMap[key](preResultList.includes(key)));
        }, []);
        const selectedScenarios = yield vscode.window.showQuickPick(items, { canPickMany: true, ignoreFocusOut: true, placeHolder: '确认子项' });
        const isExtensionAction = (yield vscode.window.showQuickPick(['No', 'Yes'], { ignoreFocusOut: true, placeHolder: '是否是Extension类型的Action?' })) === 'Yes';
        const showDialog = (yield vscode.window.showQuickPick(['Yes', 'No'], { ignoreFocusOut: true, placeHolder: '是否显示Dialog?' })) === 'Yes';
        const root = vscode.workspace.rootPath;
        const fileEnum = {
            'Action': root + '/src/common/core/visual/interfaces/Action.ts',
            'commonActions': root + '/src/common/widgets/buildIn/defs/commonActions.ts',
            'Enum': root + '/src/common/interfaces/Enums.ts',
            'ActionBarUtils': root + '/src/pcBrowser/runTime/scenario/actionBar/utils/ActionBarUtils.ts',
            'ActionExecutor': root + '/src/common/core/visual/visualDef/interaction/ActionExecutor.ts',
            'ActionIndex': root + '/src/common/core/visual/visualDef/interaction/actions/index.ts',
            'ActionTemplate': (actionName) => `${root}/src/common/core/visual/visualDef/interaction/actions/${actionName}Action.ts`,
            'DataAnalyzeFolder': (actionName) => `${root}/src/pcBrowser/runTime/scenario/dataAnalyze/${actionName}`,
            'containerts': (upperName) => `/${upperName}Container.tsx`,
            'containerscss': (upperName) => `/${upperName}Container.scss`,
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
            yield openFileAndInsertText(fileEnum.Action, '// add extension action type here', `${upperName} = '_${lowerName}',\n${space(4)}`);
            const extensionCommonAction = `export const ${lowerName} = {
		type: ActionDefNS.ActionType.Extension,
		name: '${lowerName}',
		path: '${lowerName}',
		extensionType: ActionDefNS.ExtensionType.${upperName},
		displayNameKey: 'actionBar.${lowerName}',
		iconCss: 'icon-${lowerName.replace(/\B([A-Z])/g, '-$1').toLowerCase()}',
	};
  `;
            yield openFileAndInsertText(fileEnum.commonActions, '// add extension action here', extensionCommonAction);
        }
        else {
            const snap1 = `${upperName} = '${lowerName}',\n${space(4)}`;
            yield openFileAndInsertText(fileEnum.Action, '// add action type here', snap1);
            yield openFileAndInsertText(fileEnum.Enum, '// add action menu type here', snap1);
        }
        if (showDialog) {
            const snap22 = `import { show${upperName}Dialog } from '../../dataAnalyze/${upperName}/index';\n`;
            yield openFileAndInsertText(fileEnum.ActionBarUtils, '// import show dialog', snap22);
        }
        if (isExtensionAction) {
            const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionDefNS.ExtensionType.${upperName}, position, descriptor, scenario, dispatch);`;
            const snapAddExtension = `case ActionDefNS.ExtensionType.${upperName}: {
          return${showDialog ? showDialogLogic : ';'};
		    }
		  	`;
            yield openFileAndInsertText(fileEnum.ActionBarUtils, '// add extension action handler here', snapAddExtension);
        }
        else {
            const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionMenuType.${upperName}, position, descriptor, scenario, dispatch);`;
            const snap2 = `case ActionMenuType.${upperName}: {\n${space(6)}return${showDialog ? showDialogLogic : ';'}\n${space(4)}}\n${space(2)}`;
            yield openFileAndInsertText(fileEnum.ActionBarUtils, '// add action handler here', snap2);
        }
        const snap3 = `${upperName}Action,\n${space(2)}`;
        yield openFileAndInsertText(fileEnum.ActionExecutor, '// import action here', snap3);
        if (!isExtensionAction) {
            const snap4 = `case ActionType.${upperName}:\n${space(8)}list = [new ${upperName}Action(def)];\n${space(8)}break;\n${space(6)}`;
            yield openFileAndInsertText(fileEnum.ActionExecutor, '// create action here', snap4);
        }
        const snap5 = `import ${upperName}Action from './${upperName}Action';\n`;
        yield openFileAndInsertText(fileEnum.ActionIndex, '// import action here', snap5);
        yield openFileAndInsertText(fileEnum.ActionIndex, '// export action here', snap3);
        const content1 = Buffer.from(template_1.template.action(lowerName, upperName));
        yield vscode.workspace.fs.writeFile(vscode.Uri.file(fileEnum.ActionTemplate(upperName)), content1);
        if (showDialog) {
            const folder = fileEnum.DataAnalyzeFolder(lowerName);
            yield vscode.workspace.fs.createDirectory(vscode.Uri.file(folder));
            yield vscode.workspace.fs.writeFile(vscode.Uri.file(folder + fileEnum.containerts(upperName)), Buffer.from(template_1.template.containerts(upperName)));
            yield vscode.workspace.fs.writeFile(vscode.Uri.file(folder + fileEnum.containerscss(upperName)), Buffer.from(template_1.template.containerscss(upperName)));
            yield vscode.workspace.fs.writeFile(vscode.Uri.file(folder + fileEnum.containerindex), Buffer.from(template_1.template.containerindex(upperName, lowerName)));
        }
        const snap6 = `${lowerName}: '${upperName.replace(/\B([A-Z])/g, ' $1')}',\n${space(4)}`;
        yield openFileAndInsertText(fileEnum.en, '// add action name here', snap6);
        const snap7 = `${lowerName}: '',\n${space(4)}`;
        yield openFileAndInsertText(fileEnum.zh, '// add action name here', snap7);
        yield openFileAndInsertText(fileEnum.zh_TW, '// add action name here', snap7);
        if (showDialog) {
            const snap8 = `${lowerName}: {\n${space(6)}title: '${upperName.replace(/\B([A-Z])/g, ' $1')}',\n${space(4)}},\n${space(4)}`;
            yield openFileAndInsertText(fileEnum.en, '// add action dialog here', snap8);
            const snap9 = `${lowerName}: {\n${space(6)}title: '',\n${space(4)}},\n${space(4)}`;
            yield openFileAndInsertText(fileEnum.zh, '// add action dialog here', snap9);
            yield openFileAndInsertText(fileEnum.zh_TW, '// add action dialog here', snap9);
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
                yield openFileAndInsertText(`${fileEnum.pivotCharts}/${def}.ts`, '// add action here', actionDef);
            }
            catch (error) {
                try {
                    yield openFileAndInsertText(`${fileEnum.slicers}/${def}.ts`, '// add action here', actionDef);
                }
                catch (error) {
                    if (def === 'spreadChart') {
                        actionDef = `{
	  	type: ActionDefNS.ActionType.${upperName},
		},\n${space(4)}`;
                        if (isExtensionAction) {
                            actionDef = `DVChartActions.${lowerName},\n${space(4)}`;
                        }
                    }
                    yield openFileAndInsertText(`${fileEnum.others}/${def}.ts`, '// add action here', actionDef);
                }
            }
        }
    }));
    // const detectChange = vscode.languages.registerCodeActionsProvider({ scheme: '*', language: '*' }, {
    // 	provideCodeActions(document, range, context, token) {
    // 		return [{ title: 'a', kind: 'a', tooltip: 'aaaa' }];
    // 	}
    // });
    context.subscriptions.push(hover);
    context.subscriptions.push(deleteAllBranch);
    context.subscriptions.push(addAction);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map