import fs from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { cancel, intro, log, outro, text } from "@clack/prompts";
import color from "picocolors";
import { updatePackage } from "pkg-types";
import { TEMPLATE_ROOT } from "./consts";
import { updateJsonFile } from "./helpers/json-file";
import { runProcess } from "./helpers/run-process";
import { type TaskWithLogDefinition, tasksWithLogs } from "./helpers/tasks-with-logs";
import Versions from "./versions.json";

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
  log.info(`Project path ${projectPath}`);

  const setupTasks: TaskWithLogDefinition[] = [];

  setupTasks.push({
    title: "Initializing turbo repo...",
    task: initTurboRepo({ path: projectPath }),
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
    title: "Installing Biome...",
    task: installBiome({ path: projectPath }),
  });

  setupTasks.push({
    title: "Creating Next.js app...",
    task: createNextApp({ path: projectPath, name: "web-exemple" }),
  });

  try {
    await tasksWithLogs(setupTasks);
  } catch (err) {
    cancel((err as Error).toString());
    process.exit(1);
  }
  outro("Done !");
}

function initTurboRepo(args: { path: string }): TaskWithLogDefinition["task"] {
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
      return { success: true, message: "Turbo repo initialized" };
    } catch (err) {
      return { success: false, message: `Turbo repo initialization failed: ${err}` };
    }
  };
}

function deleteTurboExempleAppsAndPackages(args: { path: string }): TaskWithLogDefinition["task"] {
  return async () => {
    const appsDocPath = resolve(args.path, "apps", "docs");
    const appsWebPath = resolve(args.path, "apps", "web");
    const packagesUiPath = resolve(args.path, "packages", "ui");
    const packagesEslintConfigPath = resolve(args.path, "packages", "eslint-config");

    try {
      await fs.rm(appsDocPath, { recursive: true, force: true });
      await fs.rm(appsWebPath, { recursive: true, force: true });
      await fs.rm(packagesUiPath, { recursive: true, force: true });
      await fs.rm(packagesEslintConfigPath, { recursive: true, force: true });
      return { success: true, message: "Turbo example apps and packages deleted" };
    } catch (err) {
      return { success: false, message: `Failed to delete Turbo example apps: ${err}` };
    }
  };
}

function removeEslintAndPrettier(args: { path: string }): TaskWithLogDefinition["task"] {
  return async () => {
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
      return { success: true, message: "ESLint and Prettier removed" };
    } catch (err) {
      return { success: false, message: `Failed to remove ESLint and Prettier: ${err}` };
    }
  };
}

function setTypescriptVersion(args: { path: string }): TaskWithLogDefinition["task"] {
  return async () => {
    const packageJsonPath = resolve(args.path, "package.json");
    try {
      await updatePackage(packageJsonPath, (pkg) => {
        pkg.devDependencies!.typescript = Versions.typescript;
      });
      return { success: true, message: `TypeScript version set to ${Versions.typescript}` };
    } catch (err) {
      return { success: false, message: `Failed to set TypeScript version: ${err}` };
    }
  };
}

function copyTypescriptConfigPackage(args: { path: string }): TaskWithLogDefinition["task"] {
  return async () => {
    try {
      const templateDir = resolve(TEMPLATE_ROOT, "typescript-config", "package");
      const destDir = resolve(args.path, "packages", "typescript-config");
      await fs.rm(destDir, { recursive: true, force: true });
      await fs.cp(templateDir, destDir, { recursive: true });
      return { success: true, message: "TypeScript config package initialized" };
    } catch (err) {
      return { success: false, message: `TypeScript config package initialization failed: ${err}` };
    }
  };
}

function copyEditorConfigFile(args: { path: string }): TaskWithLogDefinition["task"] {
  return async () => {
    try {
      const templateFile = resolve(TEMPLATE_ROOT, "editorconfig", ".editorconfig");
      const destFile = resolve(args.path, ".editorconfig");
      await fs.copyFile(templateFile, destFile);
      return { success: true, message: ".editorconfig file copied" };
    } catch (err) {
      return { success: false, message: `Failed to copy .editorconfig file: ${err}` };
    }
  };
}

function copyVsCodeSettingsFile(args: { path: string }): TaskWithLogDefinition["task"] {
  return async () => {
    try {
      const template = resolve(TEMPLATE_ROOT, ".vscode");
      const destDir = resolve(args.path, ".vscode");
      await fs.stat(destDir).catch(async () => {
        await fs.mkdir(destDir, { recursive: true });
      });
      await fs.cp(template, destDir, { recursive: true });
      return { success: true, message: "VSCode settings file copied" };
    } catch (err) {
      return { success: false, message: `Failed to copy VSCode settings file: ${err}` };
    }
  };
}

function installBiome(args: { path: string }): TaskWithLogDefinition["task"] {
  return async () => {
    try {
      const biomeConfigTemplatePath = resolve(TEMPLATE_ROOT, "biome", "biome.json");
      const destBiomeConfigPath = resolve(args.path, "biome.json");
      await fs.copyFile(biomeConfigTemplatePath, destBiomeConfigPath);
      await updateJsonFile(destBiomeConfigPath, (config) => {
        config.$schema = `https://biomejs.dev/schemas/${Versions.biome}/schema.json`;
      });
      await updatePackage(resolve(args.path, "package.json"), (pkg) => {
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies.biome = Versions.biome;
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.lint = "biome ci";
        pkg.scripts.fix = "biome check --write";
      });
      return { success: true, message: "Biome installed" };
    } catch (err) {
      return { success: false, message: `Failed to install Biome: ${err}` };
    }
  };
}

function createNextApp(args: { path: string; name: string }): TaskWithLogDefinition["task"] {
  async function addTailwindToNextApp(args: { appPath: string }) {
    const packageJsonPath = resolve(args.appPath, "package.json");
    await updatePackage(packageJsonPath, (pkg) => {
      pkg.devDependencies = pkg.devDependencies || {};
      pkg.devDependencies.tailwindcss = Versions.tailwindcss;
      pkg.devDependencies.postcss = Versions.postcss;
      pkg.devDependencies["@tailwindcss/postcss"] = Versions["@tailwindcss/postcss"];
    });
    const postCssConfigTemplatePath = resolve(TEMPLATE_ROOT, "tailwind", "postcss.config.mjs");
    const destPostCssConfigPath = resolve(args.appPath, "postcss.config.mjs");
    await fs.copyFile(postCssConfigTemplatePath, destPostCssConfigPath);

    const cssTemplateFile = resolve(TEMPLATE_ROOT, "tailwind", "globals.css");
    const destCssFile = resolve(args.appPath, "src", "app", "globals.css");
    await fs.copyFile(cssTemplateFile, destCssFile);
  }

  return async (tmpLog) => {
    try {
      const appPath = resolve(args.path, "apps", args.name);
      await runProcess(
        "pnpm",
        [
          "dlx",
          `create-next-app@${Versions["create-next-app"]}`,
          appPath,
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
          "@/*"
        ],
        {
          onStdout: tmpLog.message,
          onStderr: tmpLog.message,
        },
      );
      const tsConfigTemplatePath = resolve(TEMPLATE_ROOT, "next-app", "tsconfig.json");
      const destTsConfigPath = resolve(appPath, "tsconfig.json");
      await fs.copyFile(tsConfigTemplatePath, destTsConfigPath);

      const packageJsonPath = resolve(appPath, "package.json");
      await updatePackage(packageJsonPath, (pkg) => {
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies.typescript = Versions.typescript;

        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies.next = `^${pkg.dependencies.next}`;
        pkg.dependencies.react = `^${pkg.dependencies.react}`;
        pkg.dependencies["react-dom"] = `^${pkg.dependencies["react-dom"]}`;

        pkg.scripts = pkg.scripts || {};
        pkg.scripts["check-types"] = "next typegen && tsc --noEmit";
        pkg.scripts.lint = "biome lint";
        pkg.scripts.build = "pnpm lint && next build";

        pkg.type = "module";
      });

      const cssTemplateFile = resolve(TEMPLATE_ROOT, "next-app", "globals.css");
      const destCssFile = resolve(appPath, "src", "app", "globals.css");
      await fs.copyFile(cssTemplateFile, destCssFile);

      const mainLayoutTemplatePath = resolve(TEMPLATE_ROOT, "next-app", "layout.tsx");
      const destMainLayoutPath = resolve(appPath, "src", "app", "layout.tsx");
      await fs.copyFile(mainLayoutTemplatePath, destMainLayoutPath);

      await addTailwindToNextApp({ appPath });

      return { success: true, message: `Next.js app ${args.name} created` };
    } catch (err) {
      return { success: false, message: `Failed to create ${args.name} Next.js app: ${err}` };
    }
  };
}

// biome-ignore lint/correctness/noUnusedVariables: Sometimes useful
function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

main();
