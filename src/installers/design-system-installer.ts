import fs from "node:fs/promises";
import { resolve } from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import { Git } from "../helpers/git";
import { updateYamlFile } from "../helpers/yaml-file";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";
import type { NextAppInstaller } from "./next-app-installer";

const submoduleRepo = "https://github.com/LucasRoig/react-ui-submodule.git";
const submoduleBranch = "main";
const directoryName = "design-system";

type DesignSystemInstallerOptions = {
  monoRepoInstaller: MonoRepoInstaller;
  nextAppInstaller: NextAppInstaller;
  onStdout?: (msg: string) => void;
  onStderr?: (msg: string) => void;
};

export class DesignSystemInstaller {
  public readonly submodulePrefix = "@lro-ui";
  public static async create(options: DesignSystemInstallerOptions) {
    const installer = new DesignSystemInstaller();
    await installer.init(options);
    return installer;
  }

  private constructor() {}

  private async init(options: DesignSystemInstallerOptions) {
    await Git.addSubmodule(
      {
        branch: submoduleBranch,
        repo: submoduleRepo,
        directoryName: directoryName,
        cwd: options.monoRepoInstaller.rootPath,
      },
      {
        onStdout: options.onStdout,
        onStderr: options.onStderr,
      },
    );

    const pnpmWorkspaceConfigPath = resolve(options.monoRepoInstaller.rootPath, "pnpm-workspace.yaml");
    await updateYamlFile(pnpmWorkspaceConfigPath, (data) => {
      if (!data.packages) {
        data.packages = [];
      }
      data.packages.push(`${directoryName}/**/*`);
    });

    const nextIntegrationTemplatePath = resolve(TEMPLATE_ROOT, "design-system", "next-integration");
    await fs.cp(nextIntegrationTemplatePath, options.nextAppInstaller.nextAppRootPath, { recursive: true });

    await options.nextAppInstaller.addDependencyToPackageJson("tw-animate-css", Versions["tw-animate-css"]);
  }
}
