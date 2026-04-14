import { getLogger } from "@logtape/logtape";
import { ORPCError } from "@orpc/server";
import { type AppDatabase, drizzleSchema } from "@repo/database";
import { type AppAbility, ForbiddenResult, subject } from "@repo/rbac";
import { eq } from "drizzle-orm";
import { ok } from "neverthrow";
import { match } from "ts-pattern";
import type z from "zod";
import { DbUtils } from "../../@utils/database-utils";
import { inputValidationFailedError } from "../../@utils/orpc-errors-utils";
import { ResultUtils } from "../../@utils/result-utils";
import { procedures } from "../../orpc";
import { UpdateMyProfileSchema } from "../../schemas";

const logger = getLogger(["api", "update-my-profile"]);

export const UpdateMyProfileProcedure = procedures.private
  .input(UpdateMyProfileSchema)
  .errors({
    USERNAME_ALREADY_TAKEN: {
      message: "Username is already taken",
      status: 409,
    },
    ...inputValidationFailedError(UpdateMyProfileSchema.keyof()),
  })
  .handler(async ({ input, context, errors }) => {
    const uc = new UpdateMyProfileUseCase(context.database, context.appAbility);
    const result = await uc
      .execute(context.session.user.id, input)
      .orTee((e) => logger.error(e))
      .mapErr((err) =>
        match(err)
          .with(
            { kind: "DATABASE_ERROR" },
            { kind: "DB_RETURNED_TOO_MANY_VALUES" },
            { kind: "DB_RETURNED_ZERO_VALUES" },
            () => new ORPCError("INTERNAL_SERVER_ERROR"),
          )
          .with(
            { kind: "FORBIDDEN" },
            () => new ORPCError("FORBIDDEN", { message: "You don't have permission to update this profile" }),
          )
          .with({ kind: "USER_NOT_FOUND" }, () => new ORPCError("INTERNAL_SERVER_ERROR")) // This should never happen because the user is authenticated
          .with({ kind: "USERNAME_ALREADY_TAKEN" }, () => errors.USERNAME_ALREADY_TAKEN())
          .exhaustive(),
      );

    return ResultUtils.unwrapOrThrow(result);
  });

class UpdateMyProfileUseCase {
  constructor(
    private database: AppDatabase,
    private ability: AppAbility,
  ) { }

  private checkUsernameAvailability(newUsername: string) {
    return DbUtils.executeAndExpectUndefined(
      () =>
        this.database.query.users.findFirst({
          where: (users, { eq }) => eq(users.name, newUsername),
        }),
      "USERNAME_ALREADY_TAKEN",
    );
  }

  private updateProfile(userId: string, formValues: z.infer<typeof UpdateMyProfileSchema>) {
    return DbUtils.executeAndReturnOneRow(() =>
      this.database
        .update(drizzleSchema.users)
        .set({
          name: formValues.username,
          bio: formValues.bio,
          updatedAt: new Date(),
          image: formValues.pictureUrl,
        })
        .where(eq(drizzleSchema.users.id, userId))
        .returning(),
    );
  }

  execute(userId: string, formValues: z.infer<typeof UpdateMyProfileSchema>) {
    return DbUtils.executeAndExpectDefined(
      () =>
        this.database.query.users.findFirst({
          where: (user, { eq }) => eq(user.id, userId),
        }),
      "USER_NOT_FOUND",
    )
      .andThrough((user) => ForbiddenResult.from(this.ability).check("update", subject("User", user)))
      .andThrough((user) => {
        //Check username availability only if the user is trying to change it
        if (formValues.username !== user.name) {
          return this.checkUsernameAvailability(formValues.username);
        }
        return ok();
      })
      .andThen((user) => this.updateProfile(user.id, formValues));
  }
}
