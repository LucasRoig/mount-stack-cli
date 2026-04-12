import fs from "node:fs/promises";
import { resolve } from "node:path";
import { updatePackage } from "pkg-types";
import { TEMPLATE_ROOT } from "../consts";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";

type PlaywrightInstallerArgs = {
  monoRepoInstaller: MonoRepoInstaller;
  appName: string;
};

export class PlaywrightInstaller {
  private rootPath: string;
  private readonly packageJsonPath: string;

  public static async create(args: PlaywrightInstallerArgs): Promise<PlaywrightInstaller> {
    const installer = new PlaywrightInstaller(args);
    await installer.init();
    return installer;
  }

  private constructor(private args: PlaywrightInstallerArgs) {
    this.rootPath = resolve(this.args.monoRepoInstaller.rootPath, "apps", this.args.appName);
    this.packageJsonPath = resolve(this.rootPath, "package.json");
  }

  private async init() {
    const templatePath = resolve(TEMPLATE_ROOT, "e2e/playwright/package");
    const targetPath = resolve(this.rootPath);
    await fs.cp(templatePath, targetPath, { recursive: true });

    await updatePackage(this.args.monoRepoInstaller.rootPackageJsonPath, (pkg) => {
      if (!pkg.scripts) {
        pkg.scripts = {};
      }
      pkg.scripts["e2e:test"] = `pnpm --dir=apps/${this.args.appName} test`;
      pkg.scripts["e2e:dev"] = `pnpm --dir=apps/${this.args.appName} dev`;
    });

    await updatePackage(this.packageJsonPath, (pkg) => {
      if (!pkg.devDependencies) {
        pkg.devDependencies = {};
      }
      pkg.devDependencies["@playwright/test"] = Versions["@playwright/test"];
      pkg.devDependencies.dotenv = Versions.dotenv;
      pkg.devDependencies["@types/node"] = Versions["@types/node"];
      pkg.devDependencies.typescript = Versions.typescript;
    });
  }
}
