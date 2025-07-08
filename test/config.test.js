/**
 * Configuration module tests
 * Tests for configuration loading, validation, and management
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

// Mock environment variables for testing
const originalEnv = process.env;

describe('Configuration Module', () => {
  let tempEnvFile;
  let tempKeyFile;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    
    // Create temporary files for testing
    tempEnvFile = '.env.test';
    tempKeyFile = 'test-key.pem';
    
    fs.writeFileSync(tempKeyFile, 'dummy-private-key-content');
    fs.writeFileSync(tempEnvFile, `
GITHUB_APP_ID=123456
GITHUB_INSTALLATION_ID=789012
GITHUB_PRIVATE_KEY_PATH=${tempKeyFile}
GITHUB_APP_TOKEN=test_token
GITHUB_APP_TOKEN_EXPIRES=2025-07-08T12:00:00Z
`);
    
    // Set test environment variables
    process.env.GITHUB_APP_ID = '123456';
    process.env.GITHUB_INSTALLATION_ID = '789012';
    process.env.GITHUB_PRIVATE_KEY_PATH = tempKeyFile;
    process.env.GITHUB_APP_TOKEN = 'test_token';
    process.env.GITHUB_APP_TOKEN_EXPIRES = '2025-07-08T12:00:00Z';
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    
    // Clean up temporary files
    if (fs.existsSync(tempEnvFile)) {
      fs.unlinkSync(tempEnvFile);
    }
    if (fs.existsSync(tempKeyFile)) {
      fs.unlinkSync(tempKeyFile);
    }
  });

  describe('validateConfig', () => {
    it('should return true when all required environment variables are present', async () => {
      const { validateConfig } = await import('../src/config/config.js');
      const result = validateConfig();
      assert.strictEqual(result, true);
    });

    it('should return false when required environment variables are missing', async () => {
      delete process.env.GITHUB_APP_ID;
      const { validateConfig } = await import('../src/config/config.js');
      const result = validateConfig();
      assert.strictEqual(result, false);
    });

    it('should return false when private key file does not exist', async () => {
      process.env.GITHUB_PRIVATE_KEY_PATH = 'non-existent-file.pem';
      const { validateConfig } = await import('../src/config/config.js');
      const result = validateConfig();
      assert.strictEqual(result, false);
    });
  });

  describe('isTokenValid', () => {
    it('should return true for future expiry date', async () => {
      const { isTokenValid } = await import('../src/config/config.js');
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      const result = isTokenValid(futureDate);
      assert.strictEqual(result, true);
    });

    it('should return false for past expiry date', async () => {
      const { isTokenValid } = await import('../src/config/config.js');
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const result = isTokenValid(pastDate);
      assert.strictEqual(result, false);
    });

    it('should return false for expiry date within buffer time', async () => {
      const { isTokenValid } = await import('../src/config/config.js');
      const nearFutureDate = new Date(Date.now() + 60000).toISOString(); // 1 minute from now
      const result = isTokenValid(nearFutureDate);
      assert.strictEqual(result, false);
    });

    it('should return false for invalid date string', async () => {
      const { isTokenValid } = await import('../src/config/config.js');
      const result = isTokenValid('invalid-date');
      assert.strictEqual(result, false);
    });
  });

  describe('getPrivateKey', () => {
    it('should return the private key content', async () => {
      const { getPrivateKey } = await import('../src/config/config.js');
      const result = getPrivateKey();
      assert.strictEqual(result, 'dummy-private-key-content');
    });
  });

  describe('updateEnvToken', () => {
    it('should update token values in .env file', async () => {
      const envContent = `GITHUB_APP_ID=123
GITHUB_APP_TOKEN=old_token
GITHUB_APP_TOKEN_EXPIRES=old_date
GITHUB_INSTALLATION_ID=456`;
      
      const testEnvFile = '.env.update.test';
      fs.writeFileSync(testEnvFile, envContent);
      
      // Mock the config to use our test file
      const { updateEnvToken } = await import('../src/config/config.js');
      
      // Temporarily change the env path
      const originalFilesPath = '.env';
      
      try {
        // Update the token
        updateEnvToken('new_token', 'new_date');
        
        // Read and verify the updated content
        const updatedContent = fs.readFileSync('.env', 'utf8');
        assert(updatedContent.includes('GITHUB_APP_TOKEN=new_token'));
        assert(updatedContent.includes('GITHUB_APP_TOKEN_EXPIRES=new_date'));
        
      } finally {
        // Clean up
        if (fs.existsSync(testEnvFile)) {
          fs.unlinkSync(testEnvFile);
        }
      }
    });
  });
});
