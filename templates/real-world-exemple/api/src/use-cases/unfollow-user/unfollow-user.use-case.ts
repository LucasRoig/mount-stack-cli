import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";

const logger = getLogger(["api", "unfollow-user"]);

const inputRequestSchema = z.object({
  userToUnfollowId: z.string(),
});
type InputRequest = z.infer<typeof inputRequestSchema>;

export const UnfollowUserProcedure = procedures.private
  .input(inputRequestSchema)
  .handler(async ({ input, context }) => {
    const uc = new UnfollowUserUseCase(context.database);
    const result = await uc
      .execute(input, context.session.user.id)
      .orTee((e) => logger.error(e))
      .mapErr((err) =>
        match(err)
          .with({ kind: "DATABASE_ERROR" }, () => new ORPCError("INTERNAL_SERVER_ERROR"))
          .exhaustive(),
      );
    return ResultUtils.unwrapOrThrow(result);
  });

class UnfollowUserUseCase {
  constructor(private db: AppDatabase) {}

  private unfollowUser(userId: string, userToUnfollowId: string) {
    return DbUtils.execute(() =>
      this.db
        .delete(drizzleSchema.userFollowers)
        .where(
          and(
            eq(drizzleSchema.userFollowers.userId, userToUnfollowId),
            eq(drizzleSchema.userFollowers.followerId, userId),
          ),
        ),
    );
  }

  public execute(input: InputRequest, currentUserId: string) {
    return this.unfollowUser(currentUserId, input.userToUnfollowId);
  }
}
