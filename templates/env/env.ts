import "server-only";
import { getLogger } from "@logtape/logtape";

import { z } from "zod";

const _BooleanStringZod = z.preprocess((val) => String(val).toLowerCase() === "true", z.boolean());
const logger = getLogger(["next", "env"]);

const envSchema = z.object({
  API_KEY: z.string().min(1),
  PUBLIC_VAR: z.string().min(1),
  SERVER_VAR: z.string().min(1),
});

function mapEnv(env: z.infer<typeof envSchema>) {
  return {
    secrets: {
      API_KEY: env.API_KEY,
    },
    server: {
      SERVER_VAR: env.SERVER_VAR,
    },
    client: {
      PUBLIC_VAR: env.PUBLIC_VAR,
    },
  };
}

let env: ReturnType<typeof mapEnv> | undefined;

export function safeGetEnv() {
  try {
    return getEnv();
  } catch {
    logger.warn("Tried to access env before it was ready (this is expected during build time)");
    return undefined;
  }
}

export function getEnv() {
  if (!env) {
    const parsed = envSchema.safeParse(process.env);
    if (parsed.error) {
      throw new Error(`Error while parsing env variables :\n${z.prettifyError(parsed.error)}\n`);
    }
    env = mapEnv(parsed.data);
  }
  return env;
}

export function printEnv() {
  const env = getEnv();
  const formatValue = (value: unknown) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === "boolean") return value;
    return String(value).length <= 100
      ? String(value)
      : `${String(value).substring(0, 50)}...${String(value).substring(String(value).length - 50)}`;
  };
  const formatSecret = (value: unknown) => {
    const str = formatValue(value);
    if (str === undefined) return undefined;
    if (str === null) return null;
    if (typeof str === "boolean") return value;
    return "*".repeat(str.length);
  };
  logger.info(
    `Env Secrets\n${Object.entries(env.secrets)
      .map(([key, value]) => `${key}: ${formatSecret(value)}`)
      .join("\n")}`,
  );
  logger.info(
    `Env Server\n${Object.entries(env.server)
      .map(([key, value]) => `${key}: ${formatValue(value)}`)
      .join("\n")}`,
  );
  logger.info(
    `Env Client\n${Object.entries(env.client)
      .map(([key, value]) => `${key}: ${formatValue(value)}`)
      .join("\n")}`,
  );
}
