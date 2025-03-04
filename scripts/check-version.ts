import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script to check if version has been updated before commit
 * and ensure commit messages follow conventional commit format
 * This is used as a pre-commit hook
 */

// Conventional commit regex pattern
const CONVENTIONAL_COMMIT_PATTERN =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z-]+\))?!?: .+/i;

// Function to get the current version from package.json
function getCurrentVersion(): string {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

// Function to get the last committed version from git
function getLastCommittedVersion(): string {
  try {
    // Get the last committed package.json content
    const lastCommittedContent = execSync('git show HEAD:package.json', { encoding: 'utf-8' });

    // Parse the content to get the version
    const packageJson = JSON.parse(lastCommittedContent);
    return packageJson.version;
  } catch (error) {
    // If this is the first commit or package.json doesn't exist in the last commit
    console.log('No previous version found. This might be the first commit.');
    return '0.0.0';
  }
}

// Function to check if any non-version files are changed
function hasNonVersionFilesChanged(): boolean {
  try {
    // Get list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    // Version-related files that are expected to change together
    const versionFiles = ['package.json', 'src/version.ts', 'bun.lockb', 'CHANGELOG.md'];

    // Check if any non-version files are staged
    return stagedFiles.some((file) => !versionFiles.includes(file));
  } catch (error) {
    console.error('Error checking staged files:', error);
    return false;
  }
}

// Function to check if version files are in sync
function areVersionFilesInSync(): boolean {
  try {
    // Check if version.ts is staged
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    // If package.json is staged but version.ts is not, they might be out of sync
    if (stagedFiles.includes('package.json') && !stagedFiles.includes('src/version.ts')) {
      console.error('❌ package.json is staged but src/version.ts is not.');
      console.error('Run "bun update-version" to update the version file.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking version files sync:', error);
    return false;
  }
}

// Function to check if commit message follows conventional commit format
function checkCommitMessage(): boolean {
  try {
    // Get the commit message from the commit message file
    const commitMsgFile = process.env.GIT_PARAMS || '.git/COMMIT_EDITMSG';
    const commitMsg = fs.readFileSync(commitMsgFile, 'utf-8').trim();

    // Skip check for merge commits
    if (commitMsg.startsWith('Merge ')) {
      return true;
    }

    // Check if the commit message follows the conventional commit format
    if (!CONVENTIONAL_COMMIT_PATTERN.test(commitMsg)) {
      console.error('❌ Commit message does not follow conventional commit format!');
      console.error('Expected format: <type>[optional scope]: <description>');
      console.error('Example: feat(ui): add new button component');
      console.error(
        '\nTypes: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test'
      );
      console.error('\nActual commit message:');
      console.error(commitMsg);
      return false;
    }

    return true;
  } catch (error) {
    // If we can't read the commit message file, skip this check
    console.log('Could not check commit message format:', error);
    return true;
  }
}

// Main function
function main() {
  let exitCode = 0;

  // Check if any non-version files are changed
  if (hasNonVersionFilesChanged()) {
    // Get current and last committed versions
    const currentVersion = getCurrentVersion();
    const lastVersion = getLastCommittedVersion();

    // Compare versions
    if (currentVersion === lastVersion) {
      console.error('❌ Version has not been updated!');
      console.error(`Current version: ${currentVersion}`);
      console.error(`Last committed version: ${lastVersion}`);
      console.error('\nPlease update the version before committing:');
      console.error('  bun version:patch  - for bug fixes');
      console.error('  bun version:minor  - for new features');
      console.error('  bun version:major  - for breaking changes');
      exitCode = 1;
    } else {
      console.log(`✅ Version updated from ${lastVersion} to ${currentVersion}`);
    }
  } else {
    console.log('✅ Only version files changed, skipping version check');
  }

  // Check if version files are in sync
  if (!areVersionFilesInSync()) {
    exitCode = 1;
  }

  // Check if commit message follows conventional commit format
  if (!checkCommitMessage()) {
    exitCode = 1;
  }

  if (exitCode === 0) {
    console.log('✅ All checks passed');
  } else {
    process.exit(exitCode);
  }
}

// Run the main function
main();
