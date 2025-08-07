/**
 * Webhooks command module
 * Handles listing and managing GitHub repository webhooks
 */

import { getOctokitClient, fetchAllPages, getInstallationOrg, handleGitHubError } from '../utils/github.js';
import { filterRepositories, sortRepositories } from '../utils/filters.js'; // eslint-disable-line no-unused-vars
import { displaySummary, displayProgress, displayError } from '../utils/display.js';
import { saveCSVFileOrganized } from '../utils/fileUtils.js';
import { logFetch, logExport, logDetection, logDebug } from '../utils/logger.js';
import { config } from '../config/config.js';

/**
 * Fetches paginated data quietly (without logging permission errors)
 * @param {Function} apiCall - GitHub API call function
 * @param {Object} options - API call options
 * @returns {Promise<Array>} Results array
 */
async function fetchAllPagesQuietly(apiCall, options = {}) {
  const results = [];
  let currentPage = 1;
  const perPage = Math.min(options.perPage || config.api.defaultPerPage, config.api.maxPerPage);

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

  return results;
}

/**
 * Webhooks command handler
 * Lists webhooks for repositories in the specified organization
 * @param {string} org - Organization name (optional, will auto-detect if not provided)
 * @param {Object} options - Command options
 * @param {string} [options.repo] - Specific repository name to check
 * @param {boolean} [options.fetch] - Save data to CSV file instead of displaying
 * @param {boolean} [options.detailed] - Show detailed webhook information
 * @param {string} [options.event] - Filter by specific event type
 * @param {boolean} [options.activeOnly] - Show only active webhooks
 * @param {string} [options.sort] - Sort by (repo, url, events, created)
 * @param {string} [options.order] - Sort order (asc, desc)
 */
export async function handleWebhooksCommand(org, options = {}) {
  try {
    const octokit = await getOctokitClient();

    // Auto-detect organization if not provided
    if (!org) {
      logDetection('No organization specified, detecting from GitHub App installation...');
      org = await getInstallationOrg(octokit);

      if (!org) {
        displayError('organization detection', new Error('Could not auto-detect organization. Please specify: ghapp webhooks <org>'));
        return;
      }

      logDetection(`Detected organization: ${org}`);
    }

    let repositories = [];

    if (options.repo) {
      // Check specific repository
      logFetch(`Fetching webhooks for repository ${org}/${options.repo}...`);
      try {
        const { data: repo } = await octokit.rest.repos.get({
          owner: org,
          repo: options.repo
        });
        repositories = [repo];
      } catch (error) {
        if (error.status === 404) {
          displayError('fetching repository', new Error(`Repository '${org}/${options.repo}' not found or not accessible`));
          return;
        }
        throw error;
      }
    } else {
      // Get all repositories in the organization
      logFetch(`Fetching all repositories from ${org}...`);
      repositories = await fetchAllPages(
        (params) => octokit.rest.repos.listForOrg(params),
        { org, perPage: 100 }
      );
    }

    // Fetch webhook details for each repository
    logFetch('Fetching webhook details for repositories...');
    const webhookData = await enrichRepositoriesWithWebhooks(octokit, org, repositories);

    // Filter webhooks based on options
    let filteredWebhooks = webhookData;

    // Check if there are permission issues affecting most repositories
    const repositoriesWithErrors = webhookData.filter(item => item.access_error === 'insufficient_permissions').length;
    const hasWidespreadPermissionIssues = repositoriesWithErrors > (webhookData.length * 0.5); // eslint-disable-line no-unused-vars

    // By default, only show repositories that have webhooks unless --show-all is specified
    if (!options.showAll) {
      filteredWebhooks = filteredWebhooks.filter(item =>
        item.webhooks.length > 0
      );
    }

    if (options.event) {
      filteredWebhooks = filteredWebhooks.filter(item =>
        item.webhooks.some(webhook => webhook.events.includes(options.event))
      );
    }

    if (options.activeOnly) {
      filteredWebhooks = filteredWebhooks.filter(item =>
        item.webhooks.some(webhook => webhook.active)
      );
    }

    // Apply sorting
    if (options.sort) {
      filteredWebhooks = sortWebhookData(filteredWebhooks, options.sort, options.order || 'asc');
    }

    // Output results
    if (options.fetch) {
      const csvContent = generateWebhooksCSV(filteredWebhooks);
      const filename = saveCSVFileOrganized(csvContent, `webhooks_${org}`, 'webhooks');

      if (filename) {
        const totalWebhooks = filteredWebhooks.reduce((sum, item) => sum + item.webhooks.length, 0);
        logExport(`Exported ${totalWebhooks} webhooks from ${filteredWebhooks.length} repositories in ${org} to ${filename}`);
      }
    } else {
      const totalWebhooks = filteredWebhooks.reduce((sum, item) => sum + item.webhooks.length, 0);

      // Show information about filtering
      if (!options.showAll && webhookData.length > filteredWebhooks.length) {
        const hiddenCount = webhookData.length - filteredWebhooks.length;
        console.log(`\n🔍 Showing ${filteredWebhooks.length} repositories with webhooks (hiding ${hiddenCount} repositories without webhooks).`);
        console.log('   Use --show-all to display all repositories including those without webhooks.\n');
      }

      displaySummary('webhooks', totalWebhooks, `across ${filteredWebhooks.length} repositories in ${org}`);

      filteredWebhooks.forEach((item) => displayRepositoryWebhooks(item, options.detailed));
    }
  } catch (error) {
    if (error.status === 404) {
      displayError('fetching webhooks', new Error(`Organization '${org}' not found or not accessible`));
    } else {
      handleGitHubError(error, 'fetching webhooks');
    }
  }
}

/**
 * Enriches repositories with webhook information
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {Array} repositories - Array of repository objects
 * @returns {Promise<Array>} Repositories with webhook data
 */
async function enrichRepositoriesWithWebhooks(octokit, org, repositories) {
  const enrichedData = [];
  let permissionErrorCount = 0;
  let hasShownPermissionWarning = false;

  for (let i = 0; i < repositories.length; i++) {
    const repo = repositories[i];

    displayProgress('Fetching webhook data', i + 1, repositories.length);

    try {
      // Get webhooks for this repository
      const webhooks = await fetchAllPagesQuietly(
        (params) => octokit.rest.repos.listWebhooks(params),
        { owner: org, repo: repo.name, perPage: 100 }
      );

      // Enrich each webhook with additional details
      const enrichedWebhooks = [];
      for (const webhook of webhooks) {
        try {
          // Get detailed webhook information
          const { data: webhookDetails } = await octokit.rest.repos.getWebhook({
            owner: org,
            repo: repo.name,
            hook_id: webhook.id
          });

          enrichedWebhooks.push({
            id: webhookDetails.id,
            name: webhookDetails.name || 'web',
            active: webhookDetails.active,
            events: webhookDetails.events || [],
            config: {
              url: webhookDetails.config?.url || '',
              content_type: webhookDetails.config?.content_type || '',
              secret: webhookDetails.config?.secret ? '***configured***' : 'not configured',
              insecure_ssl: webhookDetails.config?.insecure_ssl || '0'
            },
            created_at: webhookDetails.created_at,
            updated_at: webhookDetails.updated_at,
            ping_url: webhookDetails.ping_url,
            test_url: webhookDetails.test_url,
            last_response: webhookDetails.last_response || {}
          });
        } catch (webhookError) {
          logDebug(`Cannot get details for webhook ${webhook.id} in ${repo.name}: ${webhookError.message}`);

          // Add basic webhook info even if detailed fetch fails
          enrichedWebhooks.push({
            id: webhook.id,
            name: webhook.name || 'web',
            active: webhook.active,
            events: webhook.events || [],
            config: webhook.config || {},
            created_at: webhook.created_at,
            updated_at: webhook.updated_at,
            ping_url: webhook.ping_url || '',
            test_url: webhook.test_url || '',
            last_response: webhook.last_response || {}
          });
        }
      }

      enrichedData.push({
        repository: {
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          html_url: repo.html_url,
          default_branch: repo.default_branch
        },
        webhooks: enrichedWebhooks,
        webhook_count: enrichedWebhooks.length
      });
    } catch (error) {
      // Handle permission errors more gracefully
      if (error.status === 403 && error.message.includes('Resource not accessible by integration')) {
        permissionErrorCount++;

        // Show warning only once, not for every repository
        if (!hasShownPermissionWarning) {
          console.log('\n⚠️  GitHub App lacks webhook read permissions. Skipping webhook data collection...');
          console.log('📋 To enable webhook features, update your GitHub App permissions:');
          console.log('   • Repository Administration: Read');
          console.log('   • Then update the app installation\n');
          hasShownPermissionWarning = true;
        }

        logDebug(`Skipping webhooks for ${repo.name} due to insufficient permissions`);
      } else {
        logDebug(`Cannot access webhooks for repository ${repo.name}: ${error.message}`);
      }

      // Add repository with empty webhooks if access fails
      enrichedData.push({
        repository: {
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          html_url: repo.html_url,
          default_branch: repo.default_branch
        },
        webhooks: [],
        webhook_count: 0,
        access_error: error.status === 403 ? 'insufficient_permissions' : 'unknown_error'
      });
    }
  }

  // Show summary of permission issues if any occurred
  if (permissionErrorCount > 0) {
    console.log(`\n📊 Summary: Skipped webhook data for ${permissionErrorCount}/${repositories.length} repositories due to permission restrictions.`);
    console.log('🔧 Update your GitHub App\'s \'Administration\' permission to \'Read\' to access webhook configurations.\n');
  }

  return enrichedData;
}

/**
 * Generates CSV content for webhook data
 * @param {Array} webhookData - Array of repository webhook data
 * @returns {string} CSV content
 */
function generateWebhooksCSV(webhookData) {
  const csvRows = [];

  // Add header
  csvRows.push([
    'Repository Name',
    'Repository Full Name',
    'Repository Private',
    'Repository URL',
    'Webhook ID',
    'Webhook Name',
    'Webhook Active',
    'Webhook URL',
    'Content Type',
    'Secret Configured',
    'Insecure SSL',
    'Events',
    'Created At',
    'Updated At',
    'Last Response Status',
    'Last Response Message'
  ]);

  for (const item of webhookData) {
    const repo = item.repository;
    const webhooks = item.webhooks;

    if (webhooks.length === 0) {
      // Repository with no webhooks
      csvRows.push([
        repo.name || '',
        repo.full_name || '',
        repo.private ? 'true' : 'false',
        repo.html_url || '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    } else {
      // Repository with webhooks
      for (const webhook of webhooks) {
        csvRows.push([
          repo.name || '',
          repo.full_name || '',
          repo.private ? 'true' : 'false',
          repo.html_url || '',
          webhook.id.toString(),
          webhook.name || '',
          webhook.active ? 'true' : 'false',
          webhook.config?.url || '',
          webhook.config?.content_type || '',
          webhook.config?.secret || '',
          webhook.config?.insecure_ssl || '',
          (webhook.events || []).join('; '),
          webhook.created_at || '',
          webhook.updated_at || '',
          webhook.last_response?.status || '',
          webhook.last_response?.message || ''
        ]);
      }
    }
  }

  // Convert to CSV string
  return csvRows.map(row => row.map(cell => `"${escapeCSVField(cell)}"`).join(',')).join('\n');
}

/**
 * Displays webhook information for a repository
 * @param {Object} item - Repository webhook data
 * @param {boolean} detailed - Show detailed information
 */
function displayRepositoryWebhooks(item, detailed = false) {
  const repo = item.repository;
  const webhooks = item.webhooks;

  console.log(`📦 ${repo.name} (${repo.full_name})`);
  console.log(`   🔗 ${repo.html_url}`);
  console.log(`   🔒 ${repo.private ? 'Private' : 'Public'}`);

  if (webhooks.length === 0) {
    console.log('   📡 No webhooks configured');
  } else {
    console.log(`   📡 ${webhooks.length} webhook${webhooks.length !== 1 ? 's' : ''} configured:`);

    webhooks.forEach((webhook, index) => {
      const status = webhook.active ? '🟢' : '🔴';
      console.log(`      ${index + 1}. ${status} ${webhook.name} (ID: ${webhook.id})`);
      console.log(`         URL: ${webhook.config?.url || 'Not configured'}`);
      console.log(`         Events: ${webhook.events.join(', ') || 'None'}`);

      if (detailed) {
        console.log(`         Content Type: ${webhook.config?.content_type || 'Not specified'}`);
        console.log(`         Secret: ${webhook.config?.secret || 'Not configured'}`);
        console.log(`         Insecure SSL: ${webhook.config?.insecure_ssl || 'false'}`);
        console.log(`         Created: ${webhook.created_at || 'Unknown'}`);
        console.log(`         Updated: ${webhook.updated_at || 'Unknown'}`);

        if (webhook.last_response?.status) {
          console.log(`         Last Response: ${webhook.last_response.status} - ${webhook.last_response.message || 'No message'}`);
        }
      }
    });
  }

  console.log('');
}

/**
 * Sorts webhook data by the specified field
 * @param {Array} webhookData - Array of webhook data
 * @param {string} sortBy - Field to sort by
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted webhook data
 */
function sortWebhookData(webhookData, sortBy, order = 'asc') {
  const multiplier = order === 'desc' ? -1 : 1;

  return webhookData.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy.toLowerCase()) {
    case 'repo':
    case 'repository':
      aValue = a.repository.name.toLowerCase();
      bValue = b.repository.name.toLowerCase();
      break;
    case 'webhooks':
    case 'count':
      aValue = a.webhook_count;
      bValue = b.webhook_count;
      break;
    case 'url':
      aValue = a.webhooks[0]?.config?.url?.toLowerCase() || '';
      bValue = b.webhooks[0]?.config?.url?.toLowerCase() || '';
      break;
    case 'events':
      aValue = a.webhooks[0]?.events?.length || 0;
      bValue = b.webhooks[0]?.events?.length || 0;
      break;
    case 'created':
      aValue = new Date(a.webhooks[0]?.created_at || 0);
      bValue = new Date(b.webhooks[0]?.created_at || 0);
      break;
    default:
      aValue = a.repository.name.toLowerCase();
      bValue = b.repository.name.toLowerCase();
    }

    if (aValue < bValue) return -1 * multiplier;
    if (aValue > bValue) return 1 * multiplier;
    return 0;
  });
}

/**
 * Escapes CSV field content by replacing quotes
 * @param {string} field - Field content to escape
 * @returns {string} Escaped field content
 */
function escapeCSVField(field) {
  if (typeof field !== 'string') {
    return String(field);
  }
  return field.replace(/"/g, '""');
}

/**
 * Validates webhook command options
 * @param {Object} options - Command options to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateWebhookOptions(options) {
  const errors = [];

  // Validate sort option
  if (options.sort) {
    const validSortOptions = ['repo', 'repository', 'webhooks', 'count', 'url', 'events', 'created'];
    if (!validSortOptions.includes(options.sort.toLowerCase())) {
      errors.push(`Invalid sort option: ${options.sort}. Must be one of: ${validSortOptions.join(', ')}`);
    }
  }

  // Validate order option
  if (options.order) {
    const validOrderOptions = ['asc', 'desc'];
    if (!validOrderOptions.includes(options.order.toLowerCase())) {
      errors.push(`Invalid order option: ${options.order}. Must be one of: ${validOrderOptions.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets webhook statistics
 * @param {Array} webhookData - Array of webhook data
 * @returns {Object} Webhook statistics
 */
export function getWebhookStats(webhookData) {
  const stats = {
    totalRepositories: webhookData.length,
    repositoriesWithWebhooks: 0,
    repositoriesWithoutWebhooks: 0,
    totalWebhooks: 0,
    activeWebhooks: 0,
    inactiveWebhooks: 0,
    mostCommonEvents: {},
    averageWebhooksPerRepo: 0
  };

  let totalWebhookCount = 0;

  webhookData.forEach(item => {
    const webhookCount = item.webhooks.length;
    totalWebhookCount += webhookCount;

    if (webhookCount > 0) {
      stats.repositoriesWithWebhooks++;
    } else {
      stats.repositoriesWithoutWebhooks++;
    }

    item.webhooks.forEach(webhook => {
      if (webhook.active) {
        stats.activeWebhooks++;
      } else {
        stats.inactiveWebhooks++;
      }

      // Count events
      webhook.events.forEach(event => {
        stats.mostCommonEvents[event] = (stats.mostCommonEvents[event] || 0) + 1;
      });
    });
  });

  stats.totalWebhooks = totalWebhookCount;
  stats.averageWebhooksPerRepo = webhookData.length > 0 ? (totalWebhookCount / webhookData.length).toFixed(1) : 0;

  return stats;
}

/**
 * Displays webhook statistics
 * @param {Array} webhookData - Array of webhook data
 */
export function displayWebhookStats(webhookData) {
  const stats = getWebhookStats(webhookData);

  console.log('📊 Webhook Statistics:');
  console.log(`   Total repositories: ${stats.totalRepositories}`);
  console.log(`   Repositories with webhooks: ${stats.repositoriesWithWebhooks}`);
  console.log(`   Repositories without webhooks: ${stats.repositoriesWithoutWebhooks}`);
  console.log(`   Total webhooks: ${stats.totalWebhooks}`);
  console.log(`   Active webhooks: ${stats.activeWebhooks}`);
  console.log(`   Inactive webhooks: ${stats.inactiveWebhooks}`);
  console.log(`   Average webhooks per repository: ${stats.averageWebhooksPerRepo}`);

  if (Object.keys(stats.mostCommonEvents).length > 0) {
    console.log('   Most common events:');
    const sortedEvents = Object.entries(stats.mostCommonEvents)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    sortedEvents.forEach(([event, count]) => {
      console.log(`     ${event}: ${count}`);
    });
  }

  console.log('');
}
