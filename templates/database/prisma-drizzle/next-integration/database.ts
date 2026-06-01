import "server-only";
import { getDatabaseClient as db } from "@repo/database";
import { getEnv } from "../env/env";

export function getDatabaseClient() {
  const env = getEnv();
  const connectionString = `postgresql://${env.server.PG_USER}:${env.secrets.PG_PASSWORD}@${env.server.PG_HOST}:${env.server.PG_PORT}/${env.server.PG_DATABASE}`;
  return db(connectionString);
}
