import { type SourceFile, ts } from "ts-morph";
import { getSourceFile } from "./ts-files";

export class NextInstrumentationFile {
  private file: SourceFile;

  public static async fromPath(path: string): Promise<NextInstrumentationFile> {
    const file = await getSourceFile(path);
    const instance = new NextInstrumentationFile(file);
    return instance;
  }

  private constructor(file: SourceFile) {
    this.file = file;
  }

  private getRegisterFunction() {
    return this.file.getFunctionOrThrow("register").getFirstChildByKindOrThrow(ts.SyntaxKind.Block);
  }

  public addImportDeclaration(importDeclaration: Parameters<SourceFile["addImportDeclaration"]>[0]) {
    this.file.addImportDeclaration(importDeclaration);
  }

  public insertRootVariableStatement(
    index: number,
    variableStatement: Parameters<SourceFile["insertVariableStatement"]>[1],
  ) {
    this.file.insertVariableStatement(index, variableStatement);
  }

  public addStatementsToRegisterFunction(statements: Parameters<SourceFile["addStatements"]>[0]) {
    this.getRegisterFunction().addStatements(statements);
  }

  public async save() {
    this.file.formatText();
    await this.file.save();
  }
}
