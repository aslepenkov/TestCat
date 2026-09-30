import path from "path";
import moment from "moment";
import winston from "winston";

export class LoggerService {
  private static instance: winston.Logger;

  private constructor() {}

  public static getInstance(): winston.Logger {
    // Generate a dynamic log file name (with timestamp)
    const logFileName = `log-${moment().format("YYYY-MM-DD_HH-mm-ss")}.log`;

    if (!LoggerService.instance) {
      LoggerService.instance = winston.createLogger({
        level: "info",
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(
            ({ timestamp, level, message }) =>
              `${timestamp} [${level}]: ${message}`,
          ),
        ),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({
            filename: path.join(process.cwd(), `logs/${logFileName}`),
            level: "info",
          }),
        ],
      });
    }
    return LoggerService.instance;
  }

  public info(message: string): void {
    const logger = LoggerService.getInstance();
    logger.info(message);
  }

  public error(message: string): void {
    const logger = LoggerService.getInstance();
    logger.error(message);
  }

  public debug(message: string): void {
    const logger = LoggerService.getInstance();
    logger.debug(message);
  }
}
