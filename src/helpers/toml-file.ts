import fs from "node:fs/promises";
import { parseTOML, stringifyTOML } from "confbox";
import { createFileIfNotExists } from "./file-utils";

async function writeTomlFile(filePath: string, data: Record<string, unknown>): Promise<void> {
  const content = stringifyTOML(data);
  await fs.writeFile(filePath, content, "utf8");
}

async function readTomlFile(filePath: string): Promise<Record<string, unknown>> {
  const blob = await fs.readFile(filePath, "utf8");
  const parsed = parseTOML(blob);
  return parsed as Record<string, unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic JSON updater
export async function updateTomlFile(filePath: string, updater: (data: any) => Promise<void> | void): Promise<void> {
  await createFileIfNotExists(filePath);
  let data = await readTomlFile(filePath);
  if (data === undefined || data === null) {
    data = {};
  }
  await updater(data);
  await writeTomlFile(filePath, data);
}
