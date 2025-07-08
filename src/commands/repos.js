/**
 * Repositories command module
 * Handles listing and managing GitHub repositories
 */

import { getOctokitClient, fetchAllPages, handleGitHubError } from "../utils/github.js";
import { filterRepositories, filterRepositoriesByNames, sortRepositories } from "../utils/filters.js";
import { displayRepository, displaySummary, displayError } from "../utils/display.js";
import { generateRepositoryCSV, saveCSVFile, readRepositoryCSV } from "../utils/fileUtils.js";
import { logFetch, logExport, logDebug } from "../utils/logger.js";

/**
 * Repository command handler
 * Lists repositories accessible to the GitHub App installation
 * @param {Object} options - Command options
 * @param {string} [options.visibility] - Filter by visibility (public, private, internal)
 * @param {string} [options.language] - Filter by programming language
 * @param {string} [options.repoCsv] - Get specific repositories from CSV file
 * @param {boolean} [options.detailed] - Show detailed information
 * @param {boolean} [options.fetch] - Save data to CSV file instead of displaying
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
    
    // Apply sorting
    if (options.sort) {
      repos = sortRepositories(repos, options.sort, options.order || 'asc');
    }

    // Output results
    if (options.fetch) {
      const csvContent = generateRepositoryCSV(repos);
      const filename = saveCSVFile(csvContent, 'repositories');
      
      if (filename) {
        logExport(`Exported ${repos.length} repositories to ${filename}`);
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
