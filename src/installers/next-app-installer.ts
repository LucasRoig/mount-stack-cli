import fs from "node:fs/promises";
import { resolve } from "node:path";
import { TEMPLATE_ROOT } from "../consts";
import { runProcess } from "../helpers/run-process";
import type { TaskLogger } from "../helpers/tasks-with-logs";
import Versions from "../versions.json";

type NextAppInstallerArgs = {
  logger: TaskLogger;
  path: string;
  name: string;
};

export class NextAppInstaller {
  public readonly nextAppRootPath: string;
  private logger: TaskLogger;
  private tsConfigPath: string;
  private globalsCssPath: string;
  private rootLayoutPath: string;
  private instrumentationPath: string;

  public static async create(args: NextAppInstallerArgs) {
    const installer = new NextAppInstaller(args);
    await installer.init();
    return installer;
  }

  private constructor(args: NextAppInstallerArgs) {
    this.nextAppRootPath = resolve(args.path, "apps", args.name);
    this.tsConfigPath = resolve(this.nextAppRootPath, "tsconfig.json");
    const srcPath = resolve(this.nextAppRootPath, "src");
    const appDirPath = resolve(srcPath, "app");
    this.globalsCssPath = resolve(appDirPath, "globals.css");
    this.rootLayoutPath = resolve(appDirPath, "layout.tsx");
    this.instrumentationPath = resolve(srcPath, "instrumentation.ts");
    this.logger = args.logger;
  }

  private async init() {
    await runProcess(
      "pnpm",
      [
        "dlx",
        `create-next-app@${Versions["create-next-app"]}`,
        this.nextAppRootPath,
        "--ts",
        "--no-linter",
        "--app",
        "--src-dir",
        "--turbopack",
        "--empty",
        "--use-pnpm",
        "--skip-install",
        "--disable-git",
        "--no-react-compiler",
        "--no-tailwind",
        "--import-alias",
        "@/*",
      ],
      {
        onStdout: this.logger.message,
        onStderr: this.logger.message,
      },
    );
    const tsConfigTemplatePath = resolve(TEMPLATE_ROOT, "next-app", "tsconfig.json");
    await fs.copyFile(tsConfigTemplatePath, this.tsConfigPath);

    const cssTemplateFile = resolve(TEMPLATE_ROOT, "next-app", "globals.css");
    await fs.copyFile(cssTemplateFile, this.globalsCssPath);

    const rootLayoutTemplatePath = resolve(TEMPLATE_ROOT, "next-app", "layout.tsx");
    await fs.copyFile(rootLayoutTemplatePath, this.rootLayoutPath);

    const instrumentationTemplatePath = resolve(TEMPLATE_ROOT, "next-app", "instrumentation.ts");
    await fs.copyFile(instrumentationTemplatePath, this.instrumentationPath);

    const gitignoreFile = resolve(this.nextAppRootPath, ".gitignore");
    await fs.appendFile(gitignoreFile, "!.env.*.sample");
  }
}
