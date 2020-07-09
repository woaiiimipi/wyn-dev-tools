declare namespace Def {
  export type InsertFileInfo = {
    fileName: string,
    findText: string,
    insertText: string,
  };

  export type FileInfo = {
    path: string;
    content: string;
  };
}