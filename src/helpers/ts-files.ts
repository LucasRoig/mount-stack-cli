import { Project, type SourceFile } from "ts-morph";
import * as FileUtils from "./file-utils";
export async function getSourceFile(filePath: string): Promise<SourceFile> {
  const project = new Project();

  if (await FileUtils.exists(filePath)) {
    return project.addSourceFileAtPath(filePath);
  }
  return project.createSourceFile(filePath, "", { overwrite: true });
}
