import fs from "node:fs/promises";
import { relative, resolve } from "node:path";
import { updatePackage } from "pkg-types";
import { TEMPLATE_ROOT } from "../consts";
import { updateJsonFile } from "../helpers/json-file";
import { replaceTextInFile } from "../helpers/text-file";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";

type TurboNodeAppInstallerCreateArgs = {
  name: string;
  subPath: string;
  monoRepoInstaller: MonoRepoInstaller;
};

export class TurboNodeAppInstaller {
  public readonly path: string;
  public readonly packageJsonPath: string;
  public readonly relativePathFromMonorepoRoot: string;
  public readonly appName: string;
  public readonly dockerfilePath: string;
  public readonly envPath: string;
  public readonly envSamplePath: string;

  public static async create(args: TurboNodeAppInstallerCreateArgs) {
    const installer = new TurboNodeAppInstaller(args);
    await installer.init(args);
    return installer;
  }

  private constructor(args: TurboNodeAppInstallerCreateArgs) {
    this.path = resolve(args.monoRepoInstaller.appsPath, args.subPath);
    this.packageJsonPath = resolve(this.path, "package.json");
    this.relativePathFromMonorepoRoot = relative(args.monoRepoInstaller.rootPath, this.path);
    this.appName = args.name;
    this.dockerfilePath = resolve(this.path, "Dockerfile");
    this.envPath = resolve(this.path, ".env");
    this.envSamplePath = resolve(this.path, ".env.sample");
  }

  private async init(_args: TurboNodeAppInstallerCreateArgs) {
    const templatePath = resolve(TEMPLATE_ROOT, "turbo-node-app-template");
    await fs.cp(templatePath, this.path, { recursive: true });
    await updatePackage(this.packageJsonPath, (pkg) => {
      pkg.name = this.appName;
    });
    await this.addDevDependencyToPackageJson("@types/node", Versions["@types/node"]);
    await this.addDevDependencyToPackageJson("tsx", Versions.tsx);
    await this.addDevDependencyToPackageJson("typescript", Versions.typescript);
    await this.addDevDependencyToPackageJson("tsup", Versions.tsup);
    await updateJsonFile(this.packageJsonPath, (json) => {
      json.volta = json.volta || {};
      json.volta.node = Versions.node;
    });
    await replaceTextInFile(this.dockerfilePath, "ARG APP_NAME=todo-change-me", `ARG APP_NAME=${this.appName}`);
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

  public async addScriptToPackageJson(scriptName: string, scriptCommand: string) {
    await updatePackage(this.packageJsonPath, (pkg) => {
      if (!pkg.scripts) {
        pkg.scripts = {};
      }
      pkg.scripts[scriptName] = scriptCommand;
    });
  }

  public async addEnvVariable(key: string, defaultValue?: string,) {
    const envLine = `${key}=${defaultValue ?? ""}\n`;
    await fs.appendFile(this.envPath, envLine);
    await fs.appendFile(this.envSamplePath, envLine);
  }
}
