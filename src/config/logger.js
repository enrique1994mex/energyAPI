import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const stream = isDev
  ? (await import("pino-pretty")).default({
      colorize: true,
      translateTime: "SYS:HH:MM:ss",
      ignore: "pid,hostname",
    })
  : pino.destination(1);

const logger = pino({ level: process.env.LOG_LEVEL || "info" }, stream);

export default logger;
