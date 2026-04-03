import { Git } from "../helpers/git";
import type { MonoRepoInstaller } from "./mono-repo-installer";

const submoduleRepo = "https://github.com/LucasRoig/react-ui-submodule.git";
const submoduleBranch = "main";
const submodulePrefix = "@lro-ui";

type DesignSystemInstallerOptions = {
  monoRepoInstaller: MonoRepoInstaller;
  onStdout?: (msg: string) => void;
  onStderr?: (msg: string) => void;
};

export class DesignSystemInstaller {
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
        directoryName: "design-system",
        cwd: options.monoRepoInstaller.rootPath,
      },
      {
        onStdout: options.onStdout,
        onStderr: options.onStderr,
      },
    );
  }
}
