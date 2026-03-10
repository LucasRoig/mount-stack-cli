import fs from "node:fs/promises";
import path from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import type { NextAppInstaller } from "./next-app-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type OrpcInstallerCreateArgs = {
  monoRepoInstaller: MonoRepoInstaller;
  nextAppInstaller: NextAppInstaller;
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

    const packageTemplateDir = path.resolve(TEMPLATE_ROOT, "orpc", "package");
    await fs.cp(packageTemplateDir, packageInstaller.path, { recursive: true });

    await args.nextAppInstaller.addDependencyToPackageJson("@repo/api", "workspace:*");
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/client", Versions["@orpc/client"]);
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/contract", Versions["@orpc/contract"]);
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/server", Versions["@orpc/server"]);
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/tanstack-query", Versions["@orpc/tanstack-query"]);

    const nextIntegrationTemplateDir = path.resolve(TEMPLATE_ROOT, "orpc", "integration-next");
    await fs.cp(nextIntegrationTemplateDir, args.nextAppInstaller.srcPath, { recursive: true });

    await args.nextAppInstaller.addLoggerDeclaration(["api"]);
  }
}
