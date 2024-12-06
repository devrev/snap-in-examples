import { createLogger, format, transports } from 'winston';

const { combine, colorize, splat, printf, ms } = format;

const loglevels = {
  colors: {
    debug: 'yellow',
    error: 'red',
    info: 'green',
    verbose: 'blue',
    warn: 'yellow',
  },
  levels: {
    debug: 4,
    error: 0,
    info: 2,
    verbose: 3,
    warn: 1,
  },
};

const useloglevel = process.env['SNAP_IN_LOG_LEVEL'] || 'info'; // set to 'verbose' or 'debug' for more

export const logger = createLogger({
  format: combine(
    colorize({
      colors: loglevels.colors,
      level: true,
    }),
    splat(),
    ms(),
    printf((info) => `${info.level} (${info['ms']}): ${info.message}`)
  ),
  levels: loglevels.levels,
  transports: [new transports.Console({ level: useloglevel })],
});

export default logger;
