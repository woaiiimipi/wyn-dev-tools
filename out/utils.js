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
      type: ActionDefNS.ActionType.${upperName},
    },\n${exports.space(6)}`;
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
    type: ActionDefNS.ActionType.${upperName},
  },\n${exports.space(4)}`;
                    if (isExtensionAction) {
                        actionDef = `DVChartActions.${lowerName},\n${exports.space(4)}`;
                    }
                }
                yield exports.openFileAndInsertText(`${enums_1.fileEnum.others}/${def}.ts`, '// add action here', actionDef);
            }
        }
    }
});
//# sourceMappingURL=utils.js.map