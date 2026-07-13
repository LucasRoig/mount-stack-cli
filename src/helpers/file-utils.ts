import fs from "node:fs/promises";

export async function exists(path: string) {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function createFileIfNotExists(path: string) {
  if (!(await exists(path))) {
    await fs.writeFile(path, "", { encoding: "utf-8" });
  }
}
