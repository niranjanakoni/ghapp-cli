/**
 * File utility module
 * Handles file operations including CSV generation and reading
 */

import fs from "fs";
import path from "path";
import { logFile, logError, logSuccess } from "./logger.js";

/**
 * Generates CSV content from repository data
 * @param {Array} repos - Array of repository objects
 * @returns {string} CSV formatted string
 */
export function generateRepositoryCSV(repos) {
  const headers = [
    'Name',
    'Full Name',
    'Visibility',
    'Language',
    'Description',
    'Stars',
    'Forks',
    'Size (KB)',
    'Last Updated',
    'Clone URL',
    'HTML URL'
  ];
  
  const rows = repos.map(repo => [
    repo.name || '',
    repo.full_name || '',
    repo.visibility || (repo.private ? 'private' : 'public'),
    repo.language || '',
    escapeCSVField(repo.description || ''),
    repo.stargazers_count || 0,
    repo.forks_count || 0,
    repo.size || 0,
    repo.updated_at || '',
    repo.clone_url || '',
    repo.html_url || ''
  ]);
  
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
