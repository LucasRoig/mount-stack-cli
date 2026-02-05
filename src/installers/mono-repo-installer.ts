import fs from "node:fs/promises";
import { resolve } from "node:path";

export class MonoRepoInstaller {
  public readonly rootPath: string;
  private justfilePath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.justfilePath = resolve(rootPath, "justfile");
  }

  public async justfileExists(): Promise<boolean> {
    return await fs
      .stat(this.justfilePath)
      .then(() => true)
      .catch(() => false);
  }

  public async createJustfile() {
    const exists = await this.justfileExists();
    if (!exists) {
      await fs.writeFile(this.justfilePath, "set positional-arguments\n", "utf8");
    }
  }

  public async appendToJustfile(content: string) {
    await fs.appendFile(this.justfilePath, content, "utf8");
  }
}
