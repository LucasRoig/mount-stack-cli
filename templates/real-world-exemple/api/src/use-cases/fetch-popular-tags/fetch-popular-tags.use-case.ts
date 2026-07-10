import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { count, desc, eq } from "drizzle-orm";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";

const logger = getLogger(["api", "fetch-popular-tags"]);

const requestSchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
});

export const FetchPopularTagsProcedure = procedures.public.input(requestSchema).handler(async ({ context, input }) => {
  const uc = new FetchPopularTagsUseCase(context.database);
  const result = await uc
    .execute(input)
    .orTee((err) => logger.error(err))
    .mapErr((err) =>
      match(err)
        .with({ kind: "DATABASE_ERROR" }, () => new ORPCError("INTERNAL_SERVER_ERROR"))
        .exhaustive(),
    );
  return ResultUtils.unwrapOrThrow(result);
});

class FetchPopularTagsUseCase {
  constructor(private database: AppDatabase) {}

  public execute(query: z.infer<typeof requestSchema>) {
    const withTagsAndCount = this.database.$with("tagsAndCount").as(
      this.database
        .select({
          id: drizzleSchema.tags.id,
          name: drizzleSchema.tags.name,
          count: count(drizzleSchema.tagArticles.articleId).as("count"),
        })
        .from(drizzleSchema.tags)
        .leftJoin(drizzleSchema.tagArticles, eq(drizzleSchema.tagArticles.tagId, drizzleSchema.tags.id))
        .groupBy(drizzleSchema.tags.id, drizzleSchema.tags.name),
    );

    return DbUtils.execute(() =>
      this.database
        .with(withTagsAndCount)
        .select({
          id: withTagsAndCount.id,
          name: withTagsAndCount.name,
        })
        .from(withTagsAndCount)
        .orderBy(desc(withTagsAndCount.count))
        .limit(query.limit),
    );
  }
}
