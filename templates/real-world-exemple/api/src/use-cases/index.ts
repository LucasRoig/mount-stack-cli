import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { o } from "../orpc";
import { GetUserProfileProcedure } from "./get-user-profile/get-user-profile.use-case";
import { HelloProcedure } from "./hello.use-case";

export const appRouter = o.router({
  hello: HelloProcedure,
  getUserProfile: GetUserProfileProcedure,
});

export type RouterOutputs = InferRouterOutputs<typeof appRouter>;
export type RouterInputs = InferRouterInputs<typeof appRouter>;
