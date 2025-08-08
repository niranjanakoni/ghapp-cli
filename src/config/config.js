/**
 * Configuration module for GitHub App CLI
 * Handles environment variables and application configuration
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'; // eslint-disable-line no-unused-vars
import { execSync } from 'child_process';
import { createRequire } from 'module';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // eslint-disable-line no-unused-vars

// Resolve application version dynamically with sensible fallbacks
function getAppVersion() {
  const sanitize = (v) => (typeof v === 'string' ? v.replace(/^v/, '') : v);

  // 1) Explicit environment override (recommended in CI)
  if (process.env.GHAPP_VERSION) return sanitize(process.env.GHAPP_VERSION);

  // 2) Try Git tag (works when running inside a git repo with tags fetched)
  try {
    const out = execSync('git describe --tags --abbrev=0', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (out) return sanitize(out);
  } catch {}

  // 3) npm provided version when invoked via npm scripts
  if (process.env.npm_package_version) return sanitize(process.env.npm_package_version);

  // 4) package.json next to project root (works in dev)
  try {
    const require = createRequire(import.meta.url);
    const pkg = require('../../package.json');
    if (pkg?.version) return sanitize(pkg.version);
  } catch {}

  // 5) Fallback
  return '0.0.0-dev';
}

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
    version: getAppVersion(),
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
    // Read existing .env content if it exists, otherwise start with empty content
    let envContent = '';
    if (fs.existsSync(config.files.envPath)) {
      envContent = fs.readFileSync(config.files.envPath, 'utf8');
    }

    const envLines = envContent
      .split('\n')
      .filter(line => line !== undefined); // preserve empty lines if any

    let hasToken = false;
    let hasExpires = false;

    const updatedLines = envLines.map((line) => {
      if (line.startsWith('GITHUB_APP_TOKEN=')) {
        hasToken = true;
        return `GITHUB_APP_TOKEN=${newToken}`;
      }
      if (line.startsWith('GITHUB_APP_TOKEN_EXPIRES=')) {
        hasExpires = true;
        return `GITHUB_APP_TOKEN_EXPIRES=${expiresAt}`;
      }
      return line;
    });

    // Append token entries if they were not present
    if (!hasToken) updatedLines.push(`GITHUB_APP_TOKEN=${newToken}`);
    if (!hasExpires) updatedLines.push(`GITHUB_APP_TOKEN_EXPIRES=${expiresAt}`);

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
