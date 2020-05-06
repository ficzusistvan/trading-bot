import * as winston from 'winston'

let myTransports;
if (process.env.NODE_ENV === 'production') {
  myTransports = [
    new winston.transports.File({ filename: 'tradebot.log' }),
    new winston.transports.Console()
  ]
} else {
  myTransports = [
    new winston.transports.Console()
  ]
}

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.simple(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    myFormat
  ),
  transports: myTransports
});

export default logger;