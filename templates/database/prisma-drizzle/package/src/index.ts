export { schema as drizzleSchema } from "./drizzle-generated/schema";

import { singleton } from "@repo/ts-utils";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { schema as drizzleSchema } from "./drizzle-generated/schema";

export type AppDatabase = NodePgDatabase<typeof drizzleSchema>;

export function getDatabaseClient(connectionString: string): AppDatabase {
  const pool = singleton("pgPool", () => {
    return new Pool({
      connectionString,
    });
  });

  return singleton("drizzleInstance", () => {
    return drizzle({
      client: pool,
      schema: drizzleSchema,
    });
  });
}
