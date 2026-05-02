import { type SourceFile, ts } from "ts-morph";
import { getSourceFile } from "./ts-files";

export class NextConfigFile {
  private file: SourceFile;

  public static async fromPath(path: string): Promise<NextConfigFile> {
    const file = await getSourceFile(path);
    const instance = new NextConfigFile(file);
    return instance;
  }

  private constructor(file: SourceFile) {
    this.file = file;
  }

  public getNextConfigObject() {
    return this.file
      .getVariableDeclarationOrThrow("nextConfig")
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
  }

  public addImportDeclaration(importDeclaration: Parameters<SourceFile["addImportDeclaration"]>[0]) {
    this.file.addImportDeclaration(importDeclaration);
  }

  public async save() {
    this.file.formatText();
    await this.file.save();
  }
}
