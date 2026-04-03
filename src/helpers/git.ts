import { runProcess } from "./run-process";

export const Git = {
  commitAllFiles: (
    args: { cwd: string; message: string },
    options: { onStdout?: (msg: string) => void; onStderr?: (msg: string) => void; cwd?: string } = {},
  ) => {
    return runProcess("git", ["add", "."], { cwd: args.cwd, ...options }).then(() =>
      runProcess("git", ["commit", "-m", args.message], { cwd: args.cwd, ...options }),
    );
  },

  addSubmodule: (
    args: { cwd: string; repo: string; branch: string; directoryName: string },
    options: { onStdout?: (msg: string) => void; onStderr?: (msg: string) => void; cwd?: string } = {},
  ) => {
    return runProcess("git", ["submodule", "add", "-b", args.branch, args.repo, args.directoryName], {
      cwd: args.cwd,
      ...options,
    });
  },
};
