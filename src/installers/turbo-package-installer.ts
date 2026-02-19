import fs from "node:fs/promises";
import { relative, resolve } from "node:path";
import { updatePackage } from "pkg-types";
import { match } from "ts-pattern";
import { TEMPLATE_ROOT } from "../consts";
import type { MonoRepoInstaller } from "./mono-repo-installer";

type TurboPackageInstallerCreateArgs = {
  name: string;
  subPath: string;
  packageKind: "PACKAGE_WITH_BUILD";
  monoRepoInstaller: MonoRepoInstaller;
};

export class TurboPackageInstaller {
  public readonly path: string;
  public readonly packageJsonPath: string;
  public readonly relativePathFromMonorepoRoot: string;

  public static async create(args: TurboPackageInstallerCreateArgs) {
    const installer = new TurboPackageInstaller(args);
    await installer.init(args);
    return installer;
  }

  private constructor(args: TurboPackageInstallerCreateArgs) {
    this.path = resolve(args.monoRepoInstaller.packagesPath, args.subPath);
    this.packageJsonPath = resolve(this.path, "package.json");
    this.relativePathFromMonorepoRoot = relative(args.monoRepoInstaller.rootPath, this.path);
  }

  private async init(args: TurboPackageInstallerCreateArgs) {
    await match(args.packageKind)
      .with("PACKAGE_WITH_BUILD", () => {
        const templatePath = resolve(TEMPLATE_ROOT, "turbo-package-template", "package-with-build");
        return fs.cp(templatePath, this.path, { recursive: true });
      })
      .exhaustive();

    await updatePackage(this.packageJsonPath, (pkg) => {
      pkg.name = `@repo/${args.name}`;
    });
  }

  public async addDependencyToPackageJson(dependencyName: string, version: string) {
    await updatePackage(this.packageJsonPath, (pkg) => {
      if (!pkg.dependencies) {
        pkg.dependencies = {};
      }
      pkg.dependencies[dependencyName] = version;
    });
  }

  public async addDevDependencyToPackageJson(dependencyName: string, version: string) {
    await updatePackage(this.packageJsonPath, (pkg) => {
      if (!pkg.devDependencies) {
        pkg.devDependencies = {};
      }
      pkg.devDependencies[dependencyName] = version;
    });
  }
}
