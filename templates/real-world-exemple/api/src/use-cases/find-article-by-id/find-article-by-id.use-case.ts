import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import type { AppDatabase } from "@repo/database";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";
import { PUBLIC_USER_FIELDS_BOOLEAN } from "../../user-model";

const logger = getLogger(["api", "find-article-by-id"]);

const requestSchema = z.string();

export const FindArticleByIdProcedure = procedures.public
  .input(requestSchema)
  .errors({
    NOT_FOUND: {
      message: "Aricle not found",
      status: 404,
    },
  })
  .handler(async ({ context, input, errors }) => {
    const uc = new FindArticleByIdUseCase(context.database);
    const result = await uc
      .execute(input)
      .orTee((err) => logger.error(err))
      .mapErr((err) =>
        match(err)
          .with({ kind: "DATABASE_ERROR" }, () => new ORPCError("INTERNAL_SERVER_ERROR"))
          .with({ kind: "NOT_FOUND" }, () => errors.NOT_FOUND())
          .exhaustive(),
      );
    return ResultUtils.unwrapOrThrow(result);
  });

class FindArticleByIdUseCase {
  constructor(private database: AppDatabase) {}

  public execute(articleId: string) {
    return DbUtils.executeAndExpectDefined(
      () =>
        this.database.query.articles.findFirst({
          where: (articles, { eq }) => eq(articles.id, articleId),
          with: {
            author: {
              columns: PUBLIC_USER_FIELDS_BOOLEAN,
            },
            tags: true,
          },
        }),
      "NOT_FOUND",
    );
  }
}
