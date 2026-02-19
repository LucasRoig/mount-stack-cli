import fs from "node:fs/promises";
import path from "node:path";
import { updatePackage } from "pkg-types";
import { TEMPLATE_ROOT } from "../consts";
import { replaceTextInFile } from "../helpers/text-file";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type DatabaseInstallerCreateArgs = {
  monoRepoInstaller: MonoRepoInstaller;
  rootScriptPrefix?: string;
};

export class DatabaseInstaller {
  public static async create(args: DatabaseInstallerCreateArgs): Promise<DatabaseInstaller> {
    const installer = new DatabaseInstaller();
    await installer.init(args);
    return installer;
  }

  private constructor() {}

  private async init(args: DatabaseInstallerCreateArgs) {
    const packageInstaller = await TurboPackageInstaller.create({
      name: "database",
      subPath: "database",
      packageKind: "PACKAGE_WITH_BUILD",
      monoRepoInstaller: args.monoRepoInstaller,
    });

    await packageInstaller.addDevDependencyToPackageJson("typescript", Versions.typescript);
    await packageInstaller.addDevDependencyToPackageJson("dotenv", Versions.dotenv);
    await packageInstaller.addDevDependencyToPackageJson("prisma", Versions.prisma);
    await packageInstaller.addDevDependencyToPackageJson(
      "prisma-generator-drizzle",
      Versions["prisma-generator-drizzle"],
    );

    await packageInstaller.addDependencyToPackageJson("drizzle-orm", Versions["drizzle-orm"]);

    const templateDir = path.resolve(TEMPLATE_ROOT, "database", "prisma-drizzle");
    await fs.cp(templateDir, packageInstaller.path, { recursive: true });

    const envSamplePath = path.resolve(packageInstaller.path, ".env.sample");
    await replaceTextInFile(envSamplePath, "{{app-name-placeholder}}", args.monoRepoInstaller.appName);
    await fs.cp(envSamplePath, path.resolve(packageInstaller.path, ".env"));

    await updatePackage(args.monoRepoInstaller.rootPackageJsonPath, (pkg) => {
      if (!pkg.scripts) {
        pkg.scripts = {};
      }
      const scriptPrefix = args.rootScriptPrefix ? `${args.rootScriptPrefix}:` : "";
      pkg.scripts[`${scriptPrefix}db:generate`] =
        `pnpm --dir ${packageInstaller.relativePathFromMonorepoRoot} exec prisma generate`;
      pkg.scripts[`${scriptPrefix}db:migrate`] =
        `pnpm --dir ${packageInstaller.relativePathFromMonorepoRoot} exec prisma migrate`;
    });
  }
}
