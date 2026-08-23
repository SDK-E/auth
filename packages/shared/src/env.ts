import { z } from "zod";
import { DEFAULT_BASE_DOMAIN } from "./constants";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_BASE_DOMAIN: z.string().min(1).default(DEFAULT_BASE_DOMAIN),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

export function tryServerEnv(): ServerEnv | { error: z.ZodError } {
  try {
    return serverEnv();
  } catch (error) {
    if (error instanceof z.ZodError) return { error };
    throw error;
  }
}

export const mailEnvSchema = z.object({
  MAIL_SMTP_URL: z.string().default("smtp://localhost:1025"),
  MAIL_FROM: z.string().default("SDK-E Auth <no-reply@sdk.enterprises>"),
});

export type MailEnv = z.infer<typeof mailEnvSchema>;

let mailCached: MailEnv | undefined;

export function mailEnv(): MailEnv {
  mailCached ??= mailEnvSchema.parse(process.env);
  return mailCached;
}

export const kvEnvSchema = z.object({
  KV_REST_API_URL: z.url(),
  KV_REST_API_TOKEN: z.string().min(1),
});

export type KvEnv = z.infer<typeof kvEnvSchema>;

export function tryKvEnv(): KvEnv | undefined {
  const parsed = kvEnvSchema.safeParse(process.env);
  return parsed.success ? parsed.data : undefined;
}
