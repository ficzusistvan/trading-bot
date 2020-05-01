import * as winston from 'winston'

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    myFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'tradebot.log' })
  ]
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.splat(),
      winston.format.simple(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      myFormat
    )
  }));
}

export default logger;