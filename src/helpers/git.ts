import { runProcess } from "./run-process";

export const Git = {
  commitAllFiles: (args: { cwd: string; message: string }, options: { onStdout?: (msg: string) => void; onStderr?: (msg: string) => void; cwd?: string } = {}) => {
    return runProcess("git", ["add", "."], { cwd: args.cwd, ...options }).then(() =>
      runProcess("git", ["commit", "-m", args.message], { cwd: args.cwd, ...options }),
    );
  },
};
