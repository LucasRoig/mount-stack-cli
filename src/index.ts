import { intro, outro, log, text } from "@clack/prompts";
import { resolve } from "node:path";
import color from "picocolors";

async function main() {
  const cwd = process.cwd();
  intro(color.inverse("Mount stack"));
  log.info(`Current directory ${cwd}`)
  const relativeProjectPath = await text({
    message: "Where would you like to create your project ?",
    defaultValue: "./my-app",
    placeholder: "./my-app",
    validate: (value: string) => {
      if (!value.startsWith(".")) {
        return "Relative path should start with a dot ."
      }
      try {
        resolve(cwd, value)
      } catch (e) {
        return "Invalid path"
      }
    }
  })
  const projectPath = resolve(cwd, relativeProjectPath as string)
  log.info(`Project path ${projectPath}`)
  outro("Done !");
}

main();
