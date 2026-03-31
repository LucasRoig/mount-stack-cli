import fs from "node:fs/promises";
import path from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type CaslInstallerCreateArgs = {
  monoRepoInstaller: MonoRepoInstaller;
};

export class CaslInstaller {
  private package: TurboPackageInstaller | undefined;

  public static async create(args: CaslInstallerCreateArgs) {
    const installer = new CaslInstaller();
    await installer.init(args);
    return installer;
  }

  private constructor() {}

  private async init(args: CaslInstallerCreateArgs) {
    this.package = await TurboPackageInstaller.create({
      name: "rbac",
      subPath: "rbac",
      packageKind: "PACKAGE_WITH_BUILD",
      monoRepoInstaller: args.monoRepoInstaller,
    });

    await this.package.addDevDependencyToPackageJson("typescript", Versions.typescript);
    await this.package.addDependencyToPackageJson("@casl/ability", Versions["@casl/ability"]);
    await this.package.addDependencyToPackageJson("@repo/database", "workspace:*");
    await this.package.addDependencyToPackageJson("@repo/ts-utils", "workspace:*");
    await this.package.addDependencyToPackageJson("drizzle-orm", Versions["drizzle-orm"]);

    const templatePath = path.resolve(TEMPLATE_ROOT, "casl", "package");
    await fs.cp(templatePath, this.package.path, { recursive: true });
  }
}
