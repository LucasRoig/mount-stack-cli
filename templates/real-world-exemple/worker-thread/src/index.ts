import path from "node:path";
import { Tinypool } from "tinypool";

let pool: Tinypool | undefined;

const isDev = process.env.NODE_ENV === "development";

function getWorkerPath(): string {
  if (import.meta.dirname) {
    // Works when package is externalized (not bundled by Turbopack)
    // Dev Mode !
    return path.join(import.meta.dirname, "..", "dist", "worker.js");
  }
  // Fallback when bundled (Turbopack): resolve from project root
  // In Docker standalone: process.cwd() = /app/apps/web-exemple
  return path.join(process.cwd(), "..", "..", "packages", "worker-thread", "dist", "worker.js");
}

function getPool(): Tinypool {
  if (!pool) {
    pool = new Tinypool({
      filename: getWorkerPath(),
      // In dev mode, terminate workers after each task so they pick up
      // the latest rebuilt worker.js on the next request (hot reload).
      ...(isDev
        ? { isolateWorkers: true, minThreads: 0, maxThreads: 1 }
        : { minThreads: 1, maxThreads: 2, idleTimeout: 30000 }),
    });
  }
  return pool;
}

export function runCountUsers(): Promise<number> {
  return getPool().run(undefined);
}

export async function destroyWorkerPool(): Promise<void> {
  if (pool) {
    await pool.destroy();
    pool = undefined;
  }
}
