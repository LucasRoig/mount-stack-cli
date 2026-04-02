import "server-only";
import type { OrpcContext } from "@repo/api";
import { getDatabaseClient } from "../database";

// biome-ignore lint/suspicious/useAwait: getDatabaseClient() might do some async initialization in the future, so we want to be able to await it if needed without changing the function signature.
export async function getORPCContext(): Promise<OrpcContext> {
  return {
    database: getDatabaseClient(),
  };
}
