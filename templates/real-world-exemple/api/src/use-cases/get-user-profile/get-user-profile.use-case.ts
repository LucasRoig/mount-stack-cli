import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import type { AppDatabase } from "@repo/database";
import { match } from "ts-pattern";
import z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";

const logger = getLogger(["api", "get-user-profile"]);

const inputRequestSchema = z.object({
  username: z.string(),
});
type InputRequest = z.infer<typeof inputRequestSchema>;

export const GetUserProfileProcedure = procedures.public
  .input(inputRequestSchema)
  .errors({
    NOT_FOUND: {
      message: "User not found",
      status: 404,
    },
  })
  .handler(async ({ input, context, errors }) => {
    context.database;
    const uc = new GetUserProfileUseCase(context.database);
    const result = await uc
      .execute(input)
      .orTee((e) => logger.error(e))
      .mapErr((err) =>
        match(err)
          .with({ kind: "DATABASE_ERROR" }, () => new ORPCError("INTERNAL_SERVER_ERROR"))
          .with({ kind: "USER_NOT_FOUND" }, () => errors.NOT_FOUND())
          .exhaustive(),
      );
    return ResultUtils.unwrapOrThrow(result);
  });

class GetUserProfileUseCase {
  constructor(private db: AppDatabase) { }
  public execute(input: InputRequest) {
    return DbUtils.executeAndExpectDefined(
      () =>
        this.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.name, input.username),
        }),
      "USER_NOT_FOUND",
    );
  }
}
