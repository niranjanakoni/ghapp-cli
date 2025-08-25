import { getOctokitClient, fetchAllPages, handleGitHubError, getInstallationOrg } from '../utils/github.js';
import { displayError, displaySuccess, displayInfo } from '../utils/display.js';
import { generateVariablesCSV, generateVariablesCSVToFile } from '../utils/fileUtils.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Main handler for variables command
 * @param {Object} options - Command options
 */
export async function handleVariablesCommand(options) {
  try {
    logDebug('Starting variables command', { options });

    // Handle quiet mode
    const isQuiet = options.quiet;

    // Get GitHub client and organization
    const octokit = await getOctokitClient();
    const org = await getInstallationOrg(octokit);

    if (!org) {
      displayError('Unable to determine organization from GitHub App installation');
      return;
    }

    const allVariables = [];
    const scope = options.scope || 'both';

    // Determine what action to take
    const shouldExport = options.fetch; // --fetch flag exports to CSV
    const shouldDisplay = !options.fetch; // Default behavior: display variables

    // Fetch variables based on scope
    if (!isQuiet && options.verbose) {
      displayInfo(`🔍 Fetching variables for organization: ${org} (scope: ${scope})`);
    }

    try {
      // Fetch organization variables if scope includes org
      if (scope === 'org' || scope === 'both') {
        const orgVariables = await fetchOrganizationVariables(octokit, org, options.verbose, options.visibility);
        allVariables.push(...orgVariables);
      }

      // Fetch repository variables if scope includes repo
      if (scope === 'repo' || scope === 'both') {
        const repoVariables = await fetchAllRepositoryVariables(octokit, org, options.verbose);
        allVariables.push(...repoVariables);
      }

      // Display summary and details for console display
      if (shouldDisplay && !isQuiet) {
        const orgCount = allVariables.filter(v => v.scope === 'organization').length;
        const repoCount = allVariables.filter(v => v.scope === 'repository').length;
        const totalCount = allVariables.length;

        displaySuccess(`📊 Found ${totalCount} variables (${orgCount} org, ${repoCount} repo)`);

        if (totalCount > 0) {
          displayVariablesByScope(allVariables);
        }
      }

      // Export to CSV if --fetch flag is used
      if (shouldExport) {
        if (allVariables.length > 0) {
          const csvPath = options.output
            ? await generateVariablesCSVToFile(allVariables, options.output)
            : await generateVariablesCSV(allVariables);

          if (!isQuiet) {
            displaySuccess(`✅ Exported ${allVariables.length} variables to: ${csvPath}`);
          }
        } else {
          if (!isQuiet) {
            displayInfo('ℹ️ No variables found to export.');
          }
        }
      }
    } catch (error) {
      await handleGitHubError(error, 'fetching variables');
    }
  } catch (error) {
    await handleGitHubError(error, 'variables command');
  }
}

/**
 * Fetch organization-level variables
 * @param {Octokit} octokit - GitHub API client
 * @param {string} org - Organization name
 * @param {boolean} verbose - Verbose logging
 * @param {string} visibility - Filter by visibility (all, private, selected)
 * @returns {Array} Array of organization variables
 */
async function fetchOrganizationVariables(octokit, org, verbose = false, visibility = null) {
  try {
    if (verbose) {
      displayInfo(`📋 Fetching organization variables for: ${org}`);
    }

    const variables = await fetchAllPages(
      (params) => octokit.rest.actions.listOrgVariables({
        org,
        ...params
      }),
      { perPage: 100 }
    );

    if (verbose && variables.length > 0) {
      displayInfo(`✅ Found ${variables.length} organization variables`);
    } else if (verbose) {
      displayInfo('ℹ️ No organization variables found');
    }

    // Filter by visibility if specified
    let filteredVariables = variables;
    if (visibility) {
      filteredVariables = variables.filter(variable => variable.visibility === visibility);
      if (verbose) {
        displayInfo(`🔍 Filtered to ${filteredVariables.length} variables with visibility: ${visibility}`);
      }
    }

    // Process each variable and fetch selected repositories if needed
    const processedVariables = [];
    for (const variable of filteredVariables) {
      let selectedRepos = '';

      // If the variable has 'selected' visibility, fetch the selected repositories
      if (variable.visibility === 'selected') {
        try {
          if (verbose) {
            displayInfo(`🔍 Fetching selected repositories for variable: ${variable.name}`);
          }

          const selectedReposResponse = await octokit.request('GET /orgs/{org}/actions/variables/{variable_name}/repositories', {
            org,
            variable_name: variable.name
          });

          selectedRepos = selectedReposResponse.data.repositories
            ?.map(repo => repo.name)
            .join(', ') || '';
        } catch (error) {
          if (verbose) {
            displayInfo(`⚠️ Could not fetch selected repositories for ${variable.name}: ${error.message}`);
          }
          selectedRepos = '[SELECTED_REPOS_ERROR]';
        }
      }

      processedVariables.push({
        scope: 'organization',
        repository: '',
        name: variable.name,
        value: variable.value || '[VARIABLE_VALUE_NOT_AVAILABLE]',
        visibility: variable.visibility || 'private',
        selected_repositories: selectedRepos,
        created_at: variable.created_at || '',
        updated_at: variable.updated_at || ''
      });
    }

    return processedVariables;
  } catch (error) {
    if (error.status === 404) {
      if (verbose) {
        displayInfo(`ℹ️ Organization variables not accessible or don't exist for: ${org}`);
      }
      return [];
    }
    logError(`Error fetching organization variables: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch variables from all repositories in the organization
 * @param {Octokit} octokit - GitHub API client
 * @param {string} org - Organization name
 * @param {boolean} verbose - Verbose logging
 * @returns {Array} Array of repository variables
 */
async function fetchAllRepositoryVariables(octokit, org, verbose = false) {
  try {
    if (verbose) {
      displayInfo(`📋 Fetching repositories for organization: ${org}`);
    }

    // Get all repositories in the organization
    const repositories = await fetchAllPages(
      (params) => octokit.rest.repos.listForOrg({
        org,
        type: 'all',
        sort: 'name',
        ...params
      }),
      { perPage: 100 }
    );

    if (verbose) {
      displayInfo(`📦 Found ${repositories.length} repositories, fetching variables...`);
    }

    const allRepoVariables = [];
    const batchSize = 5; // Process repositories in batches to avoid rate limiting

    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);
      const batchPromises = batch.map(repo =>
        fetchRepositoryVariables(octokit, org, repo.name)
          .catch(error => {
            if (verbose) {
              displayInfo(`⚠️ Could not fetch variables for ${repo.name}: ${error.message}`);
            }
            return [];
          })
      );

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(repoVariables => {
        allRepoVariables.push(...repoVariables);
      });

      // Small delay between batches to be gentle on the API
      if (i + batchSize < repositories.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (verbose) {
      displayInfo(`✅ Collected ${allRepoVariables.length} variables from ${repositories.length} repositories`);
    }

    return allRepoVariables;
  } catch (error) {
    logError(`Error fetching repository variables: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch variables for a specific repository
 * @param {Octokit} octokit - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Array} Array of repository variables
 */
async function fetchRepositoryVariables(octokit, owner, repo) {
  try {
    const variables = await fetchAllPages(
      (params) => octokit.rest.actions.listRepoVariables({
        owner,
        repo,
        ...params
      }),
      { perPage: 100 }
    );

    return variables.map(variable => ({
      scope: 'repository',
      repository: repo,
      name: variable.name,
      value: variable.value || '[VARIABLE_VALUE_NOT_AVAILABLE]',
      visibility: 'repository', // Repository variables are always repository-scoped
      selected_repositories: '',
      created_at: variable.created_at || '',
      updated_at: variable.updated_at || ''
    }));
  } catch (error) {
    if (error.status === 404 || error.status === 403) {
      // Repository doesn't exist, is private, or variables are not accessible
      return [];
    }
    throw error;
  }
}

/**
 * Display variables grouped by scope
 * @param {Array} variables - Array of variables
 */
function displayVariablesByScope(variables) {
  const orgVariables = variables.filter(v => v.scope === 'organization');
  const repoVariables = variables.filter(v => v.scope === 'repository');

  if (orgVariables.length > 0) {
    displayInfo('\n📋 Organization Variables:');
    orgVariables.forEach(variable => {
      console.log(`  🔧 ${variable.name} (${variable.visibility})`);
      if (variable.value && variable.value !== '[VARIABLE_VALUE_NOT_AVAILABLE]') {
        console.log(`     Value: ${variable.value}`);
      }
      if (variable.selected_repositories) {
        console.log(`     Selected repos: ${variable.selected_repositories}`);
      }
    });
  }

  if (repoVariables.length > 0) {
    displayInfo('\n📦 Repository Variables:');
    const repoGroups = {};
    repoVariables.forEach(variable => {
      if (!repoGroups[variable.repository]) {
        repoGroups[variable.repository] = [];
      }
      repoGroups[variable.repository].push(variable);
    });

    Object.keys(repoGroups).sort().forEach(repoName => {
      console.log(`  📁 ${repoName}:`);
      repoGroups[repoName].forEach(variable => {
        console.log(`    🔧 ${variable.name}`);
        if (variable.value && variable.value !== '[VARIABLE_VALUE_NOT_AVAILABLE]') {
          console.log(`       Value: ${variable.value}`);
        }
      });
    });
  }
}

/**
 * Display help information for variables command
 */
export function displayVariablesHelp() {
  console.log(`
📋 Variables Command Help
=======================

DESCRIPTION:
  Fetch and export GitHub Actions variables from organization and repository levels.
  Variables store non-sensitive configuration data that can be used in workflows.

USAGE:
  node cli.js variables [options]

OPTIONS:
  --fetch, -f          Fetch variables from GitHub (organization and repositories)
  --export, -e         Export fetched variables to CSV file
  --verbose, -v        Enable verbose logging with detailed output
  --help, -h          Show this help information

EXAMPLES:
  
  # Fetch and display all variables
  node cli.js variables --fetch
  
  # Fetch variables with detailed logging
  node cli.js variables --fetch --verbose
  
  # Export variables to CSV (must fetch first)
  node cli.js variables --fetch --export
  
  # Export only (if variables already fetched)
  node cli.js variables --export
  
  # Fetch and export with verbose output
  node cli.js variables --fetch --export --verbose

CSV OUTPUT:
  The exported CSV includes these columns:
  - scope: organization or repository
  - repository: repository name (empty for org variables)
  - name: variable name
  - value: variable value (when available)
  - visibility: all, private, selected (organization variables)
  - selected_repositories: comma-separated list of selected repos
  - created_at: creation timestamp (ISO format)
  - updated_at: last update timestamp (ISO format)

NOTES:
  - Organization variables can have visibility: all, private, or selected
  - Repository variables are always repository-scoped
  - Variable values are retrieved when available through the API
  - Large organizations may take time due to API rate limiting
  - Results are automatically paginated for complete data retrieval

PERMISSIONS REQUIRED:
  - GitHub App must have 'Variables' read permissions
  - Access to organization and repository variables
  - Organization member or collaborator access
`);
}

/**
 * Validate variables command options
 * @param {Object} options - Command options
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateVariablesOptions(options = {}) {
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
