/**
 * Secrets command module
 * Handles fetching and managing GitHub organization and repository secrets
 */

import { getOctokitClient, fetchAllPages, handleGitHubError, getInstallationOrg } from '../utils/github.js';
import { displayError, displaySuccess, displayInfo } from '../utils/display.js';
import { generateSecretsCSV, saveCSVFileOrganized } from '../utils/fileUtils.js';
import { logFetch, logExport, logDebug, logError, logInfo, logSuccess } from '../utils/logger.js';

/**
 * Default retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000 // 10 seconds
};

/**
 * Sleep utility function for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for API calls with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise} Result of the function call
 */
async function retryWithBackoff(fn, config = RETRY_CONFIG) {
  let lastError;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(config.baseDelay * Math.pow(2, attempt - 1), config.maxDelay);
      const jitter = Math.random() * 0.1 * baseDelay;
      const delay = baseDelay + jitter;

      logDebug(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Fetches organization-level secrets with metadata
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @returns {Promise<Array>} Array of organization secrets with metadata
 */
async function fetchOrganizationSecrets(octokit, org) {
  try {
    logFetch(`Fetching organization secrets for ${org}...`);

    const secrets = await retryWithBackoff(async () => {
      return await fetchAllPages(
        (params) => octokit.rest.actions.listOrgSecrets({
          org,
          ...params
        }),
        { perPage: 100 }
      );
    });

    logDebug(`Found ${secrets.length} organization secrets`);

    // Enrich secrets with detailed information
    const enrichedSecrets = [];
    for (const secret of secrets) {
      try {
        const detailedSecret = await retryWithBackoff(async () => {
          return await octokit.rest.actions.getOrgSecret({
            org,
            secret_name: secret.name
          });
        });

        let selectedRepositories = [];
        if (detailedSecret.data.visibility === 'selected') {
          logDebug(`Fetching selected repositories for secret: ${secret.name}`);

          const repoList = await retryWithBackoff(async () => {
            return await fetchAllPages(
              (params) => octokit.rest.actions.listSelectedReposForOrgSecret({
                org,
                secret_name: secret.name,
                ...params
              }),
              { perPage: 100 }
            );
          });

          selectedRepositories = repoList.map(repo => repo.name);
        }

        enrichedSecrets.push({
          scope: 'organization',
          repository: null,
          name: secret.name,
          value: '[ENCRYPTED_SECRET_VALUE]',
          visibility: detailedSecret.data.visibility,
          selected_repositories: selectedRepositories.join(','),
          created_at: secret.created_at,
          updated_at: secret.updated_at
        });
      } catch (error) {
        logError(`Error fetching details for org secret ${secret.name}: ${error.message}`);
        // Add basic secret info even if we can't get details
        enrichedSecrets.push({
          scope: 'organization',
          repository: null,
          name: secret.name,
          value: '[ENCRYPTED_SECRET_VALUE]',
          visibility: 'unknown',
          selected_repositories: '',
          created_at: secret.created_at,
          updated_at: secret.updated_at
        });
      }
    }

    return enrichedSecrets;
  } catch (error) {
    handleGitHubError(error, 'fetching organization secrets');
    throw error;
  }
}

/**
 * Fetches repository-level secrets for a single repository
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>} Array of repository secrets with metadata
 */
async function fetchRepositorySecrets(octokit, owner, repo) {
  try {
    logDebug(`Fetching secrets for repository ${owner}/${repo}...`);

    const secrets = await retryWithBackoff(async () => {
      return await fetchAllPages(
        (params) => octokit.rest.actions.listRepoSecrets({
          owner,
          repo,
          ...params
        }),
        { perPage: 100 }
      );
    });

    return secrets.map(secret => ({
      scope: 'repository',
      repository: repo,
      name: secret.name,
      value: '[ENCRYPTED_SECRET_VALUE]',
      visibility: null, // Repository secrets don't have visibility settings
      selected_repositories: '',
      created_at: secret.created_at,
      updated_at: secret.updated_at
    }));
  } catch (error) {
    if (error.status === 404) {
      logDebug(`Repository ${owner}/${repo} not found or no access to secrets`);
      return [];
    }
    logError(`Error fetching secrets for repository ${owner}/${repo}: ${error.message}`);
    return [];
  }
}

/**
 * Fetches secrets from all accessible repositories
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @returns {Promise<Array>} Array of all repository secrets with metadata
 */
async function fetchAllRepositorySecrets(octokit) {
  try {
    logFetch('Fetching accessible repositories...');

    const repos = await retryWithBackoff(async () => {
      return await fetchAllPages(
        (params) => octokit.rest.apps.listReposAccessibleToInstallation(params),
        { perPage: 100 }
      );
    });

    logInfo(`Found ${repos.length} accessible repositories`);

    const allSecrets = [];
    let processedCount = 0;

    // Process repositories in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      const batchPromises = batch.map(async (repo) => {
        const secrets = await fetchRepositorySecrets(octokit, repo.owner.login, repo.name);
        processedCount++;
        if (processedCount % 10 === 0 || processedCount === repos.length) {
          logInfo(`Processed ${processedCount}/${repos.length} repositories`);
        }
        return secrets;
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(secrets => allSecrets.push(...secrets));

      // Small delay between batches to be respectful to the API
      if (i + batchSize < repos.length) {
        await sleep(100);
      }
    }

    return allSecrets;
  } catch (error) {
    handleGitHubError(error, 'fetching repository secrets');
    throw error;
  }
}

/**
 * Validates command options for secrets command
 * @param {Object} options - Command options to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateSecretsOptions(options = {}) {
  const errors = [];

  // Validate visibility option
  if (options.visibility && !['all', 'private', 'selected'].includes(options.visibility)) {
    errors.push('Invalid visibility value. Must be one of: all, private, selected');
  }

  // Validate scope option
  if (options.scope && !['org', 'repo', 'both'].includes(options.scope)) {
    errors.push('Invalid scope value. Must be one of: org, repo, both');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Main secrets command handler
 * @param {string} [org] - Organization name (auto-detects if not provided)
 * @param {Object} options - Command options
 * @param {string} [options.scope] - Scope of secrets to fetch ('org', 'repo', 'both')
 * @param {string} [options.visibility] - Filter by visibility for org secrets ('all', 'private', 'selected')
 * @param {boolean} [options.fetch] - Save data to CSV file instead of displaying
 * @param {string} [options.output] - Output file path for CSV
 */
export async function handleSecretsCommand(org, options = {}) {
  try {
    const octokit = await getOctokitClient();

    // Auto-detect organization if not provided
    if (!org) {
      logFetch('Auto-detecting organization from GitHub App installation...');
      org = await getInstallationOrg(octokit);
      if (!org) {
        displayError('organization detection', new Error('Could not detect organization from GitHub App installation'));
        return;
      }
      logInfo(`Detected organization: ${org}`);
    }

    const scope = options.scope || 'both';
    const allSecrets = [];

    // Fetch organization secrets
    if (scope === 'org' || scope === 'both') {
      try {
        const orgSecrets = await fetchOrganizationSecrets(octokit, org);

        // Apply visibility filter for organization secrets
        let filteredOrgSecrets = orgSecrets;
        if (options.visibility) {
          filteredOrgSecrets = orgSecrets.filter(secret => {
            if (options.visibility === 'all') return secret.visibility === 'all';
            if (options.visibility === 'private') return secret.visibility === 'private';
            if (options.visibility === 'selected') return secret.visibility === 'selected';
            return true;
          });
        }

        allSecrets.push(...filteredOrgSecrets);
        logSuccess(`Fetched ${filteredOrgSecrets.length} organization secrets`);
      } catch (error) {
        logError(`Failed to fetch organization secrets: ${error.message}`);
        if (scope === 'org') {
          throw error; // If only org secrets requested, fail completely
        }
        // If both requested, continue with repo secrets
      }
    }

    // Fetch repository secrets
    if (scope === 'repo' || scope === 'both') {
      try {
        const repoSecrets = await fetchAllRepositorySecrets(octokit);
        allSecrets.push(...repoSecrets);
        logSuccess(`Fetched ${repoSecrets.length} repository secrets`);
      } catch (error) {
        logError(`Failed to fetch repository secrets: ${error.message}`);
        if (scope === 'repo') {
          throw error; // If only repo secrets requested, fail completely
        }
        // If both requested, continue with what we have
      }
    }

    // Output results
    if (options.fetch) {
      if (allSecrets.length === 0) {
        displayInfo('No secrets found to export');
        return;
      }

      const csvContent = generateSecretsCSV(allSecrets);
      const filename = options.output
        ? saveCSVFileOrganized(csvContent, null, 'secrets', options.output)
        : saveCSVFileOrganized(csvContent, 'secrets', 'secrets');

      if (filename) {
        logExport(`Successfully exported ${allSecrets.length} secrets to ${filename}`);
        displaySuccess(`Secrets exported to: ${filename}`);
      }
    } else {
      // Display secrets in console
      displaySecretsTable(allSecrets, org);
    }
  } catch (error) {
    handleGitHubError(error, 'executing secrets command');
    throw error;
  }
}

/**
 * Displays secrets in a formatted table
 * @param {Array} secrets - Array of secret objects
 * @param {string} org - Organization name
 */
function displaySecretsTable(secrets, org) {
  if (secrets.length === 0) {
    displayInfo('No secrets found');
    return;
  }

  console.log(`\n📋 Secrets for organization: ${org}\n`);

  // Group secrets by scope
  const orgSecrets = secrets.filter(s => s.scope === 'organization');
  const repoSecrets = secrets.filter(s => s.scope === 'repository');

  if (orgSecrets.length > 0) {
    console.log('🏢 Organization Secrets:');
    console.log('─'.repeat(80));
    orgSecrets.forEach(secret => {
      console.log(`  📝 ${secret.name}`);
      console.log(`     Visibility: ${secret.visibility}`);
      if (secret.selected_repositories) {
        console.log(`     Selected Repos: ${secret.selected_repositories}`);
      }
      console.log(`     Updated: ${new Date(secret.updated_at).toLocaleDateString()}`);
      console.log();
    });
  }

  if (repoSecrets.length > 0) {
    console.log('📁 Repository Secrets:');
    console.log('─'.repeat(80));

    // Group by repository
    const repoGroups = {};
    repoSecrets.forEach(secret => {
      if (!repoGroups[secret.repository]) {
        repoGroups[secret.repository] = [];
      }
      repoGroups[secret.repository].push(secret);
    });

    Object.entries(repoGroups).forEach(([repo, secrets]) => {
      console.log(`  📁 ${repo} (${secrets.length} secrets):`);
      secrets.forEach(secret => {
        console.log(`     📝 ${secret.name} - Updated: ${new Date(secret.updated_at).toLocaleDateString()}`);
      });
      console.log();
    });
  }

  // Summary
  console.log('📊 Summary:');
  console.log(`   Organization secrets: ${orgSecrets.length}`);
  console.log(`   Repository secrets: ${repoSecrets.length}`);
  console.log(`   Total secrets: ${secrets.length}`);
}
