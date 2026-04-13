import fs from "node:fs/promises";
import path from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import { getSourceFile } from "../helpers/ts-files";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import type { NextAppInstaller } from "./next-app-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type OrpcInstallerCreateArgs = {
  monoRepoInstaller: MonoRepoInstaller;
  nextAppInstaller: NextAppInstaller;
};

export class OrpcInstaller {
  private package: TurboPackageInstaller | undefined;

  public static async create(args: OrpcInstallerCreateArgs): Promise<OrpcInstaller> {
    const installer = new OrpcInstaller(args);
    await installer.init(args);
    return installer;
  }

  private constructor(private args: OrpcInstallerCreateArgs) { }

  private async init(args: OrpcInstallerCreateArgs) {
    this.package = await TurboPackageInstaller.create({
      name: "api",
      subPath: "api",
      packageKind: "PACKAGE_WITH_BUILD",
      monoRepoInstaller: args.monoRepoInstaller,
    });

    await this.package.addDevDependencyToPackageJson("typescript", Versions.typescript);
    await this.package.addDependencyToPackageJson("@orpc/server", Versions["@orpc/server"]);
    await this.package.addDependencyToPackageJson("zod", Versions.zod);
    await this.package.addDependencyToPackageJson("neverthrow", Versions.neverthrow);
    await this.package.addDependencyToPackageJson("@logtape/logtape", Versions["@logtape/logtape"]);
    await this.package.addDependencyToPackageJson("@repo/database", "workspace:*");

    const packageTemplateDir = path.resolve(TEMPLATE_ROOT, "orpc", "package");
    await fs.cp(packageTemplateDir, this.package.path, { recursive: true });

    await args.nextAppInstaller.addDependencyToPackageJson("@repo/api", "workspace:*");
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/client", Versions["@orpc/client"]);
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/contract", Versions["@orpc/contract"]);
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/server", Versions["@orpc/server"]);
    await args.nextAppInstaller.addDependencyToPackageJson("@orpc/tanstack-query", Versions["@orpc/tanstack-query"]);

    const nextIntegrationTemplateDir = path.resolve(TEMPLATE_ROOT, "orpc", "integration-next");
    await fs.cp(nextIntegrationTemplateDir, args.nextAppInstaller.srcPath, { recursive: true });

    await args.nextAppInstaller.addLoggerDeclaration(["api"]);
  }

  public async setupAuthProcedure() {
    if (!this.package) {
      throw new Error("Package installer not initialized");
    }
    const template = path.resolve(TEMPLATE_ROOT, "orpc", "with-auth");
    await fs.cp(template, this.package.path, { recursive: true });
  }

  public getContextProviderFile() {
    return getSourceFile(path.resolve(this.args.nextAppInstaller.srcPath, "lib", "orpc", "orpc-context.ts"));
  }

  public addDependencyToPackageJson(dep: string, version: string) {
    if (!this.package) {
      throw new Error("Package installer not initialized");
    }
    return this.package.addDependencyToPackageJson(dep, version);
  }

  public getRootPath() {
    if (!this.package) {
      throw new Error("Package installer not initialized");
    }
    return this.package.path;
  }
}
