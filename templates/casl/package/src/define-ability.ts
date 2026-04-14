import { AbilityBuilder, type MatchConditions, PureAbility } from "@casl/ability";
import { drizzleSchema } from "@repo/database";
import { eq } from "drizzle-orm";
import { DatabaseAbilityBuilder } from "./core/database-ability";
import type { DatabaseSubjects, Subjects } from "./subjects";

export type Actions = "create" | "read" | "update" | "delete";

export type AppAbility = PureAbility<[Actions, Subjects], MatchConditions>;

type Roles = "user" | "admin";

type User = {
  type: string;
  id: string;
};

type DefinePermissions = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
  databaseAbilityBuilder: DatabaseAbilityBuilder<Actions, DatabaseSubjects>,
) => void;

const rolePermissions = {
  // By default everything is forbidden
  user: (user, { can }, dbAbilityBuilder) => {
    can(["read", "update"], "User", (u) => u.id === user.id);
    dbAbilityBuilder.can(["read", "update"], "User", eq(drizzleSchema.users.id, user.id));
  },
  admin: (_user, { can }, dbAbilityBuilder) => {
    can(["read", "create", "update", "delete"], "User");
    dbAbilityBuilder.can(["read", "create", "update", "delete"], "User");
  },
} satisfies Record<Roles, DefinePermissions>;

const lambdaMatcher = (matchConditions: MatchConditions) => matchConditions;

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder<AppAbility>(PureAbility);
  const databaseAbilityBuilder = new DatabaseAbilityBuilder<Actions, DatabaseSubjects>();
  //TODO: get role from user
  const role = user.type as Roles;
  if (typeof rolePermissions[role] === "function") {
    rolePermissions[role](user, builder, databaseAbilityBuilder);
  } else {
    throw new Error(`Trying to use unknown role "${role}"`);
  }

  return {
    appAbility: builder.build({ conditionsMatcher: lambdaMatcher }),
    databaseAbility: databaseAbilityBuilder.build(),
  };
}
