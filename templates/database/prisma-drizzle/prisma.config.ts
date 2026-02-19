import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Type Safe env() helper
// Does not replace the need for dotenv
const PG_USER = env("PG_USER");
const PG_PASSWORD = env("PG_PASSWORD");
const PG_HOST = env("PG_HOST");
const PG_PORT = env("PG_PORT");
const PG_DATABASE = env("PG_DATABASE");

export default defineConfig({
  // the main entry for your schema
  schema: "prisma/schema.prisma",
  // where migrations should be generated
  // what script to run for "prisma db seed"
  migrations: {
    path: "prisma/migrations",
  },
  // The database URL
  datasource: {
    url: `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}?schema=public`,
  },
});
