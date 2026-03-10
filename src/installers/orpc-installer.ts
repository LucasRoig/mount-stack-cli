import fs from "node:fs/promises";
import path from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type OrpcInstallerCreateArgs = {
  monoRepoInstaller: MonoRepoInstaller;
};

export class OrpcInstaller {
  public static async create(args: OrpcInstallerCreateArgs): Promise<OrpcInstaller> {
    const installer = new OrpcInstaller();
    await installer.init(args);
    return installer;
  }

  private constructor() {}

  private async init(args: OrpcInstallerCreateArgs) {
    const packageInstaller = await TurboPackageInstaller.create({
      name: "api",
      subPath: "api",
      packageKind: "PACKAGE_WITH_BUILD",
      monoRepoInstaller: args.monoRepoInstaller,
    });

    await packageInstaller.addDevDependencyToPackageJson("typescript", Versions.typescript);
    await packageInstaller.addDependencyToPackageJson("@orpc/server", Versions["@orpc/server"]);
    await packageInstaller.addDependencyToPackageJson("zod", Versions.zod);
    await packageInstaller.addDependencyToPackageJson("neverthrow", Versions.neverthrow);
    await packageInstaller.addDependencyToPackageJson("@logtape/logtape", Versions["@logtape/logtape"]);
    await packageInstaller.addDependencyToPackageJson("@repo/database", "workspace:*");

    const templateDir = path.resolve(TEMPLATE_ROOT, "orpc", "package");
    await fs.cp(templateDir, packageInstaller.path, { recursive: true });
  }
}
