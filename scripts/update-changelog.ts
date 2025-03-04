import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

/**
 * Script to update the CHANGELOG.md file with new entries
 * This makes it easier to maintain a consistent changelog format
 * Optimized for conventional commits
 */

// Conventional commit types mapping to Keep a Changelog categories
const COMMIT_TYPE_MAP: Record<string, string> = {
  // Features -> Added
  'feat': 'Added',
  'feature': 'Added',
  
  // Fixes -> Fixed
  'fix': 'Fixed',
  'bugfix': 'Fixed',
  
  // Changes -> Changed
  'refactor': 'Changed',
  'perf': 'Changed',
  'style': 'Changed',
  'chore': 'Changed',
  
  // Docs -> Changed (or could be Added depending on context)
  'docs': 'Changed',
  
  // Breaking changes -> Changed or Removed
  'BREAKING CHANGE': 'Changed',
  
  // Deprecation -> Deprecated
  'deprecate': 'Deprecated',
  
  // Removal -> Removed
  'remove': 'Removed',
  
  // Security -> Security
  'security': 'Security'
};

// Change types according to Keep a Changelog format
const CHANGE_TYPES = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

// Function to get the current version from package.json
function getCurrentVersion(): string {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

// Function to get the current date in YYYY-MM-DD format
function getCurrentDate(): string {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

// Function to read the current CHANGELOG.md file
function readChangelog(): string {
  const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    return fs.readFileSync(changelogPath, 'utf-8');
  }
  // Return a default template if the file doesn't exist
  return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`;
}

// Function to create a readline interface for user input
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Function to prompt the user for input
function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to get git commit messages since the last version tag
function getCommitMessagesSinceLastTag(): { hash: string; message: string }[] {
  try {
    // Get the last version tag
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    
    // Get commit messages since the last tag with hash
    const commitLog = execSync(
      `git log ${lastTag}..HEAD --pretty=format:"%h|%s"`, 
      { encoding: 'utf-8' }
    );
    
    return commitLog
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, ...messageParts] = line.split('|');
        return { 
          hash, 
          message: messageParts.join('|') 
        };
      });
  } catch (error) {
    console.log('No previous tags found or error getting commit messages.');
    return [];
  }
}

// Function to categorize conventional commits
function categorizeConventionalCommits(commits: { hash: string; message: string }[]): Record<string, { message: string; hash: string }[]> {
  const categorized: Record<string, { message: string; hash: string }[]> = {};
  
  // Initialize categories
  CHANGE_TYPES.forEach(type => {
    categorized[type] = [];
  });
  
  for (const { hash, message } of commits) {
    // Parse conventional commit format: type(scope): description
    const match = message.match(/^(\w+)(?:\(([^)]*)\))?:\s*(.+)$/);
    
    if (match) {
      const [, type, scope, description] = match;
      
      // Map commit type to changelog category
      const category = COMMIT_TYPE_MAP[type.toLowerCase()] || 'Changed';
      
      // Format the message
      let formattedMessage = description.trim();
      
      // Add scope if present
      if (scope) {
        formattedMessage = `**${scope}:** ${formattedMessage}`;
      }
      
      // Check for breaking changes
      if (message.includes('BREAKING CHANGE') || message.includes('!:')) {
        formattedMessage = `**BREAKING**: ${formattedMessage}`;
        categorized['Changed'].push({ message: formattedMessage, hash });
      } else {
        categorized[category].push({ message: formattedMessage, hash });
      }
    } else {
      // For non-conventional commits, just add to Changed
      categorized['Changed'].push({ message, hash });
    }
  }
  
  return categorized;
}

// Function to update the CHANGELOG.md file with new entries
async function updateChangelog() {
  const rl = createInterface();
  const version = getCurrentVersion();
  const date = getCurrentDate();
  const changelog = readChangelog();
  
  console.log(`\n📝 Updating CHANGELOG for version ${version} (${date})\n`);
  
  // Get commit messages since the last tag
  const commits = getCommitMessagesSinceLastTag();
  
  if (commits.length === 0) {
    console.log('No new commits found since the last tag.');
    const proceed = await prompt(rl, 'Do you want to continue with an empty changelog? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Changelog update cancelled.');
      rl.close();
      return;
    }
  }
  
  // Categorize commits based on conventional commit format
  const categorizedCommits = categorizeConventionalCommits(commits);
  
  // Display the categorized commits
  console.log('\nChanges detected from conventional commits:');
  let hasEntries = false;
  
  for (const type of CHANGE_TYPES) {
    if (categorizedCommits[type].length > 0) {
      console.log(`\n### ${type}:`);
      categorizedCommits[type].forEach(({ message, hash }) => {
        console.log(`  - ${message} (${hash})`);
      });
      hasEntries = true;
    }
  }
  
  if (!hasEntries) {
    console.log('No categorized changes found.');
  }
  
  // Ask if the user wants to use these entries or edit them
  const useAutomatic = await prompt(rl, '\nUse these automatically generated entries? (Y/n): ');
  
  let entries: Record<string, string[]> = {};
  CHANGE_TYPES.forEach(type => {
    entries[type] = [];
  });
  
  if (useAutomatic.toLowerCase() !== 'n') {
    // Use the auto-categorized entries
    for (const type of CHANGE_TYPES) {
      entries[type] = categorizedCommits[type].map(({ message }) => message);
    }
  } else {
    // Let the user edit the entries
    console.log('\nPlease review and edit the entries:');
    
    for (const type of CHANGE_TYPES) {
      if (categorizedCommits[type].length > 0) {
        console.log(`\n### ${type}:`);
        const entriesText = categorizedCommits[type]
          .map(({ message }) => `- ${message}`)
          .join('\n');
        
        console.log(entriesText);
        
        const editedEntries = await prompt(rl, 
          `\nEdit ${type} entries (leave empty to keep as is, or provide new entries with each line starting with '-'):\n`
        );
        
        if (editedEntries.trim()) {
          // Parse the edited entries
          entries[type] = editedEntries
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(1).trim());
        } else {
          // Keep the original entries
          entries[type] = categorizedCommits[type].map(({ message }) => message);
        }
      }
    }
  }
  
  // Build the new changelog entry
  let newEntry = `\n## [${version}] - ${date}\n`;
  
  // Add entries for each change type
  for (const type of CHANGE_TYPES) {
    if (entries[type].length > 0) {
      newEntry += `\n### ${type}\n`;
      for (const entry of entries[type]) {
        newEntry += `- ${entry}\n`;
      }
    }
  }
  
  // Insert the new entry after the header
  const headerEndIndex = changelog.indexOf('and this project adheres to [Semantic Versioning]');
  if (headerEndIndex !== -1) {
    const insertPosition = changelog.indexOf('\n', headerEndIndex) + 1;
    const updatedChangelog =
      changelog.slice(0, insertPosition) + newEntry + changelog.slice(insertPosition);
    
    // Write the updated changelog
    const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
    fs.writeFileSync(changelogPath, updatedChangelog);
    
    console.log(`\n✅ CHANGELOG.md updated successfully for version ${version}`);
  } else {
    console.error('❌ Could not find the proper position to insert the new entry in CHANGELOG.md');
    process.exit(1);
  }
  
  rl.close();
}

// Main function
async function main() {
  await updateChangelog();
}

// Run the main function
main().catch((error) => {
  console.error('Error updating changelog:', error);
  process.exit(1);
});
