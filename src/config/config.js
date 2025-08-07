/**
 * Configuration module for GitHub App CLI
 * Handles environment variables and application configuration
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'; // eslint-disable-line no-unused-vars

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // eslint-disable-line no-unused-vars

/**
 * Configuration object containing all application settings
 */
export const config = {
  github: {
    appId: parseInt(process.env.GITHUB_APP_ID),
    installationId: parseInt(process.env.GITHUB_INSTALLATION_ID),
    privateKeyPath: process.env.GITHUB_PRIVATE_KEY_PATH,
    token: process.env.GITHUB_APP_TOKEN,
    tokenExpires: process.env.GITHUB_APP_TOKEN_EXPIRES
  },

  app: {
    name: 'ghapp',
    version: '1.0.0',
    description: 'CLI to interact with GitHub App APIs'
  },

  api: {
    defaultPerPage: 30,
    maxPerPage: 100,
    tokenRefreshBuffer: 300000 // 5 minutes in milliseconds
  },

  files: {
    envPath: '.env',
    privateKeyPath: process.env.GITHUB_PRIVATE_KEY_PATH || 'private-key.pem'
  },

  csv: {
    timestampFormat: 'YYYY-MM-DDTHH-mm-ss-SSSZ',
    defaultOutputDir: './'
  }
};

/**
 * Validates required environment variables
 * @returns {boolean} True if all required variables are present
 */
export function validateConfig() {
  const required = [
    'GITHUB_APP_ID',
    'GITHUB_INSTALLATION_ID',
    'GITHUB_PRIVATE_KEY_PATH'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }

  // Check if private key file exists
  const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH;
  if (!fs.existsSync(privateKeyPath)) {
    console.error(`❌ Private key file not found: ${privateKeyPath}`);
    return false;
  }

  return true;
}

/**
 * Gets the private key content
 * @returns {string} Private key content
 */
export function getPrivateKey() {
  return fs.readFileSync(config.github.privateKeyPath, 'utf8');
}

/**
 * Updates the .env file with new token values
 * @param {string} newToken - The new GitHub App token
 * @param {string} expiresAt - The token expiration timestamp
 */
export function updateEnvToken(newToken, expiresAt) {
  try {
    const envContent = fs.readFileSync(config.files.envPath, 'utf8');
    const envLines = envContent.split('\n');

    const updatedLines = envLines.map((line) => {
      if (line.startsWith('GITHUB_APP_TOKEN=')) {
        return `GITHUB_APP_TOKEN=${newToken}`;
      }
      if (line.startsWith('GITHUB_APP_TOKEN_EXPIRES=')) {
        return `GITHUB_APP_TOKEN_EXPIRES=${expiresAt}`;
      }
      return line;
    });

    fs.writeFileSync(config.files.envPath, updatedLines.join('\n'));

    // Update in-memory config
    config.github.token = newToken;
    config.github.tokenExpires = expiresAt;
  } catch (error) {
    console.error(`❌ Error updating .env file: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if the current token is valid
 * @param {string} expiresAt - Token expiration timestamp
 * @returns {boolean} True if token is valid
 */
export function isTokenValid(expiresAt) {
  if (!expiresAt) return false;

  try {
    const expiry = new Date(expiresAt);
    const now = new Date();
    return expiry.getTime() - now.getTime() > config.api.tokenRefreshBuffer;
  } catch {
    return false;
  }
}

export default config;
