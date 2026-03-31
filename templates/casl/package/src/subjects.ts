import type { ForcedSubject, InferSubjects } from "@casl/ability";
import type { drizzleSchema } from "@repo/database";
import type { NullToUndefined } from "@repo/ts-utils";
import type { PgTable } from "drizzle-orm/pg-core";

type MakeSubject<TName extends string, T extends PgTable> = NullToUndefined<T["$inferInsert"]> & ForcedSubject<TName>;

type User = MakeSubject<"User", typeof drizzleSchema.users>;

export type Subjects = InferSubjects<
  User, // User | Post | Comment, etc. Use type union to add all your subjects
  true
>;
export type DatabaseSubjects = Extract<Subjects, string>;
