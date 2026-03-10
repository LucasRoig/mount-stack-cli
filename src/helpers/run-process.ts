import { resolve as resolvePath } from "node:path";
import { x } from "tinyexec";
export function runProcess(
  command: string,
  args: string[],
  {
    onStdout,
    onStderr,
    cwd,
  }: { onStdout?: (msg: string) => void; onStderr?: (msg: string) => void; cwd?: string } = {},
) {
  return new Promise<void>((resolve, reject) => {
    try {
      const proc = x(command, args, {
        throwOnError: true,
        nodeOptions: {
          stdio: "pipe",
          cwd: resolvePath(cwd || process.cwd()),
        },
      });
      proc.process?.once("exit", (code) => (code === 0 ? resolve() : reject(code)));
      if (onStdout) {
        proc.process?.stdout?.on("data", (msg) => {
          if (msg.toString().trim() === "") return;
          onStdout(msg.toString());
        });
      }
      if (onStderr) {
        proc.process?.stderr?.on("data", (msg) => {
          if (msg.toString().trim() === "") return;
          onStderr(msg.toString());
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}
