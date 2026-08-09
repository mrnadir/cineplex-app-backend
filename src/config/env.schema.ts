import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    APP_NAME: z.string().default("node-pg-api"),

    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    // those are database config
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.coerce.number().default(5432),
    DATABASE_USER: z.string(),
    DATABASE_NAME: z.string(),
    DATABASE_PASSWORD: z.string(),
    DATABASE_POOL_MAX: z.coerce.number().default(20),
    DATABASE_POOL_MIN: z.coerce.number().default(20),

    // those for the device
    PORT: z.coerce.number().default(3000),
    MACHINE_IP: z.string(),
    FRONTEND_URL: z.string(),

    // cors
    PROD_ORIGINS: z.string(),
    ALLOWED_ORIGINS: z.string(),

    // accesstoken config
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_DAYS: z.string().default("30d"),

    // smtp config validator
    EMAIL_FROM: z.string().email(),
    EMAIL_USER: z.string(),
    EMAIL_PORT: z.coerce.number(),
    EMAIL_HOST: z.string(),
    EMAIL_PASS: z.string(),

    // redis config validator
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string(),

    COOKIE_SAMESITE: z.enum(["strict", "lax", "none"]).default("lax"),
    COOKIE_SECURE: z
      .string()
      .default("true")
      .transform((val) => val === "true"),
  })
  .refine((data) => data.JWT_ACCESS_SECRET !== data.JWT_REFRESH_SECRET, {
    message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different",
    path: ["JWT_REFRESH_SECRET"],
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}
