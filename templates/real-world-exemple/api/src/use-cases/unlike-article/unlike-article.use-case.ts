import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";

const logger = getLogger(["api", "unlike-article"]);

const inputRequestSchema = z.object({
  articleId: z.string(),
});
type InputRequest = z.infer<typeof inputRequestSchema>;

export const UnlikeArticleProcedure = procedures.private
  .input(inputRequestSchema)
  .handler(async ({ input, context }) => {
    const uc = new UnlikeArticleUseCase(context.database);
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

class UnlikeArticleUseCase {
  constructor(private db: AppDatabase) {}

  private unlikeArticle(userId: string, articleId: string) {
    return DbUtils.execute(() =>
      this.db
        .delete(drizzleSchema.articlesLikes)
        .where(
          and(eq(drizzleSchema.articlesLikes.userId, userId), eq(drizzleSchema.articlesLikes.articleId, articleId)),
        ),
    );
  }

  public execute(input: InputRequest, currentUserId: string) {
    return this.unlikeArticle(currentUserId, input.articleId);
  }
}
