import { createLogger, format, transports } from 'winston'

const { NODE_ENV } = process.env

/**
 * to log objects use string interpolation:
 * ```ts
 * log.info('object: %O', { key: 'value' })
 * ```
 */
const log = createLogger({
    level: NODE_ENV === 'development' ? 'debug' : 'info',
    format: format.combine(
        format.timestamp({ format: 'MMM DD HH:mm:ss' }),
        format.splat(),
        format.printf(({ level, message, timestamp }) => `[${timestamp}][${level.toUpperCase()}] ${message}`)
    ),
    transports: [new transports.Console({ format: format.colorize({ all: true }) })]
})

export default log
