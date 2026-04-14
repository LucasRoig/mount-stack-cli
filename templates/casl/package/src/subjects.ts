import type { ForcedSubject, InferSubjects } from "@casl/ability";
import type { drizzleSchema } from "@repo/database";
import type { PgTable } from "drizzle-orm/pg-core";

type MakeSubject<TName extends string, T extends PgTable> = T["$inferInsert"] & ForcedSubject<TName>;

type User = MakeSubject<"User", typeof drizzleSchema.users>;

export type Subjects = InferSubjects<
  User, // User | Post | Comment, etc. Use type union to add all your subjects
  true
>;
export type DatabaseSubjects = Extract<Subjects, string>;
