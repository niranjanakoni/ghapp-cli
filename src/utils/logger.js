/**
 * Logging utility module
 * Provides consistent logging across the application
 */

/**
 * Log levels for controlling output verbosity
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Sets the current log level
 * @param {number} level - Log level from LOG_LEVELS
 */
export function setLogLevel(level) {
  currentLogLevel = level;
}

/**
 * Gets the current log level
 * @returns {number} Current log level
 */
export function getLogLevel() {
  return currentLogLevel;
}

/**
 * Logs an error message with ❌ emoji
 * @param {string} message - Error message
 * @param {Error} [error] - Optional error object
 */
export function logError(message, error = null) {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(`❌ ${message}`);
    if (error && currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.error(error.stack || error.message);
    }
  }
}

/**
 * Logs a warning message with ⚠️ emoji
 * @param {string} message - Warning message
 */
export function logWarning(message) {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(`⚠️  ${message}`);
  }
}

/**
 * Logs an info message with ℹ️ emoji
 * @param {string} message - Info message
 */
export function logInfo(message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`ℹ️  ${message}`);
  }
}

/**
 * Logs a success message with ✅ emoji
 * @param {string} message - Success message
 */
export function logSuccess(message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`✅ ${message}`);
  }
}

/**
 * Logs a debug message with 🐛 emoji
 * @param {string} message - Debug message
 */
export function logDebug(message) {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.log(`🐛 ${message}`);
  }
}

/**
 * Logs a fetching message with 📦 emoji
 * @param {string} message - Fetch message
 */
export function logFetch(message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`📦 ${message}`);
  }
}

/**
 * Logs a data export message with 📊 emoji
 * @param {string} message - Export message
 */
export function logExport(message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`📊 ${message}`);
  }
}

/**
 * Logs a file operation message with 📄 emoji
 * @param {string} message - File operation message
 */
export function logFile(message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`📄 ${message}`);
  }
}

/**
 * Logs a token refresh message with ♻️ emoji
 * @param {string} message - Token refresh message
 */
export function logTokenRefresh(message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`♻️  ${message}`);
  }
}

/**
 * Logs a detection message with 🔍 emoji
 * @param {string} message - Detection message
 */
export function logDetection(message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`🔍 ${message}`);
  }
}

/**
 * Logs with custom emoji
 * @param {string} emoji - Custom emoji
 * @param {string} message - Message
 */
export function logCustom(emoji, message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`${emoji} ${message}`);
  }
}
