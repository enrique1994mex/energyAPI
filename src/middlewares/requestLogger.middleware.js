import crypto from "crypto";
import logger from "../config/logger.js";

export function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;

  const start = Date.now();

  res.on("finish", () => {
    logger.info({
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    }, "request");
  });

  next();
}
