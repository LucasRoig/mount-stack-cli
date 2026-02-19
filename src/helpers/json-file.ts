import fs from "node:fs/promises";
import { parseJSON, stringifyJSON } from "confbox";

async function writeJsonFile(filePath: string, data: Record<string, unknown>): Promise<void> {
  const content = stringifyJSON(data);
  await fs.writeFile(filePath, content, "utf8");
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown>> {
  const blob = await fs.readFile(filePath, "utf8");
  const parsed = parseJSON(blob);
  return parsed as Record<string, unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic JSON updater
export async function updateJsonFile(filePath: string, updater: (data: any) => Promise<void> | void): Promise<void> {
  const data = await readJsonFile(filePath);
  await updater(data);
  await writeJsonFile(filePath, data);
}
