import { runProcess } from "./run-process"

export const Git = {
  commitAllFiles: (args: { cwd: string, message: string }) => {
    return runProcess("git", ["add", "."], { cwd: args.cwd })
      .then(() => runProcess("git", ["commit", "-m", args.message], { cwd: args.cwd }))
  }
}
