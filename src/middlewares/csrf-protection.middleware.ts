import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import config from "../config";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const allowedFrontendOrigins = config.app.frontendUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const requestOrigin = req.headers.origin;
  if (
    requestOrigin &&
    allowedFrontendOrigins.length > 0 &&
    !allowedFrontendOrigins.includes(requestOrigin)
  ) {
    return res.status(403).json({
      success: false,
      message: "Forbidden origin",
    });
  }

  const cookieCsrfToken = req?.cookies?.csrfToken;
  const headerCsrfToken = req.headers["x-csrf-token"];

  if (
    !cookieCsrfToken ||
    typeof headerCsrfToken !== "string" ||
    !headerCsrfToken.trim()
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token",
    });
  }

  const cookieBuffer = Buffer.from(cookieCsrfToken);
  const headerBuffer = Buffer.from(headerCsrfToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    return res.status(403).json({
      success: false,
      message: "CSRF validation failed",
    });
  }

  return next();
};
