import { resolve } from "node:path";
import process from "node:process";
import { cancel, intro, log, outro, text } from "@clack/prompts";
import color from "picocolors";
import { runProcess } from "./helpers/run-process";
import { type TaskWithLogDefinition, tasksWithLogs } from "./helpers/tasks-with-logs";

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
    task: async (tmpLog) => {
      try {
        await runProcess("pnpm", ["dlx", "create-turbo@latest", projectPath, "-m", "pnpm", "--skip-install"], {
          onStdout: tmpLog.message,
          onStderr: tmpLog.message,
        });
        return { sucess: true, message: "Turbo repo initialized" };
      } catch (err) {
        return { sucess: false, message: `Turbo repo initialization failed: ${err}` };
      }
    },
  });

  try {
    await tasksWithLogs(setupTasks);
  } catch (err) {
    cancel((err as Error).toString());
    process.exit(1);
  }
  outro("Done !");
}

// biome-ignore lint/correctness/noUnusedVariables: Sometimes useful
function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

main();
