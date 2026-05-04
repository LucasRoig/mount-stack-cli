import { drizzleSchema } from "@repo/database";
import { singleton } from "@repo/ts-utils";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "./env";

export function getDatabaseClient() {
  const env = getEnv();
  const pool = singleton("pgPool", () => {
    return new Pool({
      connectionString: `postgresql://${env.PG_USER}:${env.PG_PASSWORD}@${env.PG_HOST}:${env.PG_PORT}/${env.PG_DATABASE}`,
    });
  });

  return singleton("drizzleInstance", () => {
    return drizzle({
      client: pool,
      schema: drizzleSchema,
    });
  });
}
