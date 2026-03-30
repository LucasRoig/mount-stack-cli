import fs from "node:fs/promises";
import path from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type TsUtilsInstallerOptions = {
  monoRepoInstaller: MonoRepoInstaller;
};

export class TsUtilsInstaller {
  public static async create(args: TsUtilsInstallerOptions): Promise<TsUtilsInstaller> {
    const installer = new TsUtilsInstaller();
    await installer.init(args);
    return installer;
  }

  private constructor() {}

  private async init(args: TsUtilsInstallerOptions) {
    const packageInstaller = await TurboPackageInstaller.create({
      name: "ts-utils",
      subPath: "ts-utils",
      packageKind: "PACKAGE_WITH_BUILD",
      monoRepoInstaller: args.monoRepoInstaller,
    });

    await packageInstaller.addDevDependencyToPackageJson("typescript", Versions.typescript);
    await packageInstaller.addDevDependencyToPackageJson("vitest", Versions.vitest);
    await packageInstaller.addScriptToPackageJson("test", "vitest run");

    const packageTemplateDir = path.resolve(TEMPLATE_ROOT, "ts-utils");
    await fs.cp(packageTemplateDir, packageInstaller.path, { recursive: true });
  }
}
