import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { createId } from "@paralleldrive/cuid2";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { type AppAbility, ForbiddenResult } from "@repo/rbac";
import { ok } from "neverthrow";
import { match } from "ts-pattern";
import type z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { inputValidationFailedError } from "../../@utils/orpc-errors-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";
import { ArticleSchema } from "../../schemas";

const logger = getLogger(["api", "create-article"]);

export const CreateArticleProcedure = procedures.private
  .input(ArticleSchema)
  .errors({
    ...inputValidationFailedError(ArticleSchema.keyof()),
  })
  .handler(({ input, context }) => {
    return context.database
      .transaction(async (tx) => {
        const uc = new CreateArticleUseCase(tx, context.appAbility);
        const result = (await uc.execute(context.session.user.id, input))
          .orTee((err) => logger.error(err))
          .mapErr((err) =>
            match(err)
              .with(
                { kind: "DATABASE_ERROR" },
                { kind: "DB_RETURNED_TOO_MANY_VALUES" },
                { kind: "DB_RETURNED_ZERO_VALUES" },
                () => new ORPCError("INTERNAL_SERVER_ERROR"),
              )
              .with({ kind: "FORBIDDEN" }, () => new ORPCError("FORBIDDEN"))
              .exhaustive(),
          );
        return ResultUtils.unwrapOrThrow(result);
      })
      .catch((err) => {
        logger.error(err);
        throw err;
      });
  });

class CreateArticleUseCase {
  constructor(
    private database: AppDatabase,
    private ability: AppAbility,
  ) {}

  private getTagIds(tags: string) {
    const tagList = tags
      .split(" ")
      .map((t) => t.trim())
      .filter((tag) => tag.length > 0);
    return DbUtils.execute(() =>
      this.database.query.tags
        .findMany({
          where: (tag, { inArray }) => inArray(tag.name, tagList),
        })
        .then((existingTags) => new Map(existingTags.map((tag) => [tag.name, tag.id]))),
    )
      .map((existingTagsMap) => {
        const existingIds: string[] = [];
        const tagsToCreate: string[] = [];
        for (const tag of tagList) {
          const existingId = existingTagsMap.get(tag);
          if (existingId) {
            existingIds.push(existingId);
          } else {
            tagsToCreate.push(tag);
          }
        }
        return { existingIds, tagsToCreate };
      })
      .andThen(({ existingIds, tagsToCreate }) => {
        if (tagsToCreate.length > 0) {
          return ForbiddenResult.from(this.ability)
            .check("create", "Tag")
            .asyncAndThen(() =>
              DbUtils.execute(() =>
                this.database
                  .insert(drizzleSchema.tags)
                  .values(tagsToCreate.map((name) => ({ id: createId(), name, createdAt: new Date() })))
                  .returning(),
              ).map((created) => created.map((tag) => tag.id)),
            )
            .map((newTagIds) => [...newTagIds, ...existingIds]);
        } else {
          return ok(existingIds);
        }
      });
  }

  execute(userId: string, formValues: z.infer<typeof ArticleSchema>) {
    return ForbiddenResult.from(this.ability)
      .check("create", "Article")
      .asyncAndThen(() => this.getTagIds(formValues.tags))
      .andThen((tagIds) =>
        DbUtils.executeAndReturnOneRow(() =>
          this.database
            .insert(drizzleSchema.articles)
            .values({
              id: createId(),
              title: formValues.title,
              description: formValues.description,
              body: formValues.body,
              authorId: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning(),
        ).andThrough((article) =>
          DbUtils.executeIf(tagIds.length > 0, () =>
            this.database
              .insert(drizzleSchema.tagArticles)
              .values(tagIds.map((tagId) => ({ articleId: article.id, tagId }))),
          ),
        ),
      );
    // Check if the user has the permission to create an article
  }
}
