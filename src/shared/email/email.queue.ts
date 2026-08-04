import { Queue } from "bullmq";
import { bullConnection } from "../../shared/queue/bullmq-connection";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  encoding?: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: "welcome" | "order-confirmation" | "eTicket" | "password-reset";
  context: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

interface BuildTicketEmailJobOptions {
  to: string;
  pdfBuffer: Buffer;
  fileName: string;
  context?: Record<string, unknown>;
}

export const buildTicketEmailJob = ({
  to,
  pdfBuffer,
  fileName,
  context = {},
}: BuildTicketEmailJobOptions): EmailJobData => ({
  to,
  subject: "Your Cineplex eTicket",
  template: "eTicket",
  context: {
    ...context,
    ticketFileName: fileName,
  },
  attachments: [
    {
      filename: fileName,
      content: pdfBuffer.toString("base64"),
      contentType: "application/pdf",
      encoding: "base64",
    },
  ],
});

export const emailQueue = new Queue<EmailJobData>("email", {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
