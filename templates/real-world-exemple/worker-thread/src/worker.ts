import { type AppDatabase, drizzleSchema } from "@repo/database";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

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
    const pool = new pg.Pool({ connectionString: buildConnectionString() });
    database = drizzle({ client: pool, schema: drizzleSchema });
  }
  return database;
}

export default async function countUsers(): Promise<number> {
  const db = getDatabase();
  const result = await db.select({ count: count() }).from(drizzleSchema.users);
  return result[0]?.count ?? 0;
}
