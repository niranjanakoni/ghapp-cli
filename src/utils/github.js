/**
 * GitHub API utility module
 * Handles GitHub API interactions and pagination
 */

import { Octokit } from '@octokit/rest';
import jwt from 'jsonwebtoken';
import { config, getPrivateKey, updateEnvToken, isTokenValid } from '../config/config.js';
import { logTokenRefresh, logSuccess, logError } from './logger.js';

let octokitInstance = null;

/**
 * Creates a JWT token manually for GitHub App authentication
 * This works around timestamp issues with @octokit/auth-app
 * @returns {Promise<string>} JWT token
 */
async function createManualJWT() {
  try {
    // Get current GitHub server time to avoid timestamp issues
    const response = await fetch('https://api.github.com/');
    const githubDate = new Date(response.headers.get('date'));
    const githubTimestamp = Math.floor(githubDate.getTime() / 1000);

    const payload = {
      iss: config.github.appId,
      iat: githubTimestamp - 60, // Issued 1 minute ago
      exp: githubTimestamp + 300 // Expires in 5 minutes
    };

    const privateKey = getPrivateKey();
    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  } catch (error) {
    throw new Error(`Failed to create JWT: ${error.message}`);
  }
}

/**
 * Creates and returns an authenticated Octokit client
 * Handles token refresh automatically
 * @returns {Promise<Octokit>} Authenticated Octokit instance
 */
export async function getOctokitClient() {
  let token = config.github.token;
  const expiresAt = config.github.tokenExpires;

  // Check if we need to refresh the token
  if (!token || !isTokenValid(expiresAt)) {
    logTokenRefresh('Refreshing GitHub App installation token...');

    try {
      // Use manual JWT creation instead of @octokit/auth-app due to timestamp issues
      const jwt = await createManualJWT();
      const response = await fetch(`https://api.github.com/app/installations/${config.github.installationId}/access_tokens`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${jwt}`,
          'User-Agent': 'ghapp-cli'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      token = tokenData.token;

      updateEnvToken(token, tokenData.expires_at);
      logSuccess(`Token refreshed. Expires at: ${tokenData.expires_at}`);
    } catch (error) {
      logError('Failed to refresh GitHub App token', error);
      throw error;
    }
  }

  // Create new instance if needed
  if (!octokitInstance || octokitInstance.auth !== token) {
    octokitInstance = new Octokit({ auth: token });
  }

  return octokitInstance;
}

/**
 * Fetches all pages from a paginated GitHub API endpoint
 * @param {Function} apiCall - Function that makes the API call
 * @param {Object} options - Options for the API call
 * @param {number} options.perPage - Items per page (default: 30, max: 100)
 * @returns {Promise<Array>} All items from all pages
 */
export async function fetchAllPages(apiCall, options = {}) {
  const results = [];
  let currentPage = 1;
  const perPage = Math.min(options.perPage || config.api.defaultPerPage, config.api.maxPerPage);

  try {
    while (true) {
      const response = await apiCall({
        ...options,
        page: currentPage,
        per_page: perPage
      });

      // Handle different response structures
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.repositories || response.data.items || [];

      results.push(...data);

      // Check if we've reached the last page
      if (data.length < perPage) {
        break;
      }

      currentPage++;
    }
  } catch (error) {
    logError(`Error during paginated fetch: ${error.message}`, error);
    throw error;
  }

  return results;
}

/**
 * Gets the organization from GitHub App installation
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @returns {Promise<string|null>} Organization name or null
 */
export async function getInstallationOrg(octokit) {
  try {
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 1
    });

    if (data.repositories && data.repositories.length > 0) {
      const firstRepo = data.repositories[0];
      if (firstRepo.owner && firstRepo.owner.type === 'Organization') {
        return firstRepo.owner.login;
      }
    }

    return null;
  } catch (error) {
    logError(`Error detecting organization: ${error.message}`, error);
    return null;
  }
}

/**
 * Handles GitHub API errors and provides user-friendly messages
 * @param {Error} error - The error object from GitHub API
 * @param {string} context - Context where the error occurred
 */
export function handleGitHubError(error, context = '') {
  const contextMsg = context ? ` during ${context}` : '';

  switch (error.status) {
  case 401:
    logError(`Authentication failed${contextMsg}. Please check your GitHub App credentials.`);
    break;
  case 403:
    logError(`Access forbidden${contextMsg}. Check your GitHub App permissions.`);
    break;
  case 404:
    logError(`Resource not found${contextMsg}. Verify the organization/repository exists and is accessible.`);
    break;
  case 422:
    logError(`Invalid request${contextMsg}. Check your parameters.`);
    break;
  case 500:
    logError(`GitHub server error${contextMsg}. Please try again later.`);
    break;
  default:
    logError(`GitHub API error${contextMsg}: ${error.message}`, error);
  }
}
