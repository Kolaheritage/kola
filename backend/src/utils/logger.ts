/**
 * Simple logger utility
 * Can be extended with Winston or similar in production
 */

interface LogMeta {
  [key: string]: any;
}

const logger = {
  info: (message: string, meta: LogMeta = {}): void => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },

  error: (message: string, error: Error | LogMeta = {}): void => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },

  warn: (message: string, meta: LogMeta = {}): void => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },

  debug: (message: string, meta: LogMeta = {}): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
};

export default logger;
