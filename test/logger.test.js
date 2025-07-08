/**
 * Logger utility tests
 * Tests for logging functionality and levels
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('Logger Module', () => {
  let originalConsole;
  let logOutput;

  beforeEach(() => {
    // Capture console output
    logOutput = [];
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };
    
    console.log = (...args) => logOutput.push({ type: 'log', args });
    console.error = (...args) => logOutput.push({ type: 'error', args });
    console.warn = (...args) => logOutput.push({ type: 'warn', args });
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  describe('Log Levels', () => {
    it('should have correct log level constants', async () => {
      const { LOG_LEVELS } = await import('../src/utils/logger.js');
      
      assert.strictEqual(LOG_LEVELS.ERROR, 0);
      assert.strictEqual(LOG_LEVELS.WARN, 1);
      assert.strictEqual(LOG_LEVELS.INFO, 2);
      assert.strictEqual(LOG_LEVELS.DEBUG, 3);
    });

    it('should set and get log level correctly', async () => {
      const { setLogLevel, getLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.DEBUG);
      assert.strictEqual(getLogLevel(), LOG_LEVELS.DEBUG);
      
      setLogLevel(LOG_LEVELS.ERROR);
      assert.strictEqual(getLogLevel(), LOG_LEVELS.ERROR);
    });
  });

  describe('Logging Functions', () => {
    it('should log error messages with correct emoji', async () => {
      const { logError, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.ERROR);
      logError('Test error message');
      
      assert.strictEqual(logOutput.length, 1);
      assert.strictEqual(logOutput[0].type, 'error');
      assert.strictEqual(logOutput[0].args[0], '❌ Test error message');
    });

    it('should log warning messages with correct emoji', async () => {
      const { logWarning, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.WARN);
      logWarning('Test warning message');
      
      assert.strictEqual(logOutput.length, 1);
      assert.strictEqual(logOutput[0].type, 'warn');
      assert.strictEqual(logOutput[0].args[0], '⚠️  Test warning message');
    });

    it('should log info messages with correct emoji', async () => {
      const { logInfo, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.INFO);
      logInfo('Test info message');
      
      assert.strictEqual(logOutput.length, 1);
      assert.strictEqual(logOutput[0].type, 'log');
      assert.strictEqual(logOutput[0].args[0], 'ℹ️  Test info message');
    });

    it('should log success messages with correct emoji', async () => {
      const { logSuccess, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.INFO);
      logSuccess('Test success message');
      
      assert.strictEqual(logOutput.length, 1);
      assert.strictEqual(logOutput[0].type, 'log');
      assert.strictEqual(logOutput[0].args[0], '✅ Test success message');
    });

    it('should log debug messages with correct emoji', async () => {
      const { logDebug, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.DEBUG);
      logDebug('Test debug message');
      
      assert.strictEqual(logOutput.length, 1);
      assert.strictEqual(logOutput[0].type, 'log');
      assert.strictEqual(logOutput[0].args[0], '🐛 Test debug message');
    });

    it('should respect log levels for filtering', async () => {
      const { logError, logWarning, logInfo, logDebug, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      // Set to WARN level - should only show ERROR and WARN
      setLogLevel(LOG_LEVELS.WARN);
      
      logError('Error message');
      logWarning('Warning message');
      logInfo('Info message');
      logDebug('Debug message');
      
      assert.strictEqual(logOutput.length, 2); // Only error and warning
      assert.strictEqual(logOutput[0].args[0], '❌ Error message');
      assert.strictEqual(logOutput[1].args[0], '⚠️  Warning message');
    });

    it('should log custom messages with provided emoji', async () => {
      const { logCustom, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.INFO);
      logCustom('🚀', 'Custom message');
      
      assert.strictEqual(logOutput.length, 1);
      assert.strictEqual(logOutput[0].type, 'log');
      assert.strictEqual(logOutput[0].args[0], '🚀 Custom message');
    });

    it('should handle error objects in logError', async () => {
      const { logError, setLogLevel, LOG_LEVELS } = await import('../src/utils/logger.js');
      
      setLogLevel(LOG_LEVELS.DEBUG);
      const testError = new Error('Test error');
      logError('Test message', testError);
      
      assert.strictEqual(logOutput.length, 2);
      assert.strictEqual(logOutput[0].args[0], '❌ Test message');
      assert(logOutput[1].args[0].includes('Test error'));
    });
  });
});
