import { ORPCError, ValidationError } from "@orpc/server";
import z from "zod";

export function inputValidationFailedError<T extends z.ZodEnum>(inputSchemaKeys: T) {
  return {
    INPUT_VALIDATION_FAILED: {
      status: 422,
      data: z.object({
        formErrors: z.array(z.string()),
        fieldErrors: z.record(inputSchemaKeys, z.array(z.string()).optional()),
      }),
    },
  };
}

export const errorClientInterceptor = (error: unknown) => {
  if (error instanceof ORPCError && error.code === "BAD_REQUEST" && error.cause instanceof ValidationError) {
    // If you only use Zod you can safely cast to ZodIssue[]
    const zodError = new z.ZodError(error.cause.issues as z.core.$ZodIssue[]);

    throw new ORPCError("INPUT_VALIDATION_FAILED", {
      status: 422,
      message: z.prettifyError(zodError),
      data: z.flattenError(zodError),
      cause: error.cause,
    });
  }
};
