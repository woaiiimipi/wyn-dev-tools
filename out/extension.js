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
// @ts-ignore
const OpenCC = require("node-opencc");
const template_1 = require("./template");
const enums_1 = require("./enums");
const utils_1 = require("./utils");
const { showInputBox, showQuickPick, showInformationMessage } = vscode.window;
const { registerCommand } = vscode.commands;
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
    const deleteAllBranch = registerCommand('extension.deleteAllBranch', () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // @ts-ignore
            const git = utils_1.getGit();
            const data = yield git.branchLocal();
            const regex = new RegExp(`release|develop|${data.current}`);
            const items = data.all.map((branch) => ({ label: branch, picked: !regex.test(branch) }));
            const result = yield vscode.window.showQuickPick(items, { canPickMany: true, ignoreFocusOut: true });
            if (!((_a = result) === null || _a === void 0 ? void 0 : _a.length)) {
                return;
            }
            const deleteBranches = result.map(i => i.label);
            if (deleteBranches.includes(data.current)) {
                const existBranch = (_b = items.find(i => !i.picked)) === null || _b === void 0 ? void 0 : _b.label;
                yield git.checkout(existBranch);
                showInformationMessage(`Your branch has checkout to branch <${existBranch}>.`);
            }
            yield git.deleteLocalBranches(deleteBranches, true);
            showInformationMessage('^-^:Delete branches success!');
        }
        catch (error) {
            vscode.window.showErrorMessage('~_~: Delete branches failed! The git register must have at least one branch.');
        }
    }));
    const addAction = registerCommand('extension.addAction', () => __awaiter(this, void 0, void 0, function* () {
        var _c;
        const actionName = yield showInputBox({ placeHolder: '请输入action名称' });
        const preItems = [
            { label: 'pivotCharts', picked: true },
            { label: 'richEditor', },
            { label: 'picture', },
            { label: 'container', },
            { label: 'tabContainer' },
            { label: 'slicer' },
            { label: 'spreadChart' },
            { label: 'webContent' },
        ];
        const preResult = yield showQuickPick(preItems, { canPickMany: true, ignoreFocusOut: true, placeHolder: '请选择需要应用的Scenario类型' });
        const preResultList = (_c = preResult) === null || _c === void 0 ? void 0 : _c.map(i => i.label);
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
            const snapAddExtension = `case ActionDefNS.ExtensionType.${upperName}: {\n${utils_1.space(10)}return${showDialog ? showDialogLogic : ';'}${utils_1.space(8)}}\n${utils_1.space(8)}`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionBarUtils, '// add extension action handler here', snapAddExtension);
        }
        else {
            const showDialogLogic = ` showActiveDialog(show${upperName}Dialog, ActionMenuType.${upperName}, position, descriptor, scenario, dispatch);`;
            const snap2 = `case ActionMenuType.${upperName}: {\n${utils_1.space(6)}return${showDialog ? showDialogLogic : ';'}\n${utils_1.space(4)}}\n${utils_1.space(2)}`;
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionBarUtils, '// add action handler here', snap2);
        }
        const snap3 = `${upperName}Action,\n${utils_1.space(2)}`;
        if (!isExtensionAction) {
            yield utils_1.openFileAndInsertText(enums_1.fileEnum.ActionExecutor, '// import action here', snap3);
        }
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
    const zhToTw = registerCommand('extension.zhTw', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        const result = OpenCC.simplifiedToTaiwanWithPhrases(text);
        const simple = yield vscode.window.showInputBox({ value: result || '' });
        if (!simple) {
            return;
        }
        console.log(simple);
        // simple.replace(/ /g, '');
        yield vscode.window.showInputBox({ value: OpenCC.simplifiedToTaiwanWithPhrases(simple) });
    }));
    const pushToOrigin = registerCommand('extension.pushToOrigin', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const git = utils_1.getGit();
            yield git.add('.');
            const commitMsg = yield vscode.window.showInputBox({ value: 'fix', prompt: 'Please input commit message.' });
            yield git.commit(commitMsg || '');
            yield git.push();
        }
        catch (error) {
            showInformationMessage(error);
        }
    }));
    const importScssToMain = vscode.commands.registerCommand('extension.importScssToMain', () => __awaiter(this, void 0, void 0, function* () {
        var _d, _e, _f;
        const findMainScss = (folderName, data) => __awaiter(this, void 0, void 0, function* () {
            const files = yield utils_1.readDirectory(folderName);
            const fileNames = files.map(i => i[0].replace(/\\/g, '/'));
            const mainScss = fileNames.find(i => i.includes('main.scss'));
            if (mainScss) {
                if (!data.mainScss) {
                    data.mainScss = mainScss;
                    data.folder = folderName;
                    return Promise.resolve();
                }
            }
            const newFolderName = utils_1.getParentFolderName(folderName);
            if (newFolderName.endsWith('frontend')) {
                return Promise.resolve();
            }
            return yield findMainScss(newFolderName, data);
        });
        const curFile = (_d = utils_1.getCurrentFileName()) === null || _d === void 0 ? void 0 : _d.replace(/\\/g, '/');
        if (!((_e = curFile) === null || _e === void 0 ? void 0 : _e.endsWith('scss'))) {
            return;
        }
        const parentFolder = utils_1.getParentFolderName(curFile);
        const data = { mainScss: '', folder: '' };
        yield findMainScss(parentFolder, data);
        if (!data.mainScss) {
            return;
        }
        const relativePath = (_f = curFile) === null || _f === void 0 ? void 0 : _f.replace(utils_1.getParentFolderName(data.folder + '/' + data.mainScss), '');
        const importContent = `@import '.${relativePath}';`;
        let similarLineIndex = -1;
        const findSimilarLine = (fileContent, text) => {
            if (similarLineIndex !== -1) {
                return;
            }
            const index = fileContent.lastIndexOf(text);
            if (index !== -1) {
                similarLineIndex = index;
                return;
            }
            const newFolder = utils_1.getParentFolderName(text);
            if (!newFolder.includes('/')) {
                return;
            }
            findSimilarLine(fileContent, newFolder);
        };
        const mainScss = yield utils_1.getFile(data.folder + '/' + data.mainScss);
        findSimilarLine(mainScss.getText(), utils_1.getParentFolderName(relativePath));
        const editor = yield vscode.window.showTextDocument(mainScss, 1, false);
        yield editor.edit(e => {
            if (similarLineIndex !== -1) {
                const position = new vscode.Position(mainScss.positionAt(similarLineIndex).line + 1, 0);
                e.insert(position, importContent + '\n');
            }
            else {
                e.insert(new vscode.Position(mainScss.eol, 0), importContent);
            }
        });
    }));
    context.subscriptions.push(hover, deleteAllBranch, addAction, zhToTw, pushToOrigin, importScssToMain);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map