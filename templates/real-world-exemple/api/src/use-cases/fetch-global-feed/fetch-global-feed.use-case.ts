import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { count, desc, eq, sql } from "drizzle-orm";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";

const logger = getLogger(["api", "fetch-global-feed"]);

const requestSchema = z.object({
  limit: z.number().int().positive().max(100).default(10),
  page: z.number().int().positive().default(1),
});

export const FetchGlobalFeedProcedure = procedures.public.input(requestSchema).handler(async ({ context, input }) => {
  const uc = new FetchGlobalFeedUseCase(context.database);
  const result = await uc
    .execute(input, context.session?.user.id)
    .orTee((err) => logger.error(err))
    .mapErr((err) =>
      match(err)
        .with({ kind: "DATABASE_ERROR" }, () => new ORPCError("INTERNAL_SERVER_ERROR"))
        .exhaustive(),
    );
  return ResultUtils.unwrapOrThrow(result);
});

class FetchGlobalFeedUseCase {
  constructor(private database: AppDatabase) {}

  public execute(query: z.infer<typeof requestSchema>, currentUserId: string | undefined) {
    const offset = (query.page - 1) * query.limit;

    const withArticles = this.database
      .$with("articles")
      .as(
        this.database
          .select()
          .from(drizzleSchema.articles)
          .limit(query.limit)
          .offset(offset)
          .orderBy(desc(drizzleSchema.articles.createdAt)),
      );

    const withLikesCount = this.database.$with("articlesWithLikesCount").as(
      this.database
        .with(withArticles)
        .select({
          id: withArticles.id,
          title: withArticles.title,
          description: withArticles.description,
          createdAt: withArticles.createdAt,
          authorId: withArticles.authorId,
          likesCount: count(drizzleSchema.articlesLikes.userId).as("likesCount"),
        })
        .from(withArticles)
        .leftJoin(drizzleSchema.articlesLikes, eq(withArticles.id, drizzleSchema.articlesLikes.articleId))
        .groupBy(
          withArticles.id,
          withArticles.title,
          withArticles.description,
          withArticles.createdAt,
          withArticles.authorId,
        ),
    );

    let isLikedByCurrentUser = sql<boolean>`false`;
    if (currentUserId) {
      isLikedByCurrentUser = sql<boolean>`EXISTS (SELECT 1 FROM ${drizzleSchema.articlesLikes} WHERE ${drizzleSchema.articlesLikes.articleId} = ${withLikesCount.id} AND ${drizzleSchema.articlesLikes.userId} = ${currentUserId})`;
    }

    const withAuthors = this.database.$with("articlesWithAuthorsAndCount").as(
      this.database
        .with(withLikesCount)
        .select({
          id: withLikesCount.id,
          title: withLikesCount.title,
          description: withLikesCount.description,
          createdAt: withLikesCount.createdAt,
          authorId: withLikesCount.authorId,
          likesCount: withLikesCount.likesCount,
          authorName: drizzleSchema.users.name,
          authorPicture: drizzleSchema.users.image,
          isLikedByCurrentUser: isLikedByCurrentUser.as("isLikedByCurrentUser"),
        })
        .from(withLikesCount)
        .innerJoin(drizzleSchema.users, eq(withLikesCount.authorId, drizzleSchema.users.id)),
    );

    return DbUtils.execute(() =>
      this.database
        .with(withAuthors)
        .select({
          id: withAuthors.id,
          title: withAuthors.title,
          description: withAuthors.description,
          createdAt: withAuthors.createdAt,
          authorId: withAuthors.authorId,
          likesCount: withAuthors.likesCount,
          authorName: withAuthors.authorName,
          authorPicture: withAuthors.authorPicture,
          isLikedByCurrentUser: withAuthors.isLikedByCurrentUser,
          tags: sql<string[]>`ARRAY_AGG(${drizzleSchema.tags.name})`,
        })
        .from(withAuthors)
        .leftJoin(drizzleSchema.tagArticles, eq(withAuthors.id, drizzleSchema.tagArticles.articleId))
        .leftJoin(drizzleSchema.tags, eq(drizzleSchema.tagArticles.tagId, drizzleSchema.tags.id))
        .groupBy(
          withAuthors.id,
          withAuthors.title,
          withAuthors.description,
          withAuthors.createdAt,
          withAuthors.authorId,
          withAuthors.likesCount,
          withAuthors.authorName,
          withAuthors.authorPicture,
          withAuthors.isLikedByCurrentUser,
        ),
    );
  }
}
