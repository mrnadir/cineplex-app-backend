import { Redis, RedisOptions } from "ioredis";
import config from ".";
import logger from "../shared/logger";

const redisOptions: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
};

export const redisClient = new Redis(redisOptions);

redisClient.on("connect", () => {
  logger.info("Redis: connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis: connected and ready");
});

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis connection error:");
});

redisClient.on("close", () => {
  logger.warn("Redis: connection closed");
});
