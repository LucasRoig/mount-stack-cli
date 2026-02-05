import fs from "node:fs/promises";
import { Project, type SourceFile } from "ts-morph";

export async function getSourceFile(filePath: string): Promise<SourceFile> {
  const project = new Project();

  const exists = await fs.stat(filePath).then(() => true).catch(() => false);
  if (exists) {
    return project.addSourceFileAtPath(filePath);
  }
  return project.createSourceFile(filePath, "", { overwrite: true });
}
