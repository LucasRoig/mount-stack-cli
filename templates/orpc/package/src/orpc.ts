import { os } from "@orpc/server";
import type { AppDatabase } from "@repo/database";

export type OrpcContext = {
  database: AppDatabase;
};

export const o = os.$context<OrpcContext>();
