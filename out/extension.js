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
const utils_1 = require("./utils");
const { showInputBox, showQuickPick } = vscode.window;
function activate(context) {
    const hover = vscode.languages.registerHoverProvider({ scheme: '*', language: '*' }, {
        provideHover(document, position, token) {
            const hoveredWord = document.getText(document.getWordRangeAtPosition(position));
            const config = vscode.workspace.getConfiguration();
            const hoverMappingResult = config.get('hoverMapping')[hoveredWord].split('\n');
            return {
                contents: [...hoverMappingResult],
            };
        }
    });
    const deleteAllBranch = vscode.commands.registerCommand('extension.deleteAllBranch', () => {
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
    const addAction = vscode.commands.registerCommand('extension.addAction', () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const actionName = yield showInputBox({ placeHolder: '请输入action名称' });
        const preItems = [
            { label: 'pivotCharts', picked: true },
            { label: 'richEditor', },
            { label: 'picture', },
            { label: 'container', },
            { label: 'tabContainer' },
            { label: 'slicer' },
            { label: 'spreadChart' },
        ];
        const preResult = yield showQuickPick(preItems, { canPickMany: true, ignoreFocusOut: true, placeHolder: '请选择需要应用的Scenario类型' });
        const preResultList = (_a = preResult) === null || _a === void 0 ? void 0 : _a.map(i => i.label);
        const items = Object.keys(enums_1.scenarioMap).reduce((acc, key) => {
            // @ts-ignore
            return acc.concat(enums_1.scenarioMap[key](preResultList.includes(key)));
        }, []);
        const selectedScenarios = yield showQuickPick(items, { canPickMany: true, ignoreFocusOut: true, placeHolder: '确认子项' });
        const isExtensionAction = (yield showQuickPick(['No', 'Yes'], { ignoreFocusOut: true, placeHolder: '是否是Extension类型的Action?' })) === 'Yes';
        const showDialog = (yield showQuickPick(['Yes', 'No'], { ignoreFocusOut: true, placeHolder: '是否显示Dialog?' })) === 'Yes';
        if (!actionName) {
            return;
        }
        const upperName = `${actionName.charAt(0).toUpperCase()}${actionName.slice(1)}`;
        const lowerName = `${actionName.charAt(0).toLowerCase()}${actionName.slice(1)}`;
        if (isExtensionAction) {
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.Action, '// add extension action type here', `${upperName} = '_${lowerName}',\n${utils_1.space(4)}`);
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.commonActions, '// add extension action here', template_1.template.extensionCommonAction(upperName, lowerName));
        }
        else {
            const snap1 = `${upperName} = '${lowerName}',\n${utils_1.space(4)}`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.Action, '// add action type here', snap1);
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.Enum, '// add action menu type here', snap1);
        }
        if (showDialog) {
            const snap22 = `import { show${upperName}Dialog } from '../../dataAnalyze/${upperName}/index';\n`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionBarUtils, '// import show dialog', snap22);
        }
        if (isExtensionAction) {
            const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionDefNS.ExtensionType.${upperName}, position, descriptor, scenario, dispatch);`;
            const snapAddExtension = `case ActionDefNS.ExtensionType.${upperName}: {
          return${showDialog ? showDialogLogic : ';'};
		    }
		  	`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionBarUtils, '// add extension action handler here', snapAddExtension);
        }
        else {
            const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionMenuType.${upperName}, position, descriptor, scenario, dispatch);`;
            const snap2 = `case ActionMenuType.${upperName}: {\n${utils_1.space(6)}return${showDialog ? showDialogLogic : ';'}\n${utils_1.space(4)}}\n${utils_1.space(2)}`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionBarUtils, '// add action handler here', snap2);
        }
        const snap3 = `${upperName}Action,\n${utils_1.space(2)}`;
        yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionExecutor, '// import action here', snap3);
        if (!isExtensionAction) {
            const snap4 = `case ActionType.${upperName}:\n${utils_1.space(8)}list = [new ${upperName}Action(def)];\n${utils_1.space(8)}break;\n${utils_1.space(6)}`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionExecutor, '// create action here', snap4);
        }
        const snap5 = `import ${upperName}Action from './${upperName}Action';\n`;
        yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionIndex, '// import action here', snap5);
        yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionIndex, '// export action here', snap3);
        yield utils_1.createFile(enums_1.fileEnum.ActionTemplate(upperName), template_1.template.action(lowerName, upperName));
        if (showDialog) {
            const folder = enums_1.fileEnum.DataAnalyzeFolder(lowerName);
            yield vscode.workspace.fs.createDirectory(vscode.Uri.file(folder));
            yield utils_1.createFile(folder + enums_1.fileEnum.containerts(upperName), template_1.template.containerts(upperName));
            yield utils_1.createFile(folder + enums_1.fileEnum.containerscss(upperName), template_1.template.containerscss(upperName));
            yield utils_1.createFile(folder + enums_1.fileEnum.containerindex, template_1.template.containerindex(upperName, lowerName));
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.mainScss, '// add import here', `@import './scenario/dataAnalyze/${lowerName}/${upperName}Container.scss';\n`);
        }
        const snap6 = `${lowerName}: '${upperName.replace(/\B([A-Z])/g, ' $1')}',\n${utils_1.space(4)}`;
        yield utils_1.openFileAndInsertText(enums_1.fileEnum.en, '// add action name here', snap6);
        const snap7 = `${lowerName}: '',\n${utils_1.space(4)}`;
        yield utils_1.openFileAndInsertText(enums_1.fileEnum.zh, '// add action name here', snap7);
        yield utils_1.openFileAndInsertText(enums_1.fileEnum.zh_TW, '// add action name here', snap7);
        if (showDialog) {
            const snap8 = `${lowerName}: {\n${utils_1.space(6)}title: '${upperName.replace(/\B([A-Z])/g, ' $1')}',\n${utils_1.space(4)}},\n${utils_1.space(4)}`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.en, '// add action dialog here', snap8);
            const snap9 = `${lowerName}: {\n${utils_1.space(6)}title: '',\n${utils_1.space(4)}},\n${utils_1.space(4)}`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.zh, '// add action dialog here', snap9);
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.zh_TW, '// add action dialog here', snap9);
        }
        if (!selectedScenarios) {
            return;
        }
        utils_1.addActionForDefFiles(selectedScenarios, upperName, lowerName, isExtensionAction);
    }));
    context.subscriptions.push(hover, deleteAllBranch, addAction);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map