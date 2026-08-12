import pinoHttp, { Options } from "pino-http";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import logger from "../shared/logger";

const options: Options<Request, Response> = {
  logger,
  genReqId: (req) => {
    const existing = req.headers["x-request-id"];
    if (typeof existing === "string" && existing.length) return existing;
    return randomUUID();
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
  serializers: {
    req: () => undefined,
    res: () => undefined,
    responseTime: () => undefined,
  },
};

const requestLogger = pinoHttp(options);

export default requestLogger;
