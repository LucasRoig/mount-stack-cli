import fs from "node:fs/promises";
import { resolve } from "node:path";
import { updatePackage } from "pkg-types";
import { ts } from "ts-morph";
import { TEMPLATE_ROOT } from "../consts";
import { runProcess } from "../helpers/run-process";
import type { TaskLogger } from "../helpers/tasks-with-logs";
import { replaceTextInFile } from "../helpers/text-file";
import { getSourceFile } from "../helpers/ts-files";
import Versions from "../versions.json";
import type { MonoRepoInstaller } from "./mono-repo-installer";

type NextAppInstallerArgs = {
  logger: TaskLogger;
  path: string;
  name: string;
  monorepo: MonoRepoInstaller;
};

export class NextAppInstaller {
  public readonly nextAppRootPath: string;
  public readonly appName: string;
  private monoRepoInstaller: MonoRepoInstaller;
  private logger: TaskLogger;
  private tsConfigPath: string;
  private globalsCssPath: string;
  private rootLayoutPath: string;
  private instrumentationPath: string;
  private packageJsonPath: string;
  private nextConfigPath: string;
  private isTailwindInstalled = false;
  private isDockerInstalled = false;

  public static async create(args: NextAppInstallerArgs) {
    const installer = new NextAppInstaller(args);
    await installer.init();
    return installer;
  }

  private constructor(args: NextAppInstallerArgs) {
    this.monoRepoInstaller = args.monorepo;
    this.appName = args.name;
    this.nextAppRootPath = resolve(args.path, "apps", args.name);
    this.tsConfigPath = resolve(this.nextAppRootPath, "tsconfig.json");
    const srcPath = resolve(this.nextAppRootPath, "src");
    const appDirPath = resolve(srcPath, "app");
    this.globalsCssPath = resolve(appDirPath, "globals.css");
    this.rootLayoutPath = resolve(appDirPath, "layout.tsx");
    this.instrumentationPath = resolve(srcPath, "instrumentation.ts");
    this.packageJsonPath = resolve(this.nextAppRootPath, "package.json");
    this.nextConfigPath = resolve(this.nextAppRootPath, "next.config.ts");
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

    await this.addDevDependencyToPackageJson("typescript", Versions.typescript);
    await this.addDevDependencyToPackageJson("@repo/typescript-config", "workspace:*");
  }

  private async addDependencyToPackageJson(dep: string, version: string) {
    await updatePackage(this.packageJsonPath, (pkg) => {
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies[dep] = version;
    });
  }

  private async addDevDependencyToPackageJson(dep: string, version: string) {
    await updatePackage(this.packageJsonPath, (pkg) => {
      pkg.devDependencies = pkg.devDependencies || {};
      pkg.devDependencies[dep] = version;
    });
  }

  public async addTailwind() {
    if (this.isTailwindInstalled) {
      throw new Error("Tailwind is already installed");
    }
    await this.addDevDependencyToPackageJson("tailwindcss", Versions.tailwindcss);
    await this.addDevDependencyToPackageJson("postcss", Versions.postcss);
    await this.addDevDependencyToPackageJson("@tailwindcss/postcss", Versions["@tailwindcss/postcss"]);

    const postCssConfigTemplatePath = resolve(TEMPLATE_ROOT, "tailwind", "postcss.config.mjs");
    const destPostCssConfigPath = resolve(this.nextAppRootPath, "postcss.config.mjs");
    await fs.copyFile(postCssConfigTemplatePath, destPostCssConfigPath);

    const cssTemplateFile = resolve(TEMPLATE_ROOT, "tailwind", "globals.css");
    await fs.copyFile(cssTemplateFile, this.globalsCssPath);

    this.isTailwindInstalled = true;
  }

  public async addDocker() {
    if (this.isDockerInstalled) {
      throw new Error("Docker is already installed");
    }
    const dockerfileTemplatePath = resolve(TEMPLATE_ROOT, "next-app", "Dockerfile");
    const destDockerfilePath = resolve(this.nextAppRootPath, "Dockerfile");
    await fs.copyFile(dockerfileTemplatePath, destDockerfilePath);
    await replaceTextInFile(destDockerfilePath, "ARG APP_NAME=web", `ARG APP_NAME=${this.appName}`);

    const nextConfigFile = await getSourceFile(this.nextConfigPath);
    nextConfigFile.addImportDeclaration({
      moduleSpecifier: "node:path",
      defaultImport: "path",
    });
    const nextConfigObject = nextConfigFile
      .getVariableDeclarationOrThrow("nextConfig")
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
    nextConfigObject.addPropertyAssignment({
      name: "output",
      initializer: `"standalone"`,
    });
    nextConfigObject.addPropertyAssignment({
      name: "outputFileTracingRoot",
      initializer: `path.join(import.meta.dirname, '../../')`,
    });
    await nextConfigFile.save();

    if (!await this.monoRepoInstaller.justfileExists()) {
      await this.monoRepoInstaller.createJustfile();
    }

    let justfileContent = "";
    justfileContent += `docker_${this.appName}_name := ${this.appName}\n\n`;
    justfileContent += `@build_${this.appName} version:\n`;
    justfileContent += `\tdocker build -t {{docker_${this.appName}_name}}:{{version}} -f apps/${this.appName}/Dockerfile .\n\n`;
    justfileContent += `@run_${this.appName} version:\n`;
    justfileContent += `\tdocker run -p 3000:3000 {{docker_${this.appName}_name}}:{{version}}\n\n`;
    await this.monoRepoInstaller.appendToJustfile(justfileContent);

    this.isDockerInstalled = true;
  }
}
