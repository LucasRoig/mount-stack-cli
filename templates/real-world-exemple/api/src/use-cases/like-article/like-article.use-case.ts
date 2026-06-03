import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { okAsync } from "neverthrow";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";

const logger = getLogger(["api", "like-article"]);

const inputRequestSchema = z.object({
  articleId: z.string(),
});
type InputRequest = z.infer<typeof inputRequestSchema>;

export const LikeArticleProcedure = procedures.private.input(inputRequestSchema).handler(async ({ input, context }) => {
  const uc = new LikeArticleUseCase(context.database);
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

class LikeArticleUseCase {
  constructor(private db: AppDatabase) {}

  private isAlreadyLiked(userId: string, articleId: string) {
    return DbUtils.execute(() =>
      this.db.query.articlesLikes.findFirst({
        where: (articleLikes, { and, eq }) =>
          and(eq(articleLikes.userId, userId), eq(articleLikes.articleId, articleId)),
      }),
    ).map((res) => Boolean(res));
  }

  private likeArticle(userId: string, articleId: string) {
    return DbUtils.execute(() =>
      this.db.insert(drizzleSchema.articlesLikes).values({
        userId,
        articleId,
      }),
    );
  }

  public execute(input: InputRequest, currentUserId: string) {
    return this.isAlreadyLiked(currentUserId, input.articleId).andThen((isLiked) => {
      if (isLiked) {
        return okAsync();
      } else {
        return this.likeArticle(currentUserId, input.articleId);
      }
    });
  }
}
