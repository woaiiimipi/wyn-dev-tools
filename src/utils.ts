import * as vscode from 'vscode';
import { fileEnum } from './enums';
export const openFileAndInsertText = async (fileName: string, findText: string, insertText: string) => {
	const doc = await vscode.workspace.openTextDocument(fileName);
	const content = doc.getText();
	const offset = content.indexOf(findText);
	const position = doc.positionAt(offset);
	const editor = await vscode.window.showTextDocument(doc, 1, false);
	await editor.edit(e => {
		e.insert(position, insertText);
	});
};

export const openFileAndInsertTexts = async (fileInsetInfos: Def.InsertFileInfo[]) => {
  for (let i = 0; i < fileInsetInfos.length; i++) {
    const { fileName, findText, insertText } = fileInsetInfos[i];
    await openFileAndInsertText(fileName, findText, insertText);
  }
};
export const space = (count: number) => ' '.repeat(count);
export const createFile = async (path: string, content: string) => {
	await vscode.workspace.fs.writeFile(vscode.Uri.file(path), Buffer.from(content));
};

export const createFiles = async (fileInfos: Def.FileInfo[]) => {
  for (let i = 0; i < fileInfos.length; i++) {
    const { path, content } = fileInfos[i];
    await createFile(path, content);
  }
};

export const addActionForDefFiles = async (selectedScenarios: vscode.QuickPickItem[], upperName: string, lowerName: string, isExtensionAction: boolean, ) => {
  for (let i = 0; i < selectedScenarios.length; i++) {
    const def = selectedScenarios[i].label;
    let actionDef = `{
${space(6)}type: ActionDefNS.ActionType.${upperName},
${space(4)}},\n${space(6)}`;
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
${space(4)}type: ActionDefNS.ActionType.${upperName},
${space(2)}},\n${space(4)}`;
          if (isExtensionAction) {
            actionDef = `DVChartActions.${lowerName},\n${space(4)}`;
          }
        }
        await openFileAndInsertText(`${fileEnum.others}/${def}.ts`, '// add action here', actionDef);
      }
    }
  }
};