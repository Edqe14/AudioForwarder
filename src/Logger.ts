import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.File({
      level: 'info',
      format: format.json(),
      filename: './logs/all.log',
      handleExceptions: true,
      maxsize: 5242880,
      zippedArchive: true
    })
  ],
  exitOnError: false
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
    level: 'debug',
    handleExceptions: true
  }));
}
