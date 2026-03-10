import { o } from "../orpc";
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { HelloProcedure } from "./hello.use-case";
export const appRouter = o.router({
  hello: HelloProcedure,
});

export type RouterOutputs = InferRouterOutputs<typeof appRouter>;
export type RouterInputs = InferRouterInputs<typeof appRouter>;
