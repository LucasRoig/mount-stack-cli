import fs from "node:fs/promises";
import path, { resolve } from "node:path";
import { updatePackage } from "pkg-types";
import { ts, VariableDeclarationKind } from "ts-morph";
import { match } from "ts-pattern";
import { TEMPLATE_ROOT } from "../consts";
import { NextInstrumentationFile } from "../helpers/next-instrumentation-file";
import { NextLayoutFile } from "../helpers/next-layout-file";
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

export const EnvVisibilities = {
  SERVER: "SERVER" as const,
  CLIENT: "CLIENT" as const,
  SECRET: "SECRET" as const,
};

type EnvVisibility = (typeof EnvVisibilities)[keyof typeof EnvVisibilities];

export const EnvSchemas = {
  String: "z.string().min(1)",
  PositiveInt: "z.coerce.number().int().positive()",
  Boolean: "_BooleanStringZod",
  StringList: "_CommaSeparatedListZod",
};

type EnvSchema = (typeof EnvSchemas)[keyof typeof EnvSchemas];

export class NextAppInstaller {
  public readonly nextAppRootPath: string;
  public readonly appName: string;
  private monoRepoInstaller: MonoRepoInstaller;
  private logger: TaskLogger;
  private envSampleFilePath: string;
  private envLocalFilePath: string;
  private envTsFilePath: string;
  private tsConfigPath: string;
  private globalsCssPath: string;
  public readonly rootLayoutPath: string;
  private instrumentationPath: string;
  private packageJsonPath: string;
  private nextConfigPath: string;
  public readonly srcPath: string;
  private libPath: string;
  private appRouterDirPath: string;
  private isTailwindInstalled = false;
  private isDockerInstalled = false;
  private isReactQueryInstalled = false;
  private isI18nInstalled = false;
  private isLoggerInstalled = false;
  private isEnvFileManagementInstalled = false;
  public readonly i18nFiles = {
    fr: "",
  };

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
    this.srcPath = resolve(this.nextAppRootPath, "src");
    this.libPath = resolve(this.srcPath, "lib");
    this.appRouterDirPath = resolve(this.srcPath, "app");
    this.globalsCssPath = resolve(this.appRouterDirPath, "globals.css");
    this.rootLayoutPath = resolve(this.appRouterDirPath, "layout.tsx");
    this.instrumentationPath = resolve(this.srcPath, "instrumentation.ts");
    this.packageJsonPath = resolve(this.nextAppRootPath, "package.json");
    this.nextConfigPath = resolve(this.nextAppRootPath, "next.config.ts");
    this.envSampleFilePath = resolve(this.nextAppRootPath, ".env.local.sample");
    this.envLocalFilePath = resolve(this.nextAppRootPath, ".env.local");
    this.envTsFilePath = resolve(this.srcPath, "env", "env.ts");
    this.i18nFiles.fr = resolve(this.nextAppRootPath, "messages", "fr.json");
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

    const badPnpmWorkspaceFilePath = resolve(this.nextAppRootPath, "pnpm-workspace.yaml");
    if (await fs.stat(badPnpmWorkspaceFilePath).catch(() => false)) {
      await fs.rm(badPnpmWorkspaceFilePath);
    }

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

    const publicDirPath = resolve(this.nextAppRootPath, "public");
    await fs.mkdir(publicDirPath, { recursive: true });
    await fs.writeFile(resolve(publicDirPath, ".gitkeep"), "");

    const fontsTemplateDir = resolve(TEMPLATE_ROOT, "next-app", "fonts");
    const fontsDestDir = resolve(this.appRouterDirPath, "fonts");
    await fs.cp(fontsTemplateDir, fontsDestDir, { recursive: true });

    await updatePackage(this.monoRepoInstaller.rootPackageJsonPath, (pkg) => {
      if (!pkg.scripts) {
        pkg.scripts = {};
      }
      pkg.scripts.dev = `turbo run dev --filter=${this.appName}`;
      pkg.scripts.build = `turbo run build --filter=${this.appName}`;
    });
  }

  public async addDependencyToPackageJson(dep: string, version: string) {
    await updatePackage(this.packageJsonPath, (pkg) => {
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies[dep] = version;
    });
  }

  public async addDevDependencyToPackageJson(dep: string, version: string) {
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

    if (!(await this.monoRepoInstaller.justfileExists())) {
      await this.monoRepoInstaller.createJustfile();
    }

    let justfileContent = "";
    justfileContent += `docker_${this.appName}_name := "${this.appName}"\n\n`;
    justfileContent += `@build_${this.appName} version:\n`;
    justfileContent += `\tdocker build -t {{docker_${this.appName}_name}}:{{version}} -f apps/${this.appName}/Dockerfile .\n\n`;
    justfileContent += `@run_${this.appName} version:\n`;
    justfileContent += `\tdocker run -p 3000:3000 {{docker_${this.appName}_name}}:{{version}}\n\n`;
    await this.monoRepoInstaller.appendToJustfile(justfileContent);

    this.isDockerInstalled = true;
  }

  public async addReactQuery() {
    if (this.isReactQueryInstalled) {
      throw new Error("React Query is already installed");
    }

    await this.addDependencyToPackageJson("@tanstack/react-query", Versions["@tanstack/react-query"]);
    await this.addDevDependencyToPackageJson(
      "@tanstack/react-query-devtools",
      Versions["@tanstack/react-query-devtools"],
    );

    const queryClientLibTemplatePath = resolve(TEMPLATE_ROOT, "react-query", "lib");
    await fs.cp(queryClientLibTemplatePath, this.libPath, { recursive: true });

    const appTemplatePath = resolve(TEMPLATE_ROOT, "react-query", "app");
    await fs.cp(appTemplatePath, this.appRouterDirPath, { recursive: true });

    const layoutFile = await NextLayoutFile.fromPath(this.rootLayoutPath);
    layoutFile.addImportDeclaration({
      moduleSpecifier: "./providers",
      defaultImport: "Providers",
    });
    layoutFile.wrapChildrenWithComponent("<Providers>", "</Providers>");
    await layoutFile.save();

    this.isReactQueryInstalled = true;
  }

  public async addI18n() {
    if (this.isI18nInstalled) {
      throw new Error("i18n is already installed");
    }

    this.addDependencyToPackageJson("next-intl", Versions["next-intl"]);

    const messagesTemplateDir = resolve(TEMPLATE_ROOT, "next-intl", "messages");
    const messagesTargetDir = resolve(this.nextAppRootPath, "messages");
    await fs.cp(messagesTemplateDir, messagesTargetDir, { recursive: true });

    const srcTemplateDir = resolve(TEMPLATE_ROOT, "next-intl", "src");
    await fs.cp(srcTemplateDir, this.srcPath, { recursive: true });

    const nextConfigFile = await getSourceFile(this.nextConfigPath);
    nextConfigFile.removeDefaultExport();
    nextConfigFile.addImportDeclaration({
      moduleSpecifier: "next-intl/plugin",
      defaultImport: "createNextIntlPlugin",
    });
    nextConfigFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "withNextIntl",
          initializer: "createNextIntlPlugin()",
        },
      ],
    });
    nextConfigFile.addExportAssignment({
      expression: "withNextIntl(nextConfig)",
      isExportEquals: false, // sets to export default
    });
    await nextConfigFile.save();

    const layoutFile = await NextLayoutFile.fromPath(this.rootLayoutPath);
    layoutFile.addImportDeclaration({
      moduleSpecifier: "next-intl",
      namedImports: ["NextIntlClientProvider"],
    });
    layoutFile.wrapChildrenWithComponent("<NextIntlClientProvider>", "</NextIntlClientProvider>");
    await layoutFile.save();

    this.isI18nInstalled = true;
  }

  public async addLogger() {
    if (this.isLoggerInstalled) {
      throw new Error("Logger is already installed");
    }

    await this.addDependencyToPackageJson("@logtape/logtape", Versions["@logtape/logtape"]);
    await this.addDependencyToPackageJson("@logtape/pretty", Versions["@logtape/pretty"]);

    const loggerTemplatePath = resolve(TEMPLATE_ROOT, "logtape", "lib");
    await fs.cp(loggerTemplatePath, this.libPath, { recursive: true });

    const instrumentationFile = await NextInstrumentationFile.fromPath(this.instrumentationPath);
    instrumentationFile.addImportDeclaration({
      moduleSpecifier: "@/lib/logger",
    });
    instrumentationFile.addImportDeclaration({
      moduleSpecifier: "@logtape/logtape",
      namedImports: ["getLogger"],
    });
    instrumentationFile.insertRootVariableStatement(0, {
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "logger",
          initializer: `getLogger(["next", "instrumentation"])`,
        },
      ],
    });
    instrumentationFile.addStatementsToRegisterFunction(`logger.info("Starting instrumentation");`);
    await instrumentationFile.save();

    this.isLoggerInstalled = true;
  }

  public async addLoggerDeclaration(category: string[]) {
    const loggerFile = await getSourceFile(resolve(this.libPath, "logger.ts"));
    loggerFile
      .getVariableDeclarationOrThrow("loggers")
      .getChildAtIndexIfKindOrThrow(2, ts.SyntaxKind.ArrayLiteralExpression)
      .addElement(`{ category: ["${category.join('","')}"], sinks: [sink], lowestLevel: "debug" as const }`);
    loggerFile.formatText();
    await loggerFile.save();
  }

  public async addEnvFileManagement() {
    if (this.isEnvFileManagementInstalled) {
      throw new Error("Env file management is already installed");
    }

    const envLocalTemplatePath = resolve(TEMPLATE_ROOT, "next-app", "env.local.sample");
    await fs.copyFile(envLocalTemplatePath, this.envSampleFilePath);
    await fs.copyFile(envLocalTemplatePath, this.envLocalFilePath);

    await this.addDependencyToPackageJson("zod", Versions.zod);

    const envTsTemplatePath = resolve(TEMPLATE_ROOT, "env", "env.ts");
    await fs.mkdir(path.dirname(this.envTsFilePath), { recursive: true });
    await fs.cp(envTsTemplatePath, this.envTsFilePath);

    const envContextTemplatePath = resolve(TEMPLATE_ROOT, "env", "client-env-context.tsx");
    const envContextDestPath = resolve(path.dirname(this.envTsFilePath), "client-env-context.tsx");
    await fs.cp(envContextTemplatePath, envContextDestPath);

    const instrumentationFile = await NextInstrumentationFile.fromPath(this.instrumentationPath);
    instrumentationFile.addImportDeclaration({
      moduleSpecifier: "@/env/env",
      namedImports: ["printEnv"],
    });
    instrumentationFile.addStatementsToRegisterFunction(
      await fs.readFile(resolve(TEMPLATE_ROOT, "env", "instrumentation.part.ts"), "utf8"),
    );
    await instrumentationFile.save();

    const layoutFile = await NextLayoutFile.fromPath(this.rootLayoutPath);
    layoutFile.addImportDeclaration({
      moduleSpecifier: "@/env/client-env-context",
      namedImports: ["ClientEnvContextProvider"],
    });
    layoutFile.addImportDeclaration({
      moduleSpecifier: "@/env/env",
      namedImports: ["getEnv"],
    });
    layoutFile.addVariableDeclarationInLayoutFunction(0, {
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "env",
          initializer: "getEnv()",
        },
      ],
    });
    layoutFile.wrapChildrenWithComponent(
      "<ClientEnvContextProvider clientEnv={env.client}>",
      "</ClientEnvContextProvider>",
    );
    await layoutFile.save();

    this.isEnvFileManagementInstalled = true;
  }

  public async addEnvVariable(
    name: string,
    kind: EnvVisibility,
    defaultValue?: string,
    { schema }: { schema: EnvSchema } = { schema: EnvSchemas.String },
  ) {
    //1 - add to .env.local.sample
    const envVariableLine = `${name}=${defaultValue || ""}\n`;
    await fs.appendFile(this.envSampleFilePath, envVariableLine);
    //2 - add to .env.local
    await fs.appendFile(this.envLocalFilePath, envVariableLine);
    //3 - add to env.ts zod schema
    const envTsFile = await getSourceFile(this.envTsFilePath);
    envTsFile
      .getVariableDeclarationOrThrow("envSchema")
      .getFirstChildByKindOrThrow(ts.SyntaxKind.CallExpression)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
      .addPropertyAssignment({
        name: name,
        initializer: schema,
      });

    //4 - add to mapEnv function in env.ts
    const mapKey = match(kind)
      .with(EnvVisibilities.SERVER, () => "server")
      .with(EnvVisibilities.CLIENT, () => "client")
      .with(EnvVisibilities.SECRET, () => "secrets")
      .exhaustive();
    const mapEnvPropertyAssignment = envTsFile
      .getFunctionOrThrow("mapEnv")
      .getFirstChildByKindOrThrow(ts.SyntaxKind.Block)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ReturnStatement)
      .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
      .getChildrenOfKind(ts.SyntaxKind.PropertyAssignment)
      .find((pa) => pa.getName() === mapKey);
    if (!mapEnvPropertyAssignment) {
      throw new Error(`Could not find property assignment with name ${mapKey} in mapEnv function`);
    }
    mapEnvPropertyAssignment.getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression).addPropertyAssignment({
      name,
      initializer: `env.${name}`,
    });

    envTsFile.formatText();
    await envTsFile.save();
  }
}
