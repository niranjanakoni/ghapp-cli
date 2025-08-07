/**
 * Repositories command module
 * Handles listing and managing GitHub repositories
 */

import { getOctokitClient, fetchAllPages, handleGitHubError } from "../utils/github.js";
import { filterRepositories, filterRepositoriesByNames, sortRepositories } from "../utils/filters.js";
import { displayRepository, displaySummary, displayError } from "../utils/display.js";
import { generateRepositoryCSV, generateCollaboratorCSV, saveCSVFile, readRepositoryCSV } from "../utils/fileUtils.js";
import { logFetch, logExport, logDebug } from "../utils/logger.js";

/**
 * Repository command handler
 * Lists repositories accessible to the GitHub App installation
 * @param {Object} options - Command options
 * @param {string} [options.visibility] - Filter by visibility (public, private, internal)
 * @param {string} [options.language] - Filter by programming language
 * @param {string} [options.repoCsv] - Get specific repositories from CSV file
 * @param {boolean} [options.detailed] - Show detailed information
 * @param {boolean} [options.fetch] - Save data to CSV file with detailed metrics instead of displaying
 * @param {boolean} [options.permissions] - Include user permissions for each repository
 * @param {boolean} [options.userPermission] - Fetch collaborators and their roles for each repository
 * @param {string} [options.since] - Filter by last update date
 * @param {number} [options.minStars] - Minimum number of stars
 * @param {number} [options.maxStars] - Maximum number of stars
 * @param {string} [options.sort] - Sort by (name, stars, forks, updated, size)
 * @param {string} [options.order] - Sort order (asc, desc)
 */
export async function handleRepositoriesCommand(options = {}) {
  try {
    const octokit = await getOctokitClient();
    let repos = [];
    let repoSource = "all repositories";

    if (options.repoCsv) {
      logFetch(`Fetching repositories from CSV file: ${options.repoCsv}...`);
      
      const repoNames = readRepositoryCSV(options.repoCsv);
      if (repoNames.length === 0) {
        displayError("reading CSV file", new Error("No valid repository names found in CSV file"));
        return;
      }

      const allRepos = await fetchAllPages(
        (params) => octokit.rest.apps.listReposAccessibleToInstallation(params),
        { perPage: 100 }
      );
      
      repos = filterRepositoriesByNames(allRepos, repoNames);
      repoSource = `repositories from ${options.repoCsv}`;
      
    } else {
      logFetch("Fetching all repositories...");
      
      repos = await fetchAllPages(
        (params) => octokit.rest.apps.listReposAccessibleToInstallation(params),
        { perPage: 100 }
      );
    }

    // Apply filters
    const originalCount = repos.length;
    repos = filterRepositories(repos, options);
    
    // Enrich with permissions if requested
    if (options.permissions || options.userPermission) {
      logFetch("Fetching user permissions for repositories...");
      repos = await enrichRepositoriesWithPermissions(octokit, repos);
    }

    // Enrich with detailed metrics if fetching to CSV (but not if permissions are requested)
    if (options.fetch && !options.permissions && !options.userPermission) {
      logFetch("Fetching detailed metrics for repositories...");
      repos = await enrichRepositoriesWithDetailedMetrics(octokit, repos);
    }

    // Apply sorting
    if (options.sort) {
      repos = sortRepositories(repos, options.sort, options.order || 'asc');
    }

    // Output results
    if (options.fetch) {
      let csvContent;
      let filenamePrefix;
      
      if (options.permissions || options.userPermission) {
        // Generate collaborator CSV when permissions are requested
        csvContent = generateCollaboratorCSV(repos);
        filenamePrefix = 'collaborators';
      } else {
        // Generate standard repository CSV with metrics
        csvContent = generateRepositoryCSV(repos);
        filenamePrefix = 'repositories';
      }
      
      const filename = saveCSVFile(csvContent, filenamePrefix);
      
      if (filename) {
        if (options.permissions || options.userPermission) {
          logExport(`Exported collaborators from ${repos.length} repositories to ${filename}`);
        } else {
          logExport(`Exported ${repos.length} repositories to ${filename}`);
        }
      }
    } else {
      const totalCount = originalCount !== repos.length ? originalCount : null;
      displaySummary('repositories', repos.length, repoSource, totalCount);
      
      repos.forEach((repo) => displayRepository(repo, options.detailed));
    }

  } catch (error) {
    handleGitHubError(error, "fetching repositories");
  }
}

/**
 * Enriches repositories with detailed metrics and counts
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {Array} repositories - Array of repository objects
 * @returns {Promise<Array>} Repositories with detailed metrics
 */
async function enrichRepositoriesWithDetailedMetrics(octokit, repositories) {
  const enrichedRepos = [];
  
  console.log(`\n📊 Fetching detailed metrics for ${repositories.length} repositories...`);
  
  for (let i = 0; i < repositories.length; i++) {
    const repo = repositories[i];
    console.log(`Progress: ${i + 1}/${repositories.length} - ${repo.full_name}`);
    
    try {
      const enrichedRepo = { ...repo };
      
      // Check if repository is empty
      try {
        const { data: contents } = await octokit.rest.repos.getContent({
          owner: repo.owner.login,
          repo: repo.name,
          path: ''
        });
        enrichedRepo.isEmpty = !contents || contents.length === 0;
      } catch (error) {
        // If we get 404, the repo is likely empty
        enrichedRepo.isEmpty = error.status === 404;
      }
      
      // Get branches count
      try {
        const branches = await fetchAllPages(
          (params) => octokit.rest.repos.listBranches({
            owner: repo.owner.login,
            repo: repo.name,
            ...params
          }),
          { perPage: 100 }
        );
        enrichedRepo.branchCount = branches.length;
      } catch (error) {
        enrichedRepo.branchCount = 0;
      }
      
      // Get issues and PRs count
      try {
        // Get all issues (includes PRs)
        const allIssues = await fetchAllPages(
          (params) => octokit.rest.issues.listForRepo({
            owner: repo.owner.login,
            repo: repo.name,
            state: 'all',
            ...params
          }),
          { perPage: 100 }
        );
        
        // Get open issues
        const openIssues = await fetchAllPages(
          (params) => octokit.rest.issues.listForRepo({
            owner: repo.owner.login,
            repo: repo.name,
            state: 'open',
            ...params
          }),
          { perPage: 100 }
        );
        
        // Separate issues from PRs
        const actualIssues = allIssues.filter(issue => !issue.pull_request);
        const pullRequests = allIssues.filter(issue => issue.pull_request);
        
        const actualOpenIssues = openIssues.filter(issue => !issue.pull_request);
        const openPullRequests = openIssues.filter(issue => issue.pull_request);
        
        enrichedRepo.issueCount = actualIssues.length;
        enrichedRepo.openIssues = actualOpenIssues.length;
        enrichedRepo.closedIssues = actualIssues.length - actualOpenIssues.length;
        
        enrichedRepo.prCount = pullRequests.length;
        enrichedRepo.openPRs = openPullRequests.length;
        enrichedRepo.closedPRs = pullRequests.length - openPullRequests.length;
        
        // Count issue comments
        let issueCommentCount = 0;
        for (const issue of actualIssues) {
          issueCommentCount += issue.comments || 0;
        }
        enrichedRepo.issueCommentCount = issueCommentCount;
        
      } catch (error) {
        enrichedRepo.issueCount = 0;
        enrichedRepo.openIssues = 0;
        enrichedRepo.closedIssues = 0;
        enrichedRepo.prCount = 0;
        enrichedRepo.openPRs = 0;
        enrichedRepo.closedPRs = 0;
        enrichedRepo.issueCommentCount = 0;
      }
      
      // Get releases count
      try {
        const releases = await fetchAllPages(
          (params) => octokit.rest.repos.listReleases({
            owner: repo.owner.login,
            repo: repo.name,
            ...params
          }),
          { perPage: 100 }
        );
        enrichedRepo.releaseCount = releases.length;
      } catch (error) {
        enrichedRepo.releaseCount = 0;
      }
      
      // Get tags count
      try {
        const tags = await fetchAllPages(
          (params) => octokit.rest.repos.listTags({
            owner: repo.owner.login,
            repo: repo.name,
            ...params
          }),
          { perPage: 100 }
        );
        enrichedRepo.tagCount = tags.length;
      } catch (error) {
        enrichedRepo.tagCount = 0;
      }
      
      // Get projects count - Skip due to API deprecation
      enrichedRepo.projectCount = 0; // Set to 0 since Projects (classic) API is deprecated
      
      // Get PR review comments counts
      try {
        const pulls = await fetchAllPages(
          (params) => octokit.rest.pulls.list({
            owner: repo.owner.login,
            repo: repo.name,
            state: 'all',
            ...params
          }),
          { perPage: 100 }
        );
        
        let prReviewCommentCount = 0;
        
        for (const pr of pulls) {
          try {
            const reviewComments = await fetchAllPages(
              (params) => octokit.rest.pulls.listReviewComments({
                owner: repo.owner.login,
                repo: repo.name,
                pull_number: pr.number,
                ...params
              }),
              { perPage: 100 }
            );
            prReviewCommentCount += reviewComments.length;
          } catch (error) {
            // Handle individual PR errors
          }
        }
        
        enrichedRepo.prReviewCommentCount = prReviewCommentCount;
      } catch (error) {
        enrichedRepo.prReviewCommentCount = 0;
      }
      
      // Get commit comments count
      try {
        const commitComments = await fetchAllPages(
          (params) => octokit.rest.repos.listCommitCommentsForRepo({
            owner: repo.owner.login,
            repo: repo.name,
            ...params
          }),
          { perPage: 100 }
        );
        enrichedRepo.commitCommentCount = commitComments.length;
      } catch (error) {
        enrichedRepo.commitCommentCount = 0;
      }
      
      enrichedRepos.push(enrichedRepo);
      
    } catch (error) {
      logDebug(`Error enriching repository ${repo.full_name}: ${error.message}`);
      
      // Add repository with default values
      enrichedRepos.push({
        ...repo,
        isEmpty: false,
        issueCount: 0,
        openIssues: 0,
        closedIssues: 0,
        prCount: 0,
        openPRs: 0,
        closedPRs: 0,
        prReviewCommentCount: 0,
        commitCommentCount: 0,
        issueCommentCount: 0,
        releaseCount: 0,
        projectCount: 0,
        branchCount: 0,
        tagCount: 0
      });
    }
  }
  
  console.log(`✅ Detailed metrics collection completed for ${enrichedRepos.length} repositories.\n`);
  
  return enrichedRepos;
}

/**
 * Enriches repositories with user permission information and collaborators
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {Array} repositories - Array of repository objects
 * @returns {Promise<Array>} Repositories with collaborators and permission data
 */
async function enrichRepositoriesWithPermissions(octokit, repositories) {
  const enrichedRepos = [];
  
  console.log(`\n📋 Fetching collaborators for ${repositories.length} repositories...`);
  
  for (let i = 0; i < repositories.length; i++) {
    const repo = repositories[i];
    console.log(`Progress: ${i + 1}/${repositories.length} - ${repo.full_name}`);
    
    try {
      // First, get direct collaborators only (users explicitly added to the repo)
      const directCollaborators = await fetchAllPages(
        (params) => octokit.rest.repos.listCollaborators({
          owner: repo.owner.login,
          repo: repo.name,
          affiliation: 'direct',
          ...params
        }),
        { perPage: 100 }
      );
      
      // Get detailed permission for each direct collaborator
      const collaboratorsWithRoles = [];
      for (const collab of directCollaborators) {
        try {
          const permissionResponse = await octokit.rest.repos.getCollaboratorPermissionLevel({
            owner: repo.owner.login,
            repo: repo.name,
            username: collab.login
          });
          
          const permission = permissionResponse.data.permission;
          const normalizedRole = normalizePermission(permission);
          
          // Only include users who are direct collaborators (not inherited from org)
          if (permission && ['admin', 'write', 'maintain', 'triage', 'read'].includes(permission)) {
            collaboratorsWithRoles.push({
              username: collab.login,
              role: normalizedRole,
              originalRole: permission,
              source: 'direct'
            });
          }
        } catch (error) {
          logDebug(`Error getting permission for ${collab.login} in ${repo.full_name}: ${error.message}`);
          collaboratorsWithRoles.push({
            username: collab.login,
            role: 'unknown',
            originalRole: 'unknown',
            source: 'error'
          });
        }
      }
      
      enrichedRepos.push({
        ...repo,
        collaborators: collaboratorsWithRoles
      });
      
    } catch (error) {
      // Handle permission errors gracefully
      logDebug(`Error getting collaborators for ${repo.full_name}: ${error.message}`);
      
      enrichedRepos.push({
        ...repo,
        collaborators: [],
        error: 'Unable to fetch collaborators'
      });
    }
  }
  
  console.log(`✅ Collaborator fetch completed for ${enrichedRepos.length} repositories.\n`);
  
  return enrichedRepos;
}

/**
 * Normalizes permission names to GitHub API standard values
 * @param {string} permission - The permission level from GitHub API
 * @returns {string} Normalized permission name
 */
function normalizePermission(permission) {
  // Permission mapping to match Python script standards
  const permissionMapping = {
    "admin": "admin",
    "write": "push",      // GitHub API uses 'write', but normalize to 'push' like Python script
    "read": "pull",       // GitHub API uses 'read', but normalize to 'pull' like Python script
    "maintain": "maintain",
    "triage": "triage"
  };
  return permissionMapping[permission?.toLowerCase()] || permission;
}

/**
 * Gets repository statistics
 * @param {Array} repos - Array of repository objects
 * @returns {Object} Repository statistics
 */
export function getRepositoryStats(repos) {
  const stats = {
    total: repos.length,
    public: 0,
    private: 0,
    internal: 0,
    languages: {},
    totalStars: 0,
    totalForks: 0,
    totalSize: 0,
    archived: 0,
    hasIssues: 0,
    hasWiki: 0
  };

  repos.forEach(repo => {
    // Count by visibility
    const visibility = repo.visibility || (repo.private ? 'private' : 'public');
    stats[visibility]++;

    // Count by language
    if (repo.language) {
      stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
    }

    // Sum metrics
    stats.totalStars += repo.stargazers_count || 0;
    stats.totalForks += repo.forks_count || 0;
    stats.totalSize += repo.size || 0;

    // Count features
    if (repo.archived) stats.archived++;
    if (repo.has_issues) stats.hasIssues++;
    if (repo.has_wiki) stats.hasWiki++;
  });

  return stats;
}

/**
 * Displays repository statistics
 * @param {Array} repos - Array of repository objects
 */
export function displayRepositoryStats(repos) {
  const stats = getRepositoryStats(repos);
  
  console.log('📊 Repository Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Public: ${stats.public} | Private: ${stats.private} | Internal: ${stats.internal}`);
  console.log(`   Archived: ${stats.archived}`);
  console.log(`   With Issues: ${stats.hasIssues} | With Wiki: ${stats.hasWiki}`);
  console.log(`   Total Stars: ${stats.totalStars.toLocaleString()}`);
  console.log(`   Total Forks: ${stats.totalForks.toLocaleString()}`);
  console.log(`   Total Size: ${(stats.totalSize / 1024).toFixed(2)} MB`);
  
  // Top languages
  const topLanguages = Object.entries(stats.languages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
    
  if (topLanguages.length > 0) {
    console.log('   Top Languages:');
    topLanguages.forEach(([lang, count]) => {
      console.log(`     ${lang}: ${count}`);
    });
  }
  
  console.log('');
}

/**
 * Validates repository command options
 * @param {Object} options - Command options to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateRepositoryOptions(options) {
  const errors = [];
  
  // Validate visibility option
  if (options.visibility) {
    const validVisibilities = ['public', 'private', 'internal'];
    if (!validVisibilities.includes(options.visibility.toLowerCase())) {
      errors.push(`Invalid visibility: ${options.visibility}. Must be one of: ${validVisibilities.join(', ')}`);
    }
  }
  
  // Validate sort option
  if (options.sort) {
    const validSortOptions = ['name', 'stars', 'forks', 'updated', 'size'];
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
  
  // Validate star range
  if (typeof options.minStars === 'number' && typeof options.maxStars === 'number') {
    if (options.minStars > options.maxStars) {
      errors.push('minStars cannot be greater than maxStars');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
