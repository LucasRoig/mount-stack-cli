import { ORPCError, os } from "@orpc/server";
import type { AppDatabase } from "@repo/database";

export type OrpcContext = {
  database: AppDatabase;
  session: {
    user: {
      id: string;
      email: string;
    }
  } | undefined;
};


export const o = os.$context<OrpcContext>();

const authMiddleware = o.middleware(({ context, next }) => {
  if (!context.session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be logged in to access this resource.",
    });
  }

  return next({
    context: {
      session: context.session,
    },
  });
});

const privateProcedure = o.use(authMiddleware);
const publicProcedure = o;

export const procedures = {
  private: privateProcedure,
  public: publicProcedure,
}
