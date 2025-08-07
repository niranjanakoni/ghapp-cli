/**
 * Data filtering utility module
 * Provides filtering functions for repositories, teams, and other data
 */

import { logDebug } from './logger.js';

/**
 * Filters repositories based on provided options
 * @param {Array} repos - Array of repository objects
 * @param {Object} options - Filter options
 * @param {string} [options.visibility] - Filter by visibility (public, private, internal)
 * @param {string} [options.language] - Filter by programming language
 * @param {string} [options.since] - Filter by last update date (ISO string)
 * @param {number} [options.minStars] - Minimum number of stars
 * @param {number} [options.maxStars] - Maximum number of stars
 * @returns {Array} Filtered repositories
 */
export function filterRepositories(repos, options = {}) {
  let filtered = [...repos];
  const originalCount = filtered.length;

  // Filter by visibility
  if (options.visibility) {
    const targetVisibility = options.visibility.toLowerCase();
    filtered = filtered.filter(repo => {
      const visibility = repo.visibility || (repo.private ? 'private' : 'public');
      return visibility.toLowerCase() === targetVisibility;
    });
    logDebug(`Filtered by visibility (${options.visibility}): ${filtered.length} repositories`);
  }

  // Filter by programming language
  if (options.language) {
    const targetLanguage = options.language.toLowerCase();
    filtered = filtered.filter(repo =>
      repo.language && repo.language.toLowerCase() === targetLanguage
    );
    logDebug(`Filtered by language (${options.language}): ${filtered.length} repositories`);
  }

  // Filter by last update date
  if (options.since) {
    const sinceDate = new Date(options.since);
    filtered = filtered.filter(repo => {
      if (!repo.updated_at) return false;
      const updatedDate = new Date(repo.updated_at);
      return updatedDate >= sinceDate;
    });
    logDebug(`Filtered by update date (since ${options.since}): ${filtered.length} repositories`);
  }

  // Filter by minimum stars
  if (typeof options.minStars === 'number') {
    filtered = filtered.filter(repo =>
      (repo.stargazers_count || 0) >= options.minStars
    );
    logDebug(`Filtered by min stars (${options.minStars}): ${filtered.length} repositories`);
  }

  // Filter by maximum stars
  if (typeof options.maxStars === 'number') {
    filtered = filtered.filter(repo =>
      (repo.stargazers_count || 0) <= options.maxStars
    );
    logDebug(`Filtered by max stars (${options.maxStars}): ${filtered.length} repositories`);
  }

  if (originalCount !== filtered.length) {
    logDebug(`Repository filtering complete: ${originalCount} → ${filtered.length}`);
  }

  return filtered;
}

/**
 * Filters teams based on provided options
 * @param {Array} teams - Array of team objects
 * @param {Object} options - Filter options
 * @param {string} [options.visibility] - Filter by privacy (open, closed, secret)
 * @param {number} [options.minMembers] - Minimum number of members
 * @param {number} [options.maxMembers] - Maximum number of members
 * @returns {Array} Filtered teams
 */
export function filterTeams(teams, options = {}) {
  let filtered = [...teams];
  const originalCount = filtered.length;

  // Filter by privacy/visibility
  if (options.visibility) {
    const targetPrivacy = options.visibility.toLowerCase();
    filtered = filtered.filter(team =>
      team.privacy && team.privacy.toLowerCase() === targetPrivacy
    );
    logDebug(`Filtered by privacy (${options.visibility}): ${filtered.length} teams`);
  }

  // Filter by minimum members
  if (typeof options.minMembers === 'number') {
    filtered = filtered.filter(team =>
      typeof team.members_count === 'number' && team.members_count >= options.minMembers
    );
    logDebug(`Filtered by min members (${options.minMembers}): ${filtered.length} teams`);
  }

  // Filter by maximum members
  if (typeof options.maxMembers === 'number') {
    filtered = filtered.filter(team =>
      typeof team.members_count === 'number' && team.members_count <= options.maxMembers
    );
    logDebug(`Filtered by max members (${options.maxMembers}): ${filtered.length} teams`);
  }

  if (originalCount !== filtered.length) {
    logDebug(`Team filtering complete: ${originalCount} → ${filtered.length}`);
  }

  return filtered;
}

/**
 * Filters repositories by a list of names from CSV
 * @param {Array} allRepos - All available repositories
 * @param {Array<string>} repoNames - Repository names to filter by
 * @returns {Array} Matched repositories
 */
export function filterRepositoriesByNames(allRepos, repoNames) {
  const targetRepos = new Set(repoNames.map(name => name.toLowerCase()));

  const matched = allRepos.filter(repo => {
    const repoName = repo.name.toLowerCase();
    const fullName = repo.full_name.toLowerCase();
    return targetRepos.has(repoName) || targetRepos.has(fullName);
  });

  logDebug(`Filtered repositories by names: ${matched.length} matches from ${repoNames.length} requested`);
  return matched;
}

/**
 * Sorts repositories by specified criteria
 * @param {Array} repos - Array of repository objects
 * @param {string} sortBy - Sort criteria (name, stars, forks, updated, size)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted repositories
 */
export function sortRepositories(repos, sortBy = 'name', order = 'asc') {
  const sorted = [...repos].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy.toLowerCase()) {
    case 'stars':
      aValue = a.stargazers_count || 0;
      bValue = b.stargazers_count || 0;
      break;
    case 'forks':
      aValue = a.forks_count || 0;
      bValue = b.forks_count || 0;
      break;
    case 'size':
      aValue = a.size || 0;
      bValue = b.size || 0;
      break;
    case 'updated':
      aValue = new Date(a.updated_at || 0);
      bValue = new Date(b.updated_at || 0);
      break;
    case 'name':
    default:
      aValue = (a.name || '').toLowerCase();
      bValue = (b.name || '').toLowerCase();
      break;
    }

    if (order.toLowerCase() === 'desc') {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });

  logDebug(`Sorted ${repos.length} repositories by ${sortBy} (${order})`);
  return sorted;
}

/**
 * Sorts teams by specified criteria
 * @param {Array} teams - Array of team objects
 * @param {string} sortBy - Sort criteria (name, members, repos)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted teams
 */
export function sortTeams(teams, sortBy = 'name', order = 'asc') {
  const sorted = [...teams].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy.toLowerCase()) {
    case 'members':
      aValue = a.members_count || 0;
      bValue = b.members_count || 0;
      break;
    case 'repos':
      aValue = a.repos_count || 0;
      bValue = b.repos_count || 0;
      break;
    case 'name':
    default:
      aValue = (a.name || '').toLowerCase();
      bValue = (b.name || '').toLowerCase();
      break;
    }

    if (order.toLowerCase() === 'desc') {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });

  logDebug(`Sorted ${teams.length} teams by ${sortBy} (${order})`);
  return sorted;
}
