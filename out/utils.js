"use strict";
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
const enums_1 = require("./enums");
exports.openFileAndInsertText = (fileName, findText, insertText) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield vscode.workspace.openTextDocument(fileName);
    const content = doc.getText();
    const offset = content.indexOf(findText);
    const position = doc.positionAt(offset);
    const editor = yield vscode.window.showTextDocument(doc, 1, false);
    yield editor.edit(e => {
        e.insert(position, insertText);
    });
});
exports.getFile = (fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield vscode.workspace.openTextDocument(fileName);
    return doc;
});
exports.getFileText = (fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield exports.getFile(fileName);
    return doc.getText();
});
exports.openFileAndInsertTexts = (fileInsetInfos) => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < fileInsetInfos.length; i++) {
        const { fileName, findText, insertText } = fileInsetInfos[i];
        yield exports.openFileAndInsertText(fileName, findText, insertText);
    }
});
exports.space = (count) => ' '.repeat(count);
exports.createFile = (path, content) => __awaiter(void 0, void 0, void 0, function* () {
    yield vscode.workspace.fs.writeFile(vscode.Uri.file(path), Buffer.from(content));
});
exports.createFiles = (fileInfos) => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < fileInfos.length; i++) {
        const { path, content } = fileInfos[i];
        yield exports.createFile(path, content);
    }
});
exports.addActionForDefFiles = (selectedScenarios, upperName, lowerName, isExtensionAction) => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < selectedScenarios.length; i++) {
        const def = selectedScenarios[i].label;
        let actionDef = `{
${exports.space(8)}type: ActionDefNS.ActionType.${upperName},
${exports.space(6)}},\n${exports.space(6)}`;
        if (isExtensionAction) {
            actionDef = `DVChartActions.${lowerName},\n${exports.space(6)}`;
        }
        try {
            yield exports.openFileAndInsertText(`${enums_1.fileEnum.pivotCharts}/${def}.ts`, '// add action here', actionDef);
        }
        catch (error) {
            try {
                yield exports.openFileAndInsertText(`${enums_1.fileEnum.slicers}/${def}.ts`, '// add action here', actionDef);
            }
            catch (error) {
                if (def === 'spreadChart') {
                    actionDef = `{
${exports.space(6)}type: ActionDefNS.ActionType.${upperName},
${exports.space(4)}},\n${exports.space(4)}`;
                    if (isExtensionAction) {
                        actionDef = `DVChartActions.${lowerName},\n${exports.space(4)}`;
                    }
                }
                yield exports.openFileAndInsertText(`${enums_1.fileEnum.others}/${def}.ts`, '// add action here', actionDef);
            }
        }
    }
});
exports.getGit = () => simple_git_1.default(vscode.workspace.workspaceFolders[0].uri.fsPath);
exports.getCurrentFileName = () => {
    var _a;
    const editor = vscode.window.activeTextEditor;
    return (_a = editor) === null || _a === void 0 ? void 0 : _a.document.fileName;
};
exports.getParentFolderName = (name, separate) => {
    var _a, _b;
    const separateIndex = (_a = name) === null || _a === void 0 ? void 0 : _a.lastIndexOf(separate || '/');
    return (_b = name) === null || _b === void 0 ? void 0 : _b.slice(0, separateIndex);
};
exports.readDirectory = (fileName) => __awaiter(void 0, void 0, void 0, function* () { return vscode.workspace.fs.readDirectory(vscode.Uri.file(fileName)); });
exports.getParentFolder = (path) => {
    var _a, _b;
    const separateIndex = (_a = path) === null || _a === void 0 ? void 0 : _a.lastIndexOf('/');
    const parentFolder = (_b = path) === null || _b === void 0 ? void 0 : _b.slice(0, separateIndex);
    return parentFolder;
};
//# sourceMappingURL=utils.js.map