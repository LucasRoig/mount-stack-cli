import fs from "node:fs/promises";
export async function replaceTextInFile(
  filePath: string,
  searchValue: string | RegExp,
  replaceValue: string,
): Promise<void> {
  const content = await fs.readFile(filePath, "utf8");
  const updatedContent = content.replace(searchValue, replaceValue);
  await fs.writeFile(filePath, updatedContent, "utf8");
}

export async function insertAfterTextInFile(
  filePath: string,
  searchValue: string | RegExp,
  insertValue: string,
): Promise<void> {
  const content = await fs.readFile(filePath, "utf8");
  const updatedContent = content.replace(searchValue, (match) => `${match}${insertValue}`);
  await fs.writeFile(filePath, updatedContent, "utf8");
}
