/**
 * File utility module
 * Handles file operations including CSV generation and reading
 */

import fs from 'fs';
import path from 'path';
import { logFile, logError, logSuccess } from './logger.js';

/**
 * Generates CSV content from repository collaborator data
 * @param {Array} repos - Array of repository objects with collaborators
 * @returns {string} CSV formatted string
 */
export function generateCollaboratorCSV(repos) {
  const headers = [
    'Source_Organization',
    'Source_Repository',
    'Username',
    'Role'
  ];

  const rows = [];

  repos.forEach(repo => {
    if (repo.collaborators && repo.collaborators.length > 0) {
      repo.collaborators.forEach(collab => {
        const role = collab.originalRole || collab.role || '';

        rows.push([
          repo.owner?.login || '', // Source Organization
          repo.name || '', // Source Repository
          collab.username || '', // Username
          role // Role (was Original_Permission)
        ]);
      });
    }
    // Remove the "No collaborators found" rows - don't add anything if no collaborators
  });

  return formatCSVContent(headers, rows);
}

/**
 * Generates CSV content from repository data
 * @param {Array} repos - Array of repository objects
 * @returns {string} CSV formatted string
 */
export function generateRepositoryCSV(repos) {
  const headers = [
    'Org_Name',
    'Repo_Name',
    'Is_Empty',
    'Last_Push',
    'Last_Update',
    'isFork',
    'isArchive',
    'Visibility',
    'Repo_Size(mb)',
    'Default_Branch',
    'Issue_Count',
    'Open_Issues',
    'Closed_Issues',
    'PR_Count',
    'Open_PRs',
    'Closed_PRs',
    'PR_Review_Comment_Count',
    'Commit_Comment_Count',
    'Issue_Comment_Count',
    'Release_Count',
    'Project_Count',
    'Branch_Count',
    'Tag_Count',
    'Has_Wiki',
    'Full_URL',
    'Created'
  ];

  const rows = repos.map(repo => {
    const row = [
      repo.owner?.login || '',
      repo.name || '',
      repo.isEmpty ? 'true' : 'false',
      repo.pushed_at || '',
      repo.updated_at || '',
      repo.fork ? 'true' : 'false',
      repo.archived ? 'true' : 'false',
      repo.visibility || (repo.private ? 'private' : 'public'),
      Math.round((repo.size || 0) / 1024), // Convert KB to MB
      repo.default_branch || '',
      repo.issueCount || 0,
      repo.openIssues || 0,
      repo.closedIssues || 0,
      repo.prCount || 0,
      repo.openPRs || 0,
      repo.closedPRs || 0,
      repo.prReviewCommentCount || 0,
      repo.commitCommentCount || 0,
      repo.issueCommentCount || 0,
      repo.releaseCount || 0,
      repo.projectCount || 0,
      repo.branchCount || 0,
      repo.tagCount || 0,
      repo.has_wiki ? 'true' : 'false',
      repo.html_url || '',
      repo.created_at || ''
    ];

    return row;
  });

  return formatCSVContent(headers, rows);
}

/**
 * Generates CSV content from team data
 * @param {Array} teams - Array of team objects
 * @returns {string} CSV formatted string
 */
export function generateTeamCSV(teams) {
  const headers = [
    'Name',
    'Slug',
    'Privacy',
    'Description',
    'Members Count',
    'Repositories Count',
    'HTML URL'
  ];

  const rows = teams.map(team => [
    team.name || '',
    team.slug || '',
    team.privacy || '',
    escapeCSVField(team.description || ''),
    team.members_count || 0,
    team.repos_count || 0,
    team.html_url || ''
  ]);

  return formatCSVContent(headers, rows);
}

/**
 * Formats headers and rows into CSV content
 * @param {Array} headers - Column headers
 * @param {Array} rows - Data rows
 * @returns {string} CSV formatted string
 */
function formatCSVContent(headers, rows) {
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
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
 * Saves CSV content to a file with timestamp
 * @param {string} content - CSV content to save
 * @param {string} filename - Base filename (without extension)
 * @param {string} outputDir - Output directory (default: current directory)
 * @returns {string|null} Full filename if successful, null if failed
 */
export function saveCSVFile(content, filename, outputDir = './') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = path.join(outputDir, `${filename}_${timestamp}.csv`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(fullFilename, content, 'utf8');
    logFile(`Data saved to: ${fullFilename}`);
    return fullFilename;
  } catch (error) {
    logError(`Error saving CSV file: ${error.message}`, error);
    return null;
  }
}

/**
 * Reads repository names from a CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Array<string>} Array of repository names
 */
export function readRepositoryCSV(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      logError(`CSV file not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line);

    if (lines.length === 0) {
      logError('CSV file is empty');
      return [];
    }

    // Check if first line is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') ||
                     firstLine.includes('repository') ||
                     firstLine.includes('repo');

    const repoNames = hasHeader ? lines.slice(1) : lines;

    // Clean up repository names (remove quotes, commas, etc.)
    const cleanNames = repoNames.map(name => {
      // Handle CSV format - take first column if comma-separated
      const cleanName = name.split(',')[0].replace(/['"]/g, '').trim();
      return cleanName;
    }).filter(name => name);

    logSuccess(`Found ${cleanNames.length} repository names in CSV file`);
    return cleanNames;
  } catch (error) {
    logError(`Error reading CSV file: ${error.message}`, error);
    return [];
  }
}

/**
 * Validates if a file path is accessible
 * @param {string} filePath - Path to validate
 * @returns {boolean} True if file is accessible
 */
export function validateFilePath(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a backup of a file
 * @param {string} filePath - Path to the file to backup
 * @returns {string|null} Backup file path if successful, null if failed
 */
export function createFileBackup(filePath) {
  try {
    if (!validateFilePath(filePath)) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;

    fs.copyFileSync(filePath, backupPath);
    logSuccess(`Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    logError(`Error creating backup: ${error.message}`, error);
    return null;
  }
}
