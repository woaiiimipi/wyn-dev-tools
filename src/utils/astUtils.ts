import { parseAndGenerateServices, AST_NODE_TYPES, AST, parse } from '@typescript-eslint/typescript-estree';
import { Position } from 'vscode';

export const getAst = (code: string) => {
  const result = parseAndGenerateServices(code, { jsx: true, loc: true });
  return result.ast;
};
export const getStatementLocByAst = (ast: AST<{}>, data: { id: string, nodeType: AST_NODE_TYPES, position: any }) => {
  ast.body.forEach((item: any) => {
    if (data.position) {
      return;
    }
    if (item.type === data.nodeType) {
      if (item.name === data.nodeType) {
        data.position = new Position(item.loc.start.line, 0);
        return;
      }
    }
    const children = item.body;
    if (children) {
      children.body.forEach((child: any) => {
        getStatementLocByAst(child, data);
      });
    }
  });
  
};
type GetStatementLocByAstData = {
  id: string,
  nodeType: AST_NODE_TYPES,
  position: Position | null,
};
export const getStatementPosition = (code: string, id: string, nodeType: AST_NODE_TYPES) => {
  const ast = getAst(code);
  const data: GetStatementLocByAstData = {
    id,
    nodeType,
    position: null,
  };
  getStatementLocByAst(ast, data);
  return data.position;
};
