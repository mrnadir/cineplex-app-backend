import { afterAll } from "@jest/globals";
import { redisClient } from "./src/config/redis";
import { bullConnection } from "./src/shared/queue/bullmq-connection";
import { emailQueue } from "./src/shared/email/email.queue";
import pool from "./src/db";

afterAll(async () => {
  await pool.end();
  await redisClient.quit();
  await bullConnection.quit();
  await emailQueue.close();
});
