// shared/email/email.worker.ts
import { Worker } from "bullmq";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { transporter } from "./mailer";
import { EmailJobData, EmailAttachment } from "./email.queue";
import logger from "../logger";
import config from "../../config";
import { bullConnection } from "../queue/bullmq-connection";

const loadTemplate = (name: string) => {
  const filePath = path.join(__dirname, "templates", `${name}.hbs`);
  const source = fs.readFileSync(filePath, "utf-8");
  return Handlebars.compile(source);
};

const normalizeAttachments = (
  attachments: EmailAttachment[] | undefined
): EmailAttachment[] | undefined =>
  attachments?.map((attachment) => {
    if (
      attachment.content &&
      typeof attachment.content === "object" &&
      !Buffer.isBuffer(attachment.content)
    ) {
      const raw = attachment.content as { type?: string; data?: number[] };
      if (raw.type === "Buffer" && Array.isArray(raw.data)) {
        return {
          ...attachment,
          content: Buffer.from(raw.data),
        };
      }
    }

    return attachment;
  });

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    const { to, subject, template, context, attachments } = job.data;

    const compiledTemplate = loadTemplate(template);
    const html = compiledTemplate(context);
    const normalizedAttachments = normalizeAttachments(attachments);

    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
      attachments: normalizedAttachments,
    });

    logger.info(`Email sent: ${template} -> ${to}`);
  },
  {
    connection: bullConnection,
    concurrency: 5,
    limiter: { max: 14, duration: 1000 },
  }
);

emailWorker.on("failed", (job, err) => {
  logger.error({ err }, `Email job failed after retries: ${job?.id}`);
});
