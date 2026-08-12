import { afterAll } from "@jest/globals";
import { redisClient } from "./src/config/redis";
import { bullConnection } from "./src/shared/queue/bullmq-connection";
import { emailQueue } from "./src/shared/email/email.queue";
import { transporter } from "./src/shared/email/mailer";
import pool from "./src/db";

afterAll(async () => {
  await pool.end();
  await redisClient.quit();
  transporter.close();
  await bullConnection.quit();
  await emailQueue.close();
});
