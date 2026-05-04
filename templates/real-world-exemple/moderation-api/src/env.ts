import { z } from "zod";

const _BooleanStringZod = z.preprocess((val) => String(val).toLowerCase() === "true", z.boolean());
const _CommaSeparatedListZod = z.string().transform((str) =>
  str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0),
);

const envSchema = z.object({
  PG_USER: z.string().min(1),
  PG_PASSWORD: z.string().min(1),
  PG_DATABASE: z.string().min(1),
  PG_HOST: z.string().min(1),
  PG_PORT: z.string().min(1)
});

let env: z.infer<typeof envSchema> | undefined;


export function getEnv() {
  if (!env) {
    const parsed = envSchema.safeParse(process.env);
    if (parsed.error) {
      throw new Error(`Error while parsing env variables :\n${z.prettifyError(parsed.error)}\n`);
    }
    env = parsed.data;
  }
  return env;
}