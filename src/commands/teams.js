/**
 * Teams command module
 * Handles listing and managing GitHub teams
 */

import { getOctokitClient, fetchAllPages, getInstallationOrg, handleGitHubError } from '../utils/github.js';
import { filterTeams, sortTeams } from '../utils/filters.js';
import { displayTeam, displaySummary, displayProgress, displayError } from '../utils/display.js';
import { generateTeamCSV, saveCSVFileOrganized } from '../utils/fileUtils.js'; // eslint-disable-line no-unused-vars
import { logFetch, logExport, logDetection, logDebug } from '../utils/logger.js';

/**
 * Teams command handler
 * Lists teams in the specified organization
 * @param {string} org - Organization name (optional, will auto-detect if not provided)
 * @param {Object} options - Command options
 * @param {string} [options.visibility] - Filter by visibility (open, closed, secret)
 * @param {boolean} [options.detailed] - Show detailed information
 * @param {boolean} [options.fetch] - Save data to CSV file instead of displaying
 * @param {boolean} [options.skipMembers] - Skip fetching member and repository counts
 * @param {number} [options.minMembers] - Minimum number of members
 * @param {number} [options.maxMembers] - Maximum number of members
 * @param {string} [options.sort] - Sort by (name, members, repos)
 * @param {string} [options.order] - Sort order (asc, desc)
 */
export async function handleTeamsCommand(org, options = {}) {
  try {
    const octokit = await getOctokitClient();

    // Auto-detect organization if not provided
    if (!org) {
      logDetection('No organization specified, detecting from GitHub App installation...');
      org = await getInstallationOrg(octokit);

      if (!org) {
        displayError('organization detection', new Error('Could not auto-detect organization. Please specify: ghapp teams <org>'));
        return;
      }

      logDetection(`Detected organization: ${org}`);
    }

    logFetch(`Fetching all teams from ${org}...`);

    const allTeams = await fetchAllPages(
      (params) => octokit.rest.teams.list(params),
      { org, perPage: 100 }
    );

    let enrichedTeams = allTeams;

    // Enrich teams with comprehensive data if not skipping
    if (!options.skipMembers) {
      logFetch('Enriching teams with comprehensive hierarchy and member data...');
      enrichedTeams = await enrichTeamsWithFullData(octokit, org, allTeams);
    }

    // Apply filters
    const originalCount = enrichedTeams.length;
    const filteredTeams = filterTeams(enrichedTeams, options);

    // Apply sorting
    let finalTeams = filteredTeams;
    if (options.sort) {
      finalTeams = sortTeams(filteredTeams, options.sort, options.order || 'asc');
    }

    // Output results
    if (options.fetch) {
      const csvContent = await generateEnhancedTeamCSV(octokit, org, finalTeams);
      const filename = saveCSVFileOrganized(csvContent, `teams_${org}`, 'teams');

      if (filename) {
        logExport(`Exported ${finalTeams.length} teams from ${org} to ${filename}`);
      }
    } else {
      const totalCount = originalCount !== finalTeams.length ? originalCount : null;
      displaySummary('teams', finalTeams.length, `in ${org}`, totalCount);

      finalTeams.forEach((team) => displayTeam(team, options.detailed));
    }
  } catch (error) {
    if (error.status === 404) {
      displayError('fetching teams', new Error(`Organization '${org}' not found or not accessible`));
    } else {
      handleGitHubError(error, 'fetching teams');
    }
  }
}

/**
 * Enriches teams with comprehensive hierarchy, member, and repository data
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {Array} teams - Array of team objects
 * @returns {Promise<Array>} Teams with enriched data
 */
async function enrichTeamsWithFullData(octokit, org, teams) {
  const enrichedTeams = [];

  // Build team hierarchy map
  const teamHierarchy = await buildTeamHierarchy(octokit, org, teams);

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];

    displayProgress('Enriching team data', i + 1, teams.length);

    // Get detailed member information
    const memberDetails = await getTeamMemberDetails(octokit, org, team.slug);

    // Get repository permissions
    const repoPermissions = await getTeamRepoPermissions(octokit, org, team.slug);

    // Get hierarchy information
    const hierarchyInfo = teamHierarchy[team.slug] || {};

    enrichedTeams.push({
      ...team,
      members_count: memberDetails.length,
      repos_count: repoPermissions.length,
      member_details: memberDetails,
      repository_permissions: repoPermissions,
      parent_team: hierarchyInfo.parent,
      child_teams: hierarchyInfo.children || [],
      direct_members_only: await getDirectMembersOnly(octokit, org, team.slug, hierarchyInfo.children || [], hierarchyInfo.parent)
    });
  }

  return enrichedTeams;
}

/**
 * Builds team hierarchy mapping parent and child relationships
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {Array} teams - Array of team objects
 * @returns {Promise<Object>} Team hierarchy mapping
 */
async function buildTeamHierarchy(octokit, org, teams) {
  const hierarchy = {};

  for (const team of teams) {
    hierarchy[team.slug] = {
      parent: team.parent?.slug || null,
      children: []
    };
  }

  // Build children arrays
  for (const team of teams) {
    if (team.parent?.slug && hierarchy[team.parent.slug]) {
      hierarchy[team.parent.slug].children.push(team.slug);
    }
  }

  return hierarchy;
}

/**
 * Gets detailed member information including roles using direct membership check
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {string} teamSlug - Team slug
 * @returns {Promise<Array>} Array of member details with roles
 */
async function getTeamMemberDetails(octokit, org, teamSlug) {
  try {
    // Get all members that GitHub reports for this team
    const members = await fetchAllPages(
      (params) => octokit.rest.teams.listMembersInOrg(params),
      { org, team_slug: teamSlug, perPage: 100 }
    );

    const memberDetails = [];

    for (const member of members) {
      try {
        // Get membership details to determine role and if it's direct membership
        const { data: membership } = await octokit.rest.teams.getMembershipForUserInOrg({
          org,
          team_slug: teamSlug,
          username: member.login
        });

        memberDetails.push({
          username: member.login,
          role: membership.role, // 'member' or 'maintainer'
          state: membership.state, // 'active' or 'pending'
          isDirect: true // We'll determine this properly in getDirectMembersOnly
        });
      } catch (error) {
        // If we can't get membership details, add with basic info
        memberDetails.push({
          username: member.login,
          role: 'member', // default
          state: 'active', // default
          isDirect: true // default assumption
        });
      }
    }

    return memberDetails;
  } catch (error) {
    logDebug(`Cannot access members for team ${teamSlug}: ${error.message}`);
    return [];
  }
}

/**
 * Gets repository permissions for a team
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {string} teamSlug - Team slug
 * @returns {Promise<Array>} Array of repository permissions
 */
async function getTeamRepoPermissions(octokit, org, teamSlug) {
  try {
    const repos = await fetchAllPages(
      (params) => octokit.rest.teams.listReposInOrg(params),
      { org, team_slug: teamSlug, perPage: 100 }
    );

    return repos.map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      permissions: {
        admin: repo.permissions?.admin || false,
        maintain: repo.permissions?.maintain || false,
        push: repo.permissions?.push || false,
        triage: repo.permissions?.triage || false,
        pull: repo.permissions?.pull || false
      },
      role: getRepoRoleFromPermissions(repo.permissions || {})
    }));
  } catch (error) {
    logDebug(`Cannot access repositories for team ${teamSlug}: ${error.message}`);
    return [];
  }
}

/**
 * Gets members who are direct members of this team (not inherited from parent/child)
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {string} teamSlug - Team slug
 * @param {Array} childTeamSlugs - Array of child team slugs
 * @param {string|null} parentTeamSlug - Parent team slug
 * @returns {Promise<Array>} Array of direct members only
 */
async function getDirectMembersOnly(octokit, org, teamSlug, childTeamSlugs, parentTeamSlug = null) {
  try {
    // Get all members that GitHub reports for this team
    const allMembers = await getTeamMemberDetails(octokit, org, teamSlug);

    // If this team has no parent and no children, all members are direct
    if (!parentTeamSlug && childTeamSlugs.length === 0) {
      return allMembers;
    }

    // If this team has children but no parent, we need to exclude inherited members from children
    if (!parentTeamSlug && childTeamSlugs.length > 0) {
      // This is a parent team - exclude members who are actually in child teams
      const childMembers = new Set();
      for (const childSlug of childTeamSlugs) {
        const childMemberDetails = await getTeamMemberDetails(octokit, org, childSlug);
        childMemberDetails.forEach(member => childMembers.add(member.username));
      }

      const directMembers = allMembers.filter(member => !childMembers.has(member.username));
      logDebug(`Parent team ${teamSlug}: Total ${allMembers.length}, Direct ${directMembers.length}`);
      return directMembers;
    }

    // If this team has a parent, all its members are direct (child teams don't inherit up)
    if (parentTeamSlug) {
      logDebug(`Child team ${teamSlug}: All ${allMembers.length} members are direct`);
      return allMembers;
    }

    return allMembers;
  } catch (error) {
    logDebug(`Cannot determine direct members for team ${teamSlug}: ${error.message}`);
    return [];
  }
}

/**
 * Determines repository role from permissions object
 * @param {Object} permissions - Permissions object
 * @returns {string} Role name
 */
function getRepoRoleFromPermissions(permissions) {
  if (permissions.admin) return 'admin';
  if (permissions.maintain) return 'maintain';
  if (permissions.push) return 'write';
  if (permissions.triage) return 'triage';
  if (permissions.pull) return 'read';
  return 'none';
}

/**
 * Generates enhanced CSV content for teams with comprehensive data
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {Array} teams - Array of enriched team objects
 * @returns {Promise<string>} Enhanced CSV content
 */
async function generateEnhancedTeamCSV(octokit, org, teams) {
  const csvRows = [];

  // Add header
  csvRows.push([
    'Team Name',
    'Team Slug',
    'Privacy',
    'Description',
    'Parent Team',
    'Child Teams',
    'Member Username',
    'Member Role',
    'Member State',
    'Repository Name',
    'Repository Full Name',
    'Repository Role'
  ]);

  for (const team of teams) {
    const parentTeam = team.parent_team || '';
    const childTeams = (team.child_teams || []).join('; ');
    const directMembers = team.direct_members_only || [];
    const allMembers = team.member_details || []; // eslint-disable-line no-unused-vars
    const repos = team.repository_permissions || [];

    // If team has no direct members and no repos, add one row with team info only
    if (directMembers.length === 0 && repos.length === 0) {
      csvRows.push([
        team.name || '',
        team.slug || '',
        team.privacy || '',
        escapeCSVField(team.description || ''),
        parentTeam,
        childTeams,
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
      continue;
    }

    // Create combinations of DIRECT members and repositories (not all members)
    const maxRows = Math.max(directMembers.length, repos.length, 1);

    for (let i = 0; i < maxRows; i++) {
      const member = directMembers[i]; // Use direct members instead of all members
      const repo = repos[i];

      csvRows.push([
        team.name || '',
        team.slug || '',
        team.privacy || '',
        escapeCSVField(team.description || ''),
        parentTeam,
        childTeams,
        member?.username || '',
        member?.role || '',
        member?.state || '',
        repo?.name || '',
        repo?.full_name || '',
        repo?.role || ''
      ]);
    }
  }

  // Convert to CSV string
  return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Formats permissions object for CSV display
 * @param {Object} permissions - Permissions object
 * @returns {string} Formatted permissions string
 */
function formatPermissions(permissions) { // eslint-disable-line no-unused-vars
  const perms = [];
  if (permissions.admin) perms.push('admin');
  if (permissions.maintain) perms.push('maintain');
  if (permissions.push) perms.push('write');
  if (permissions.triage) perms.push('triage');
  if (permissions.pull) perms.push('read');
  return perms.join('; ');
}

/**
 * Escapes CSV field content by replacing quotes
 * @param {string} field - Field content to escape
 * @returns {string} Escaped field content
 */
function escapeCSVField(field) {
  return field.replace(/"/g, '""');
}

/**
 * Gets the number of members in a team
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {string} teamSlug - Team slug
 * @returns {Promise<number|null>} Number of members or null if no access
 */
async function getTeamMemberCount(octokit, org, teamSlug) { // eslint-disable-line no-unused-vars
  try {
    const members = await fetchAllPages(
      (params) => octokit.rest.teams.listMembersInOrg(params),
      { org, team_slug: teamSlug, perPage: 100 }
    );

    return members.length;
  } catch (error) {
    logDebug(`Cannot access members for team ${teamSlug}: ${error.message}`);
    return null; // Insufficient permissions
  }
}

/**
 * Gets the number of repositories accessible to a team
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} org - Organization name
 * @param {string} teamSlug - Team slug
 * @returns {Promise<number|null>} Number of repositories or null if no access
 */
async function getTeamRepoCount(octokit, org, teamSlug) { // eslint-disable-line no-unused-vars
  try {
    const repos = await fetchAllPages(
      (params) => octokit.rest.teams.listReposInOrg(params),
      { org, team_slug: teamSlug, perPage: 100 }
    );

    return repos.length;
  } catch (error) {
    logDebug(`Cannot access repositories for team ${teamSlug}: ${error.message}`);
    return null; // Insufficient permissions
  }
}

/**
 * Gets team statistics
 * @param {Array} teams - Array of team objects
 * @returns {Object} Team statistics
 */
export function getTeamStats(teams) {
  const stats = {
    total: teams.length,
    secret: 0,
    closed: 0,
    open: 0,
    totalMembers: 0,
    totalRepos: 0,
    withMembers: 0,
    withRepos: 0,
    averageMembers: 0,
    averageRepos: 0
  };

  let membersSum = 0;
  let reposSum = 0;
  let membersCount = 0;
  let reposCount = 0;

  teams.forEach(team => {
    // Count by privacy
    if (team.privacy) {
      stats[team.privacy]++;
    }

    // Sum members
    if (typeof team.members_count === 'number') {
      membersSum += team.members_count;
      membersCount++;
      if (team.members_count > 0) stats.withMembers++;
    }

    // Sum repositories
    if (typeof team.repos_count === 'number') {
      reposSum += team.repos_count;
      reposCount++;
      if (team.repos_count > 0) stats.withRepos++;
    }
  });

  stats.totalMembers = membersSum;
  stats.totalRepos = reposSum;
  stats.averageMembers = membersCount > 0 ? (membersSum / membersCount).toFixed(1) : 0;
  stats.averageRepos = reposCount > 0 ? (reposSum / reposCount).toFixed(1) : 0;

  return stats;
}

/**
 * Displays team statistics
 * @param {Array} teams - Array of team objects
 */
export function displayTeamStats(teams) {
  const stats = getTeamStats(teams);

  console.log('📊 Team Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Secret: ${stats.secret} | Closed: ${stats.closed} | Open: ${stats.open}`);
  console.log(`   Teams with members: ${stats.withMembers}`);
  console.log(`   Teams with repositories: ${stats.withRepos}`);
  console.log(`   Total members: ${stats.totalMembers}`);
  console.log(`   Total repositories: ${stats.totalRepos}`);
  console.log(`   Average members per team: ${stats.averageMembers}`);
  console.log(`   Average repositories per team: ${stats.averageRepos}`);
  console.log('');
}

/**
 * Validates team command options
 * @param {Object} options - Command options to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTeamOptions(options) {
  const errors = [];

  // Validate visibility option
  if (options.visibility) {
    const validVisibilities = ['open', 'closed', 'secret'];
    if (!validVisibilities.includes(options.visibility.toLowerCase())) {
      errors.push(`Invalid visibility: ${options.visibility}. Must be one of: ${validVisibilities.join(', ')}`);
    }
  }

  // Validate sort option
  if (options.sort) {
    const validSortOptions = ['name', 'members', 'repos'];
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

  // Validate member range
  if (typeof options.minMembers === 'number' && typeof options.maxMembers === 'number') {
    if (options.minMembers > options.maxMembers) {
      errors.push('minMembers cannot be greater than maxMembers');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
