import fs from "node:fs/promises";
import path from "node:path";
import { updatePackage } from "pkg-types";
import { TEMPLATE_ROOT } from "../consts";
import { PrismaSchemaFile } from "../helpers/prisma-helper";
import { replaceTextInFile } from "../helpers/text-file";
import Versions from "../versions.json";
import type { DockerComposeInstaller } from "./docker-compose-installer";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import { EnvVisibilities, type NextAppInstaller } from "./next-app-installer";
import type { TsUtilsInstaller } from "./ts-utils-installer";
import { TurboPackageInstaller } from "./turbo-package-installer";

type DatabaseInstallerCreateArgs = {
  monoRepoInstaller: MonoRepoInstaller;
  nextAppInstaller: NextAppInstaller;
  tsUtilsInstaller: TsUtilsInstaller;
  dockerComposeInstaller: DockerComposeInstaller;
  rootScriptPrefix?: string;
};

export class DatabaseInstaller {
  private prismaSchemaPath: string | undefined;

  public getPrismaSchema() {
    if (!this.prismaSchemaPath) {
      throw new Error("Prisma schema path is not set");
    }
    return PrismaSchemaFile.fromFile(this.prismaSchemaPath);
  }

  public static async create(args: DatabaseInstallerCreateArgs): Promise<DatabaseInstaller> {
    const installer = new DatabaseInstaller();
    await installer.init(args);
    return installer;
  }

  private constructor() { }

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
    await packageInstaller.addDevDependencyToPackageJson("@types/node", Versions["@types/node"]);

    await packageInstaller.addDependencyToPackageJson("drizzle-orm", Versions["drizzle-orm"]);

    const templateDir = path.resolve(TEMPLATE_ROOT, "database", "prisma-drizzle", "package");
    await fs.cp(templateDir, packageInstaller.path, { recursive: true });
    this.prismaSchemaPath = path.resolve(packageInstaller.path, "prisma", "schema.prisma");

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

    const dockerPostgresUser = "postgres";
    const dockerPostgresPassword = "postgres";
    const dockerPostgresDatabase = args.monoRepoInstaller.appName;
    const dockerPostgresPort = "5432";
    await args.dockerComposeInstaller.addManagedVolume(`${args.monoRepoInstaller.appName}-postgres-data`);
    await args.dockerComposeInstaller.addService({
      serviceName: "database",
      containerName: `${args.monoRepoInstaller.appName}-database`,
      image: Versions["postgres-docker-image"],
      ports: [`${dockerPostgresPort}:5432`],
      environment: {
        POSTGRES_USER: dockerPostgresUser,
        POSTGRES_PASSWORD: dockerPostgresPassword,
        POSTGRES_DB: dockerPostgresDatabase,
      },
      volumes: [`${args.monoRepoInstaller.appName}-postgres-data:/var/lib/postgresql`],
    });

    //Add in the next application
    const dbClientTemplatePath = path.resolve(
      TEMPLATE_ROOT,
      "database",
      "prisma-drizzle",
      "next-integration",
      "database.ts",
    );
    const dbClientDestinationPath = path.resolve(args.nextAppInstaller.srcPath, "lib", "database.ts");
    await fs.copyFile(dbClientTemplatePath, dbClientDestinationPath);
    await args.nextAppInstaller.addDependencyToPackageJson(packageInstaller.packageName, "workspace:*");
    await args.nextAppInstaller.addDependencyToPackageJson("drizzle-orm", Versions["drizzle-orm"]);
    await args.nextAppInstaller.addDependencyToPackageJson("pg", Versions.pg);
    await args.nextAppInstaller.addDevDependencyToPackageJson("@types/pg", Versions["@types/pg"]);
    await args.nextAppInstaller.addDependencyToPackageJson(args.tsUtilsInstaller.packageName, "workspace:*");
    await args.nextAppInstaller.addEnvVariable("PG_USER", EnvVisibilities.SERVER, dockerPostgresUser);
    await args.nextAppInstaller.addEnvVariable("PG_PASSWORD", EnvVisibilities.SECRET, dockerPostgresPassword);
    await args.nextAppInstaller.addEnvVariable("PG_DATABASE", EnvVisibilities.SERVER, dockerPostgresDatabase);
    await args.nextAppInstaller.addEnvVariable("PG_HOST", EnvVisibilities.SERVER, "localhost");
    await args.nextAppInstaller.addEnvVariable("PG_PORT", EnvVisibilities.SERVER, dockerPostgresPort);
  }
}
