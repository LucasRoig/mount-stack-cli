import { getDatabaseClient as db } from "@repo/database";
import { getEnv } from "./env";

export function getDatabaseClient() {
  const env = getEnv();
  return db(`postgresql://${env.PG_USER}:${env.PG_PASSWORD}@${env.PG_HOST}:${env.PG_PORT}/${env.PG_DATABASE}`);
}
