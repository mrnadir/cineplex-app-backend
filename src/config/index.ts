import dotenv from "dotenv";
import path from "path";
import { validateEnv } from "./env.schema";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
  quiet: true,
});

const env = validateEnv();

const config = {
  node_env: env.NODE_ENV,
  ip_address: env.MACHINE_IP,
  port: env.PORT,
  log_level: env.LOG_LEVEL,

  cors: {
    prod_origins: env.PROD_ORIGINS,
    allowed_origins: env.ALLOWED_ORIGINS,
  },

  app: {
    name: env.APP_NAME,
    frontendUrl: env.FRONTEND_URL,
  },

  cookie: {
    samesite: env.COOKIE_SAMESITE,
    secure: env.COOKIE_SECURE,
  },

  database: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    name: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    pool_max: env.DATABASE_POOL_MAX,
    pool_min: env.DATABASE_POOL_MIN,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresDays: env.JWT_REFRESH_EXPIRES_DAYS,
  },
  smtp: {
    from: env.EMAIL_FROM,
    user: env.EMAIL_USER,
    port: env.EMAIL_PORT,
    host: env.EMAIL_HOST,
    pass: env.EMAIL_PASS,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  bullConnection: {
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
  },
};

export default config;
