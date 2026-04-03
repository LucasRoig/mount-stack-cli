import fs from "node:fs/promises";
import path, { basename, resolve } from "node:path";
import process from "node:process";
import { cancel, confirm, intro, log, multiselect, outro, text } from "@clack/prompts";
import color from "picocolors";
import { updatePackage } from "pkg-types";
import { TEMPLATE_ROOT } from "./consts";
import { Git } from "./helpers/git";
import { updateJsonFile } from "./helpers/json-file";
import { runProcess } from "./helpers/run-process";
import { type TaskWithLogDefinition, tasksWithLogs } from "./helpers/tasks-with-logs";
import { BetterAuthInstaller, type BetterAuthProviders } from "./installers/better-auth-installer";
import { DatabaseInstaller } from "./installers/database-installer";
import { DockerComposeInstaller } from "./installers/docker-compose-installer";
import { MonoRepoInstaller } from "./installers/mono-repo-installer";
import { NextAppInstaller } from "./installers/next-app-installer";
import { OrpcInstaller } from "./installers/orpc-installer";
import { TsUtilsInstaller } from "./installers/ts-utils-installer";
import Versions from "./versions.json";

const SKIP_COMMIT = false;

type Context = {
  monoRepoInstaller: MonoRepoInstaller | undefined;
  nextAppInstaller: NextAppInstaller | undefined;
  databaseInstaller: DatabaseInstaller | undefined;
  tsUtilsInstaller: TsUtilsInstaller | undefined;
  orpcInstaller: OrpcInstaller | undefined;
  dockerComposeInstaller: DockerComposeInstaller | undefined;
  betterAuthConfig:
    | {
        enabled: true;
        providers: BetterAuthProviders[];
        useDatabase: boolean;
      }
    | undefined;
};

async function main() {
  const cwd = process.cwd();
  intro(color.inverse("Mount stack"));
  log.info(`Current directory ${cwd}`);

  const relativeProjectPath = await text({
    message: "Where would you like to create your project ?",
    defaultValue: "./my-app",
    placeholder: "./my-app",
    validate: (value: string | undefined) => {
      if (value === undefined) {
        value = "./my-app";
      }
      if (!value.startsWith(".")) {
        return "Relative path should start with a dot .";
      }
      try {
        resolve(cwd, value);
      } catch {
        return "Invalid path";
      }
    },
  });

  const projectPath = resolve(cwd, relativeProjectPath as string);
  const appName = basename(projectPath).replace(/\\/g, "").replace(/\//g, "").replace(/\s/g, "-").toLowerCase();
  // log.info(`Project path ${projectPath}`);
  // log.info(`App name ${appName}`);
  const context: Context = {
    monoRepoInstaller: undefined,
    nextAppInstaller: undefined,
    databaseInstaller: undefined,
    betterAuthConfig: undefined,
    tsUtilsInstaller: undefined,
    orpcInstaller: undefined,
    dockerComposeInstaller: undefined,
  };

  const setupBetterAuth = await confirm({
    message: "Do you want to setup authentication with BetterAuth ?",
    initialValue: true,
  });

  if (setupBetterAuth) {
    const isStoreSessionsInDatabase = (await confirm({
      message: "Do you want to store sessions in the database ?",
      initialValue: true,
    })) as boolean;

    let providersOptions = [
      { value: "email" as const, label: "Email/Password (local)" },
      { value: "oidc" as const, label: "OIDC" },
      { value: "saml" as const, label: "SAML" },
    ];

    if (!isStoreSessionsInDatabase) {
      providersOptions = providersOptions.filter((option) => option.value !== "email");
    }

    const betterAuthProviders = (await multiselect({
      message: "Which authentication providers do you want to use ?",
      options: providersOptions,
    })) as BetterAuthProviders[];

    context.betterAuthConfig = {
      enabled: true,
      providers: betterAuthProviders,
      useDatabase: isStoreSessionsInDatabase,
    };
  }

  const setupTasks: TaskWithLogDefinition[] = [];

  setupTasks.push({
    title: "Initializing turbo repo...",
    task: initTurboRepo({ path: projectPath, appName, context }),
  });

  setupTasks.push({
    title: "Deleting turbo example apps and packages...",
    task: deleteTurboExempleAppsAndPackages({ path: projectPath }),
  });

  setupTasks.push({
    title: "Removing ESLint and Prettier...",
    task: removeEslintAndPrettier({ path: projectPath }),
  });

  setupTasks.push({
    title: "Setting TypeScript version...",
    task: setTypescriptVersion({ path: projectPath }),
  });

  setupTasks.push({
    title: "Initializing TypeScript config package...",
    task: copyTypescriptConfigPackage({ path: projectPath }),
  });

  setupTasks.push({
    title: "Copying .editorconfig file...",
    task: copyEditorConfigFile({ path: projectPath }),
  });

  setupTasks.push({
    title: "Copying VSCode settings file...",
    task: copyVsCodeSettingsFile({ path: projectPath }),
  });

  setupTasks.push({
    title: "Copying .dockerignore file...",
    task: copyDockerIgnoreFile({ path: projectPath }),
  });

  setupTasks.push({
    title: "Installing Biome...",
    task: installBiome({ path: projectPath }),
  });

  setupTasks.push({
    title: "Adding ts-utils package...",
    task: addTsUtilsPackage({ path: projectPath, context }),
  });

  setupTasks.push({
    title: "Adding docker-compose...",
    task: addDockerCompose({ path: projectPath, context }),
  });

  setupTasks.push({
    title: "Creating Next.js app...",
    task: createNextApp({ path: projectPath, name: "web-exemple", context }),
  });

  setupTasks.push({
    title: "Adding database package...",
    task: addDatabasePackage({ path: projectPath, context }),
  });

  setupTasks.push({
    title: "Adding ORPC API package...",
    task: addOrpcApiPackage({ path: projectPath, context }),
  });

  if (context.betterAuthConfig?.enabled) {
    setupTasks.push({
      title: "Setting up BetterAuth...",
      task: addBetterAuth({ path: projectPath, context }),
    });
  }

  setupTasks.push({
    title: "Installing dependencies...",
    task: installDependencies({ path: projectPath }),
  });

  setupTasks.push({
    title: "Generating database...",
    task: generateDatabase({ path: projectPath }),
  });

  setupTasks.push({
    title: "Running pnpm fix...",
    task: runPnpmFix({ path: projectPath }),
  });

  try {
    await tasksWithLogs(setupTasks);
  } catch (err) {
    cancel((err as Error).toString());
    process.exit(1);
  }
  outro("Done !");
}

function initTurboRepo(args: { path: string; appName: string; context: Context }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      await runProcess(
        "pnpm",
        [
          "dlx",
          `create-turbo@${Versions["create-turbo"]}`,
          args.path,
          "-m",
          "pnpm",
          "--skip-install",
          "--turbo-version",
          Versions.turbo,
        ],
        {
          onStdout: tmpLog.message,
          onStderr: tmpLog.message,
        },
      );
      const vsCodeSettingsPath = resolve(args.path, ".vscode");
      await fs.rm(vsCodeSettingsPath, { recursive: true, force: true });
      args.context.monoRepoInstaller = new MonoRepoInstaller({
        rootPath: args.path,
        appName: args.appName,
      });
      await updatePackage(resolve(args.path, "package.json"), (pkg) => {
        pkg.volta = pkg.volta || {};
        pkg.volta.node = Versions.node;

        pkg.engines = pkg.engines || {};
        pkg.engines.node = ">=22";

        pkg.packageManager = `pnpm@${Versions.pnpm}`;
      });
      return { success: true, message: "Turbo repo initialized" };
    } catch (err) {
      return { success: false, message: `Turbo repo initialization failed: ${err}` };
    }
  };
}

function deleteTurboExempleAppsAndPackages(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    const appsDocPath = resolve(args.path, "apps", "docs");
    const appsWebPath = resolve(args.path, "apps", "web");
    const packagesUiPath = resolve(args.path, "packages", "ui");
    const packagesEslintConfigPath = resolve(args.path, "packages", "eslint-config");

    try {
      await fs.rm(appsDocPath, { recursive: true, force: true });
      await fs.rm(appsWebPath, { recursive: true, force: true });
      await fs.rm(packagesUiPath, { recursive: true, force: true });
      await fs.rm(packagesEslintConfigPath, { recursive: true, force: true });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: delete Turbo example apps and packages" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: "Turbo example apps and packages deleted" };
    } catch (err) {
      return { success: false, message: `Failed to delete Turbo example apps: ${err}` };
    }
  };
}

function removeEslintAndPrettier(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    const packageJsonPath = resolve(args.path, "package.json");
    const turboJsonPath = resolve(args.path, "turbo.json");
    try {
      await updatePackage(packageJsonPath, (pkg) => {
        delete pkg.devDependencies?.prettier;
        delete pkg.scripts?.format;
        delete pkg.scripts?.lint;
      });
      await updateJsonFile(turboJsonPath, (json) => {
        delete json.tasks.lint;
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: remove ESLint and Prettier" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: "ESLint and Prettier removed" };
    } catch (err) {
      return { success: false, message: `Failed to remove ESLint and Prettier: ${err}` };
    }
  };
}

function setTypescriptVersion(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    const packageJsonPath = resolve(args.path, "package.json");
    try {
      await updatePackage(packageJsonPath, (pkg) => {
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies.typescript = Versions.typescript;
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: `chore: set TypeScript version to ${Versions.typescript}` },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `TypeScript version set to ${Versions.typescript}` };
    } catch (err) {
      return { success: false, message: `Failed to set TypeScript version: ${err}` };
    }
  };
}

function copyTypescriptConfigPackage(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      const templateDir = resolve(TEMPLATE_ROOT, "typescript-config", "package");
      const destDir = resolve(args.path, "packages", "typescript-config");
      await fs.rm(destDir, { recursive: true, force: true });
      await fs.cp(templateDir, destDir, { recursive: true });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: initialize TypeScript config package" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: "TypeScript config package initialized" };
    } catch (err) {
      return { success: false, message: `TypeScript config package initialization failed: ${err}` };
    }
  };
}

function copyEditorConfigFile(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      const templateFile = resolve(TEMPLATE_ROOT, "editorconfig", ".editorconfig");
      const destFile = resolve(args.path, ".editorconfig");
      await fs.copyFile(templateFile, destFile);
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: copy .editorconfig file" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: ".editorconfig file copied" };
    } catch (err) {
      return { success: false, message: `Failed to copy .editorconfig file: ${err}` };
    }
  };
}

function copyVsCodeSettingsFile(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      const template = resolve(TEMPLATE_ROOT, ".vscode");
      const destDir = resolve(args.path, ".vscode");
      await fs.stat(destDir).catch(async () => {
        await fs.mkdir(destDir, { recursive: true });
      });
      await fs.cp(template, destDir, { recursive: true });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: copy VSCode settings file" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: "VSCode settings file copied" };
    } catch (err) {
      return { success: false, message: `Failed to copy VSCode settings file: ${err}` };
    }
  };
}

function copyDockerIgnoreFile(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      const templateFile = resolve(TEMPLATE_ROOT, "docker", ".dockerignore");
      const destFile = resolve(args.path, ".dockerignore");
      await fs.copyFile(templateFile, destFile);
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: copy .dockerignore file" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: ".dockerignore file copied" };
    } catch (err) {
      return { success: false, message: `Failed to copy .dockerignore file: ${err}` };
    }
  };
}

function installBiome(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      const biomeConfigTemplatePath = resolve(TEMPLATE_ROOT, "biome", "biome.json");
      const destBiomeConfigPath = resolve(args.path, "biome.json");
      await fs.copyFile(biomeConfigTemplatePath, destBiomeConfigPath);
      await updateJsonFile(destBiomeConfigPath, (config) => {
        config.$schema = `https://biomejs.dev/schemas/${Versions["@biomejs/biome"]}/schema.json`;
      });
      await updatePackage(resolve(args.path, "package.json"), (pkg) => {
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies["@biomejs/biome"] = Versions["@biomejs/biome"];
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.lint = "biome ci";
        pkg.scripts.fix = "biome check --write";
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: install Biome" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: "Biome installed" };
    } catch (err) {
      return { success: false, message: `Failed to install Biome: ${err}` };
    }
  };
}

function createNextApp(args: { path: string; name: string; context: Context }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      if (!args.context.monoRepoInstaller) {
        throw new Error("MonoRepoInstaller not initialized");
      }
      const nextApp = await NextAppInstaller.create({
        path: args.path,
        name: args.name,
        logger: tmpLog,
        monorepo: args.context.monoRepoInstaller,
      });
      args.context.nextAppInstaller = nextApp;

      await nextApp.addTailwind();
      await nextApp.addDocker();
      await nextApp.addReactQuery();
      await nextApp.addI18n();
      await nextApp.addLogger();
      await nextApp.addEnvFileManagement();
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: `chore: create Next.js app ${args.name}` },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `Next.js app ${args.name} created` };
    } catch (err) {
      return { success: false, message: `Failed to create ${args.name} Next.js app: ${err}` };
    }
  };
}

function addDatabasePackage(args: { path: string; context: Context }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      if (!args.context.monoRepoInstaller) {
        throw new Error("MonoRepoInstaller not initialized");
      }
      if (!args.context.nextAppInstaller) {
        throw new Error("NextAppInstaller not initialized");
      }
      if (!args.context.tsUtilsInstaller) {
        throw new Error("TsUtilsInstaller not initialized");
      }
      if (!args.context.dockerComposeInstaller) {
        throw new Error("DockerComposeInstaller not initialized");
      }
      const databaseInstaller = await DatabaseInstaller.create({
        monoRepoInstaller: args.context.monoRepoInstaller,
        nextAppInstaller: args.context.nextAppInstaller,
        tsUtilsInstaller: args.context.tsUtilsInstaller,
        dockerComposeInstaller: args.context.dockerComposeInstaller,
      });
      args.context.databaseInstaller = databaseInstaller;

      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: create database package" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `Database package created` };
    } catch (err) {
      return { success: false, message: `Failed to create database package: ${err}` };
    }
  };
}

function addOrpcApiPackage(args: { path: string; context: Context }): TaskWithLogDefinition["task"] {
  return async () => {
    try {
      if (!args.context.monoRepoInstaller) {
        throw new Error("MonoRepoInstaller not initialized");
      }
      if (!args.context.nextAppInstaller) {
        throw new Error("NextAppInstaller not initialized");
      }
      args.context.orpcInstaller = await OrpcInstaller.create({
        monoRepoInstaller: args.context.monoRepoInstaller,
        nextAppInstaller: args.context.nextAppInstaller,
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles({ cwd: args.path, message: "chore: create ORPC API package" });
      }
      return { success: true, message: `ORPC API package created` };
    } catch (err) {
      return { success: false, message: `Failed to create ORPC API package: ${err}` };
    }
  };
}

function addDockerCompose(args: { path: string; context: Context }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      if (!args.context.monoRepoInstaller) {
        throw new Error("MonoRepoInstaller not initialized");
      }
      args.context.dockerComposeInstaller = await DockerComposeInstaller.create({
        path: path.resolve(args.context.monoRepoInstaller.rootPath, "docker-compose.yml"),
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: create docker-compose configuration" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `Docker-compose configuration created` };
    } catch (err) {
      return { success: false, message: `Failed to create docker-compose configuration: ${err}` };
    }
  };
}

function addBetterAuth(args: { path: string; context: Context }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      if (!args.context.betterAuthConfig?.enabled) {
        throw new Error("BetterAuth not enabled in context");
      }
      if (!args.context.monoRepoInstaller) {
        throw new Error("MonoRepoInstaller not initialized");
      }
      if (!args.context.nextAppInstaller) {
        throw new Error("NextAppInstaller not initialized");
      }
      if (!args.context.databaseInstaller) {
        throw new Error("DatabaseInstaller not initialized");
      }
      if (!args.context.orpcInstaller) {
        throw new Error("OrpcInstaller not initialized");
      }
      if (!args.context.dockerComposeInstaller) {
        throw new Error("DockerComposeInstaller not initialized");
      }

      await BetterAuthInstaller.create({
        nextAppInstaller: args.context.nextAppInstaller,
        providers: args.context.betterAuthConfig.providers,
        useDatabase: args.context.betterAuthConfig.useDatabase,
        databaseInstaller: args.context.databaseInstaller,
        orpcInstaller: args.context.orpcInstaller,
        monoRepoInstaller: args.context.monoRepoInstaller,
        dockerComposeInstaller: args.context.dockerComposeInstaller,
      });

      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: setup BetterAuth authentication" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `BetterAuth authentication setup` };
    } catch (err) {
      return { success: false, message: `Failed to setup BetterAuth authentication: ${err}` };
    }
  };
}

function installDependencies(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      await runProcess("pnpm", ["install"], {
        onStdout: tmpLog.message,
        onStderr: tmpLog.message,
        cwd: args.path,
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: install dependencies" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `Dependencies installed` };
    } catch (err) {
      return { success: false, message: `Failed to install dependencies: ${err}` };
    }
  };
}

function runPnpmFix(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      await runProcess("pnpm", ["fix"], {
        onStdout: tmpLog.message,
        onStderr: tmpLog.message,
        cwd: args.path,
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "style: lint" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `pnpm fix ran successfully` };
    } catch (err) {
      return { success: false, message: `Failed to run pnpm fix: ${err}` };
    }
  };
}

function generateDatabase(args: { path: string }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      await runProcess("pnpm", ["db:generate"], {
        onStdout: tmpLog.message,
        onStderr: tmpLog.message,
        cwd: args.path,
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: generate database schema" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `Database generated successfully` };
    } catch (err) {
      return { success: false, message: `Failed to generate database: ${err}` };
    }
  };
}

function addTsUtilsPackage(args: { path: string; context: Context }): TaskWithLogDefinition["task"] {
  return async (tmpLog) => {
    try {
      if (!args.context.monoRepoInstaller) {
        throw new Error("MonoRepoInstaller not initialized");
      }
      args.context.tsUtilsInstaller = await TsUtilsInstaller.create({
        monoRepoInstaller: args.context.monoRepoInstaller,
      });
      if (!SKIP_COMMIT) {
        await Git.commitAllFiles(
          { cwd: args.path, message: "chore: create ts-utils package" },
          { onStdout: tmpLog.message, onStderr: tmpLog.message },
        );
      }
      return { success: true, message: `ts-utils package created` };
    } catch (err) {
      return { success: false, message: `Failed to create ts-utils package: ${err}` };
    }
  };
}

// biome-ignore lint/correctness/noUnusedVariables: Sometimes useful
function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

main();
