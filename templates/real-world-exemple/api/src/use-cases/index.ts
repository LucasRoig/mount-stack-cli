import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { o } from "../orpc";
import { CreateArticleProcedure } from "./create-article/create-article.use-case";
import { GetUserProfileProcedure } from "./get-user-profile/get-user-profile.use-case";
import { HelloProcedure } from "./hello.use-case";
import { UpdateMyProfileProcedure } from "./update-my-profile/update-my-profile.use-case";

export const appRouter = o.router({
  hello: HelloProcedure,
  getUserProfile: GetUserProfileProcedure,
  updateMyProfile: UpdateMyProfileProcedure,
  createArticle: CreateArticleProcedure,
});

export type RouterOutputs = InferRouterOutputs<typeof appRouter>;
export type RouterInputs = InferRouterInputs<typeof appRouter>;
