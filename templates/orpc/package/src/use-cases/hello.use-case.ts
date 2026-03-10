import { o } from "../orpc ";
import { ok } from "neverthrow";
import z from "zod";
import { getLogger } from "@logtape/logtape";
import { ResultUtils } from "../@utils/result-utils";

const logger = getLogger(["api", "hello-use-case"]);

const inputRequestSchema = z.object({
  name: z.string(),
});
type InputRequest = z.infer<typeof inputRequestSchema>;

export const HelloProcedure = o
  .input(inputRequestSchema)
  .errors({
    EXEMPLE_ERROR: {
      message: "To show how to declare orpc errors",
      status: 500,
    },
  })
  .handler(async ({ input, context: _context, errors: _errors }) => {
    const uc = new HelloUseCase();
    const result = uc.execute(input).orTee((e) => logger.error(e));
    return ResultUtils.unwrapOrThrow(result);
  })

class HelloUseCase {
  public execute(input: InputRequest) {
    return ok(`Hello, ${input.name}`);
  }
}
