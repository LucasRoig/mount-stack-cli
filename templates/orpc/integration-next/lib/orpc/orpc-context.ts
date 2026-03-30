import "server-only";
import type { OrpcContext } from "@repo/api";
import { getDatabaseClient } from "../database";
export async function getORPCContext(): OrpcContext {
  return {
    database: getDatabaseClient(),
  };
}
