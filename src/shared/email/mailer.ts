// shared/email/mailer.ts
import nodemailer from "nodemailer";
import config from "../../config";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import logger from "../logger";

const smtpConfig: SMTPTransport.Options = {
  host: config.smtp.host,
  port: Number(config.smtp.port),
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
};

export const transporter = nodemailer.createTransport(smtpConfig);

if (process.env.NODE_ENV !== "test") {
  transporter.verify((err) => {
    if (err) logger.error({ err }, "SMTP connection failed:");
    else logger.info("SMTP: connected and ready");
  });
}
