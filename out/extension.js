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
// @ts-ignore
const translate_1 = require("translate");
const template_1 = require("./template");
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
        console.log(translate_1.default);
        const text = yield translate_1.default.translate('Hello World', 'zh');
        if (text) {
            vscode.window.showInformationMessage(text);
            return;
        }
        const path = vscode.workspace.rootPath + '/test.ts';
        const actionName = yield vscode.window.showInputBox({ placeHolder: '请输入action名称' });
        const scenarioMap = {
            pivotCharts: (picked) => [
                { label: 'column', picked },
                { label: 'bar', picked },
                { label: 'area', picked },
            ],
            richEditor: (picked) => [
                { label: 'richEditor', picked },
            ],
            picture: (picked) => [
                { label: 'picture', picked },
            ],
            slicer: (picked) => [
                { label: 'tree', picked },
                { label: 'dateRange', picked },
                { label: 'comboBox', picked },
                { label: 'label', picked },
                { label: 'relativeDate', picked },
                { label: 'dataRange', picked },
            ],
            container: (picked) => [
                { label: 'container', picked },
            ],
            tabContainer: (picked) => [
                { label: 'tabContainer', picked },
            ],
            spreadChart: (picked) => [
                { label: 'spreadChart', picked },
            ],
        };
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
        const items = ['pivotCharts', 'richEditor', 'picture', 'container', 'tabContainer', 'slicer', 'spreadChart'].reduce((acc, key) => {
            // @ts-ignore
            return acc.concat(scenarioMap[key](preResultList.includes(key)));
        }, []);
        const selectedScenarios = yield vscode.window.showQuickPick(items, { canPickMany: true, ignoreFocusOut: true, placeHolder: '确认子项' });
        const isExtensionAction = yield vscode.window.showQuickPick(['No', 'Yes'], { ignoreFocusOut: true, placeHolder: '是否是Extension类型的Action?' });
        const root = vscode.workspace.rootPath;
        const fileEnum = {
            'Action': root + '/src/common/core/visual/interfaces/Action.ts',
            'Enum': root + '/src/common/interfaces/Enums.ts',
            'ActionBarUtils': root + '/src/pcBrowser/runTime/scenario/actionBar/utils/ActionBarUtils.ts',
            'ActionExecutor': root + '/src/common/core/visual/visualDef/interaction/ActionExecutor.ts',
            'ActionIndex': root + '/src/common/core/visual/visualDef/interaction/actions/index.ts',
            'ActionTemplate': (actionName) => `${root}/src/common/core/visual/visualDef/interaction/actions/${actionName}Action.ts`
        };
        if (!actionName) {
            return;
        }
        const upperName = `${actionName.charAt(0).toUpperCase()}${actionName.slice(1)}`;
        const lowerName = `${actionName.charAt(0).toLowerCase()}${actionName.slice(1)}`;
        const snap1 = `${upperName} = '${lowerName}',\n`;
        yield openFileAndInsertText(fileEnum.Action, '// add action type here', snap1);
        yield openFileAndInsertText(fileEnum.Enum, '// add action menu type here', snap1);
        const snap2 = `case ActionMenuType.${upperName}: {\n${space(6)}return;\n${space(4)}}\n`;
        yield openFileAndInsertText(fileEnum.ActionBarUtils, '// add action handler here', snap2);
        const snap3 = `${upperName}Action,\n`;
        yield openFileAndInsertText(fileEnum.ActionExecutor, '// import action here', snap3);
        const snap4 = `case ActionType.${upperName}:\n${space(8)}list = [new ${upperName}Action()];\n${space(8)}break;\n`;
        yield openFileAndInsertText(fileEnum.ActionExecutor, '// create action here', snap4);
        const snap5 = `import ${upperName}Action from './${upperName}Action;\n`;
        yield openFileAndInsertText(fileEnum.ActionIndex, '// import action here', snap5);
        yield openFileAndInsertText(fileEnum.ActionIndex, '// export action here', snap3);
        const content1 = Buffer.from(template_1.template.action(lowerName, upperName));
        yield vscode.workspace.fs.writeFile(vscode.Uri.file(fileEnum.ActionTemplate(upperName)), content1);
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