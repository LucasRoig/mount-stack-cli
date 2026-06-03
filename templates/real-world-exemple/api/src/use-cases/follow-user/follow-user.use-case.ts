import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { okAsync } from "neverthrow";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";

const logger = getLogger(["api", "follow-user"]);

const inputRequestSchema = z.object({
  userToFollowId: z.string(),
});
type InputRequest = z.infer<typeof inputRequestSchema>;

export const FollowUserProcedure = procedures.private.input(inputRequestSchema).handler(async ({ input, context }) => {
  const uc = new FollowUserUseCase(context.database);
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

class FollowUserUseCase {
  constructor(private db: AppDatabase) {}

  private isAlreadyFollowing(userId: string, userToFollowId: string) {
    return DbUtils.execute(() =>
      this.db.query.userFollowers.findFirst({
        where: (userFollowers, { and, eq }) =>
          and(eq(userFollowers.userId, userToFollowId), eq(userFollowers.followerId, userId)),
      }),
    ).map((res) => Boolean(res));
  }

  private followUser(userId: string, userToFollowId: string) {
    return DbUtils.execute(() =>
      this.db.insert(drizzleSchema.userFollowers).values({
        userId: userToFollowId,
        followerId: userId,
      }),
    );
  }

  public execute(input: InputRequest, currentUserId: string) {
    return this.isAlreadyFollowing(currentUserId, input.userToFollowId).andThen((isFollowing) => {
      if (isFollowing) {
        return okAsync();
      } else {
        return this.followUser(currentUserId, input.userToFollowId);
      }
    });
  }
}
