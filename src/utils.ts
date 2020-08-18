import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { fileEnum } from './enums';
export const openFileAndInsertText = async (fileName: string, findText: string, insertText: string, position?: vscode.Position) => {
  let insertPosition = position;
  const doc = await vscode.workspace.openTextDocument(fileName);
  const content = doc.getText();
  if (!insertPosition) {
    const offset = content.indexOf(findText);
    insertPosition = doc.positionAt(offset);
  }
  const editor = await vscode.window.showTextDocument(doc, 1, false);
  await editor.edit(e => {
    e.insert(insertPosition!, insertText);
  });
};

export const getFile = async (fileName: string) => {
  const doc = await vscode.workspace.openTextDocument(fileName);
  return doc;
};
export const getFileText = async (fileName: string) => {
  const doc = await getFile(fileName);
  return doc.getText();
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

export const addActionForDefFiles = async (selectedScenarios: vscode.QuickPickItem[], upperName: string, lowerName: string, isExtensionAction: boolean,) => {
  for (let i = 0; i < selectedScenarios.length; i++) {
    const def = selectedScenarios[i].label;
    let actionDef = `{
${space(8)}type: ActionDefNS.ActionType.${upperName},
${space(6)}},\n${space(6)}`;
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
${space(6)}type: ActionDefNS.ActionType.${upperName},
${space(4)}},\n${space(4)}`;
          if (isExtensionAction) {
            actionDef = `DVChartActions.${lowerName},\n${space(4)}`;
          }
        }
        await openFileAndInsertText(`${fileEnum.others}/${def}.ts`, '// add action here', actionDef);
      }
    }
  }
};

export const getGit = () => simpleGit(vscode.workspace.workspaceFolders![0].uri.fsPath);

export const getCurrentFileName = () => {
  const editor = vscode.window.activeTextEditor;
  return editor?.document.fileName;
};
export const getParentFolderName = (name: string, separate?: string) => {
  const separateIndex = name?.lastIndexOf(separate || '/');
  return name?.slice(0, separateIndex);
};
export const readDirectory = async (fileName: string) => vscode.workspace.fs.readDirectory(vscode.Uri.file(fileName));

export const getParentFolder = (path: string) => {
  const separateIndex = path?.lastIndexOf('/');
  const parentFolder = path?.slice(0, separateIndex);
  return parentFolder;
};

export const getHeadSpaceCount = (s: string) => {
  return s.length - s.trimLeft().length;
};
