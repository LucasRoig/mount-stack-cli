import { getLogger } from "@logtape/logtape";
import { ORPCError, os } from "@orpc/server";
import type { AppDatabase, drizzleSchema } from "@repo/database";
import { defineAbilityFor } from "@repo/rbac";

const authMiddlewareLogger = getLogger(["api", "orpc", "auth-middleware"]);

export type OrpcContext = {
  database: AppDatabase;
  session:
  | {
    user: {
      id: string;
      email: string;
      role: (typeof drizzleSchema.users.role.enumValues)[number];
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

  try {
    const { appAbility, databaseAbility } = defineAbilityFor({
      role: context.session.user.role, // role
      id: context.session.user.id,
    });
    return next({
      context: {
        session: context.session,
        appAbility,
        databaseAbility,
      },
    });
  } catch (err) {
    authMiddlewareLogger.error("Error in auth middleware {error}", { error: err });
    throw new ORPCError("INTERNAL_SERVER_ERROR");
  }
});

const privateProcedure = o.use(authMiddleware);
const publicProcedure = o;

export const procedures = {
  private: privateProcedure,
  public: publicProcedure,
};
