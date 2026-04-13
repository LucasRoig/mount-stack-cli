import { type JsxElement, type SourceFile, ts } from "ts-morph";
import { getSourceFile } from "./ts-files";

export class NextLayoutFile {
  private file: SourceFile;

  public static async fromPath(path: string): Promise<NextLayoutFile> {
    const file = await getSourceFile(path);
    const instance = new NextLayoutFile(file);
    return instance;
  }

  private constructor(file: SourceFile) {
    this.file = file;
  }

  private getLayoutFunction() {
    const layoutFunction = this.file.getFunctions().find((fn) => fn.isDefaultExport());
    if (layoutFunction === undefined) {
      throw new Error("Error while adding env file management: Default exported function not found in layout.tsx");
    }
    return layoutFunction;
  }

  public addImportDeclaration(importDeclaration: Parameters<SourceFile["addImportDeclaration"]>[0]) {
    this.file.addImportDeclaration(importDeclaration);
  }

  public addVariableDeclarationInLayoutFunction(
    index: number,
    variableDeclaration: Parameters<SourceFile["insertVariableStatement"]>[1],
  ) {
    const layoutFunction = this.getLayoutFunction();
    layoutFunction.getFirstChildByKindOrThrow(ts.SyntaxKind.Block).insertVariableStatement(index, variableDeclaration);
  }

  private getChildrenJsxElement() {
    const layoutFunction = this.getLayoutFunction();
    const jsxExpressions = layoutFunction
      .getBodyOrThrow()
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ReturnStatement)
      .getDescendantsOfKind(ts.SyntaxKind.JsxExpression);
    for (const jsxExpression of jsxExpressions) {
      const text = jsxExpression.getText();
      if (text.match(/.*\{\s*children\s*\}.*/)) {
        const parent = jsxExpression.getParent() as JsxElement;
        return { element: parent, currentBody: parent.getJsxChildren().map((c) => c.getText()).join("\n") };
      }
    }
    throw new Error("Error: Children JSX element not found in layout.tsx");
  }

  public wrapChildrenWithComponent(openingTag: `<${string}>`, closingTag: `</${string}>`) {
    const { element, currentBody } = this.getChildrenJsxElement();
    element.setBodyText(`${openingTag}${currentBody}${closingTag}`);
  }

  public addComponentBeforeChildren(component: `<${string}/>`) {
    const { element, currentBody } = this.getChildrenJsxElement();
    element.setBodyText(`${component}${currentBody}`);

  }

  public async save() {
    this.file.formatText();
    await this.file.save();
  }
}
