import fs from "node:fs/promises";
import { parseYAML, stringifyYAML } from "confbox";

async function writeYamlFile(filePath: string, data: Record<string, unknown>): Promise<void> {
  const content = stringifyYAML(data);
  await fs.writeFile(filePath, content, "utf8");
}

async function readYamlFile(filePath: string): Promise<Record<string, unknown>> {
  const blob = await fs.readFile(filePath, "utf8");
  const parsed = parseYAML(blob);
  return parsed as Record<string, unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic JSON updater
export async function updateYamlFile(filePath: string, updater: (data: any) => Promise<void> | void): Promise<void> {
  let data = await readYamlFile(filePath);
  if (data === undefined || data === null) {
    data = {};
  }
  await updater(data);
  await writeYamlFile(filePath, data);
}
