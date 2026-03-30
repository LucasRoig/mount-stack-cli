import "server-only";
import { drizzleSchema } from "@repo/database";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { singleton } from "@repo/ts-utils";
import { getEnv } from "../env/env";

export function getDatabaseClient() {
  const env = getEnv();
  const pool = singleton("pgPool", () => {
    return new Pool({
      connectionString: `postgresql://${env.server.PG_USER}:${env.secrets.PG_PASSWORD}@${env.server.PG_HOST}:${env.server.PG_PORT}/${env.server.PG_DATABASE}`,
    });
  });

  return singleton("drizzleInstance", () => {
    return drizzle({
      client: pool,
      schema: drizzleSchema,
    });
  });
}
