export { schema as drizzleSchema } from "./drizzle-generated/schema";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { schema as drizzleSchema } from "./drizzle-generated/schema";

export type AppDatabase = NodePgDatabase<typeof drizzleSchema>;
