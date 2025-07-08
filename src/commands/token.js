/**
 * Token command module
 * Handles GitHub App token information and management
 */

import { config } from "../config/config.js";
import { displayTokenInfo, displayError } from "../utils/display.js";
import { logError } from "../utils/logger.js";

/**
 * Token command handler
 * Shows current GitHub App token information and expiry
 * @param {Object} options - Command options
 * @param {boolean} [options.refresh] - Force refresh the token
 * @param {boolean} [options.validate] - Validate token without showing details
 */
export async function handleTokenCommand(options = {}) {
  try {
    const token = config.github.token;
    const expiresAt = config.github.tokenExpires;

    if (options.validate) {
      return validateTokenOnly(token, expiresAt);
    }

    if (options.refresh) {
      await refreshTokenForce();
      return;
    }

    displayTokenInfo(token, expiresAt);

  } catch (error) {
    displayError("handling token command", error);
  }
}

/**
 * Validates token without displaying details
 * @param {string} token - GitHub App token
 * @param {string} expiresAt - Token expiration timestamp
 * @returns {boolean} True if token is valid
 */
function validateTokenOnly(token, expiresAt) {
  if (!token || !expiresAt) {
    logError("No token or expiry found in .env");
    return false;
  }

  try {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const timeLeft = expiryDate.getTime() - now.getTime();
    const isValid = timeLeft > 300000; // 5 minutes buffer

    if (isValid) {
      console.log('✅ Token is valid');
      const minutesLeft = Math.floor(timeLeft / 60000);
      console.log(`⏳ Expires in ${minutesLeft} minutes`);
    } else {
      console.log('⚠️  Token is expiring soon or expired');
    }

    return isValid;
  } catch (error) {
    logError("Error validating token", error);
    return false;
  }
}

/**
 * Forces a token refresh
 */
async function refreshTokenForce() {
  try {
    const { getOctokitClient } = await import("../utils/github.js");
    
    // This will force a token refresh if needed
    await getOctokitClient();
    
    console.log('✅ Token refresh completed');
    
    // Display updated token info
    const updatedToken = config.github.token;
    const updatedExpiresAt = config.github.tokenExpires;
    displayTokenInfo(updatedToken, updatedExpiresAt);
    
  } catch (error) {
    displayError("refreshing token", error);
  }
}

/**
 * Gets token expiry information
 * @returns {Object} Token expiry details
 */
export function getTokenExpiryInfo() {
  const expiresAt = config.github.tokenExpires;
  
  if (!expiresAt) {
    return { valid: false, error: 'No expiry date found' };
  }

  try {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const timeLeft = expiryDate.getTime() - now.getTime();
    
    return {
      valid: timeLeft > 300000, // 5 minutes buffer
      expiresAt: expiryDate,
      timeLeft: timeLeft,
      minutesLeft: Math.floor(timeLeft / 60000),
      hoursLeft: Math.floor(timeLeft / 3600000),
      isExpired: timeLeft <= 0,
      isExpiringSoon: timeLeft <= 300000 && timeLeft > 0
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Checks if token needs refresh
 * @returns {boolean} True if token needs refresh
 */
export function needsTokenRefresh() {
  const info = getTokenExpiryInfo();
  return !info.valid || info.isExpiringSoon;
}

/**
 * Gets token summary for display in other commands
 * @returns {string} Token status summary
 */
export function getTokenSummary() {
  const token = config.github.token;
  const info = getTokenExpiryInfo();
  
  if (!token) {
    return '❌ No token available';
  }
  
  if (!info.valid) {
    return '⚠️  Token invalid or expired';
  }
  
  if (info.isExpiringSoon) {
    return `⏳ Token expires in ${info.minutesLeft} minutes`;
  }
  
  return `✅ Token valid (${info.hoursLeft}h remaining)`;
}
