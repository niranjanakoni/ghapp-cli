/**
 * Display utility module
 * Handles formatting and displaying data to the console
 */

import { logCustom } from './logger.js';

/**
 * Gets repository visibility display string
 * @param {Object} repo - Repository object
 * @returns {string} Formatted visibility string
 */
export function getRepoVisibility(repo) {
  if (repo.visibility === 'internal') {
    return '| Internal';
  }
  return repo.private ? '| Private' : '| Public';
}

/**
 * Gets team privacy display string
 * @param {string} privacy - Team privacy setting
 * @returns {string} Formatted privacy string
 */
export function getTeamVisibility(privacy) {
  switch (privacy) {
  case 'secret':
    return '| Secret';
  case 'closed':
    return '| Closed';
  case 'open':
    return '| Open';
  default:
    return '| Unknown';
  }
}

/**
 * Gets user permission display string
 * @param {Object} permission - Permission object
 * @returns {string} Formatted permission string
 */
export function getPermissionDisplay(permission) {
  if (!permission) return 'Unknown';

  switch (permission.permission) {
  case 'admin':
    return '🔴 Admin';
  case 'maintain':
    return '🟠 Maintain';
  case 'write':
    return '🟡 Write';
  case 'triage':
    return '🔵 Triage';
  case 'read':
    return '🟢 Read';
  case 'none':
    return '⚪ None';
  case 'unknown':
    return '❓ Unknown';
  default:
    return permission.permission;
  }
}

/**
 * Displays repository information
 * @param {Object} repo - Repository object
 * @param {boolean} detailed - Whether to show detailed information
 */
export function displayRepository(repo, detailed = false) {
  const visibility = getRepoVisibility(repo);
  const language = repo.language ? ` (${repo.language})` : '';
  const permission = repo.user_permission ? ` | Permission: ${getPermissionDisplay(repo.user_permission)}` : '';

  if (detailed) {
    console.log(`- ${repo.full_name} ${visibility}${language}${permission}`);

    if (repo.description) {
      console.log(`  Description: ${repo.description}`);
    }

    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const size = repo.size || 0;
    console.log(`  Stars: ${stars} | Forks: ${forks} | Size: ${size} KB`);

    if (repo.user_permission && repo.user_permission.role_name) {
      console.log(`  Role: ${repo.user_permission.role_name}`);
    }

    if (repo.updated_at) {
      const updatedDate = new Date(repo.updated_at).toLocaleDateString();
      console.log(`  Updated: ${updatedDate}`);
    }

    if (repo.html_url) {
      console.log(`  URL: ${repo.html_url}`);
    }

    console.log('');
  } else {
    console.log(`- ${repo.full_name} ${visibility}${language}${permission}`);
  }
}

/**
 * Displays team information
 * @param {Object} team - Team object
 * @param {boolean} detailed - Whether to show detailed information
 */
export function displayTeam(team, detailed = false) {
  const visibility = getTeamVisibility(team.privacy);

  let members;
  if (team.members_count === undefined) {
    members = 'N/A';
  } else if (team.members_count === null) {
    members = 'No access';
  } else {
    members = team.members_count;
  }

  let repos;
  if (team.repos_count === undefined) {
    repos = 'N/A';
  } else if (team.repos_count === null) {
    repos = 'No access';
  } else {
    repos = team.repos_count;
  }

  if (detailed) {
    console.log(`- ${team.name} ${visibility} (${members} members)`);

    if (team.description) {
      console.log(`  Description: ${team.description}`);
    }

    console.log(`  Repositories: ${repos}`);

    if (team.html_url) {
      console.log(`  URL: ${team.html_url}`);
    }

    console.log('');
  } else {
    console.log(`- ${team.name} ${visibility} (${members} members)`);
  }
}

/**
 * Displays a summary header for data listings
 * @param {string} type - Type of data (repositories, teams, etc.)
 * @param {number} count - Number of items
 * @param {string} [source] - Source description
 * @param {number} [totalCount] - Total count before filtering
 */
export function displaySummary(type, count, source = '', totalCount = null) {
  const emoji = type === 'repositories'
    ? '📦'
    : type === 'teams'
      ? '👥'
      : type === 'token' ? '🔐' : '📊';

  let message = `Found ${count} ${type}`;

  if (source) {
    message += ` ${source}`;
  }

  if (totalCount !== null && totalCount !== count) {
    message += ` (${totalCount} total)`;
  }

  message += ':';

  logCustom(emoji, message);
}

/**
 * Displays token information
 * @param {string} token - GitHub App token (will be truncated)
 * @param {string} expiresAt - Token expiration timestamp
 */
export function displayTokenInfo(token, expiresAt) {
  if (!token || !expiresAt) {
    logCustom('❌', 'No token or expiry found in .env');
    return;
  }

  const expiresUTC = new Date(expiresAt);
  const expiresIST = new Date(expiresUTC.getTime() + 5.5 * 60 * 60 * 1000);
  const now = new Date();
  const isValid = (expiresUTC.getTime() - now.getTime()) > 300000;

  console.log('🔐 Token (truncated):', token.slice(0, 30) + '...');
  console.log('⏳ Expires At (UTC):', expiresUTC.toISOString());
  console.log('🕒 Expires At (IST):', expiresIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log(isValid ? '✅ Token is still valid.' : '⚠️  Token is expiring soon or expired.');
}

/**
 * Displays help information for a command
 * @param {string} command - Command name
 * @param {Object} helpData - Help data object
 */
export function displayHelp(command, helpData) {
  console.log(`📚 ${helpData.title}:`);
  console.log('');

  if (helpData.description) {
    console.log(helpData.description);
    console.log('');
  }

  if (helpData.options && helpData.options.length > 0) {
    console.log('Options:');
    helpData.options.forEach(option => {
      console.log(`  ${option.flags.padEnd(25)} ${option.description}`);
    });
    console.log('');
  }

  if (helpData.examples && helpData.examples.length > 0) {
    console.log('Examples:');
    helpData.examples.forEach(example => {
      console.log(`  ${example.command.padEnd(40)} # ${example.description}`);
    });
    console.log('');
  }

  if (helpData.notes && helpData.notes.length > 0) {
    console.log('Notes:');
    helpData.notes.forEach(note => {
      console.log(`  ${note}`);
    });
    console.log('');
  }
}

/**
 * Displays a progress indicator
 * @param {string} message - Progress message
 * @param {number} current - Current item number
 * @param {number} total - Total number of items
 */
export function displayProgress(message, current, total) {
  const percentage = Math.round((current / total) * 100);
  logCustom('⏳', `${message} (${current}/${total} - ${percentage}%)`);
}

/**
 * Displays an error with context
 * @param {string} operation - The operation that failed
 * @param {Error} error - The error object
 */
export function displayError(operation, error) {
  logCustom('❌', `Error ${operation}:`);
  console.error(`   ${error.message}`);

  if (error.status) {
    console.error(`   HTTP Status: ${error.status}`);
  }
}

/**
 * Displays a success message
 * @param {string} message - The success message to display
 */
export function displaySuccess(message) {
  logCustom('✅', message);
}

/**
 * Displays an informational message
 * @param {string} message - The informational message to display
 */
export function displayInfo(message) {
  logCustom('ℹ️', message);
}
