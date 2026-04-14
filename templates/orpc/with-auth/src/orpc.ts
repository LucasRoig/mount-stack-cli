import { ORPCError, os } from "@orpc/server";
import type { AppDatabase } from "@repo/database";
import { defineAbilityFor } from "@repo/rbac";

export type OrpcContext = {
  database: AppDatabase;
  session:
  | {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
  | undefined;
};

export const o = os.$context<OrpcContext>();

const authMiddleware = o.middleware(({ context, next }) => {
  if (!context.session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be logged in to access this resource.",
    });
  }

  const { appAbility, databaseAbility } = defineAbilityFor({
    type: context.session.user.role, // role
    id: context.session.user.id,
  });

  return next({
    context: {
      session: context.session,
      appAbility,
      databaseAbility,
    },
  });
});

const privateProcedure = o.use(authMiddleware);
const publicProcedure = o;

export const procedures = {
  private: privateProcedure,
  public: publicProcedure,
};
