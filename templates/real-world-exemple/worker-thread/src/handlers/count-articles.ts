import { type AppDatabase, drizzleSchema, getDatabaseClient } from "@repo/database";
import { count } from "drizzle-orm/sql/functions/aggregate";
import type { Tinypool } from "tinypool";
import type { WebWorkerHandler } from "../types";

const COUNT_ARTICLES_MESSAGE_TYPE = "COUNT_ARTICLES_MESSAGE";

let database: AppDatabase | undefined;

function buildConnectionString(): string {
  const user = process.env.PG_USER;
  const password = process.env.PG_PASSWORD;
  const host = process.env.PG_HOST;
  const port = process.env.PG_PORT;
  const dbName = process.env.PG_DATABASE;

  if (!user || !password || !host || !port || !dbName) {
    throw new Error("Missing required PG environment variables (PG_USER, PG_PASSWORD, PG_HOST, PG_PORT, PG_DATABASE)");
  }

  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
}

function getDatabase(): AppDatabase {
  if (!database) {
    const connectionString = buildConnectionString();
    database = getDatabaseClient(connectionString);
  }
  return database;
}
export const CountArticlesHandler: WebWorkerHandler<undefined, number> = {
  workerApi: {
    acceptMessage: (message) => message.type === COUNT_ARTICLES_MESSAGE_TYPE,
    handleMessage: async () => {
      const db = getDatabase();
      const result = await db.select({ count: count() }).from(drizzleSchema.articles);
      return result[0]?.count ?? 0;
    },
  },
  start: (tinypool: Tinypool) => {
    return tinypool.run({ type: COUNT_ARTICLES_MESSAGE_TYPE, payload: undefined });
  },
};
