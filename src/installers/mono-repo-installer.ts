import fs from "node:fs/promises";
import { resolve } from "node:path";

type MonoRepoInstallerArgs = {
  rootPath: string;
  appName: string;
};
export class MonoRepoInstaller {
  public readonly rootPath: string;
  public readonly packagesPath: string;
  public readonly appName: string;
  public readonly rootPackageJsonPath: string;
  private justfilePath: string;

  constructor(args: MonoRepoInstallerArgs) {
    this.rootPath = args.rootPath;
    this.appName = args.appName;
    this.rootPackageJsonPath = resolve(this.rootPath, "package.json");
    this.justfilePath = resolve(this.rootPath, "justfile");
    this.packagesPath = resolve(this.rootPath, "packages");
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
