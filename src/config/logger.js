import pino from "pino";
import pinoPretty from "pino-pretty";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino(
  { level: process.env.LOG_LEVEL || "info" },
  isDev
    ? pinoPretty({ colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" })
    : pino.destination(1)
);

export default logger;
