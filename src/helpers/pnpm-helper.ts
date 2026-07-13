import * as Versions from "../versions.json";
import { type RunProcessOptions, runProcess } from "./run-process";

export function runPnpm(args: string[], options: RunProcessOptions = {}) {
  return runProcess("mise", ["exec", `pnpm@${Versions.pnpm}`, `node@${Versions.node}`, "--", "pnpm", ...args], options);
}
