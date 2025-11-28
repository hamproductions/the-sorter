import fs from 'fs';

/**
 * Script to ensure commit messages follow conventional commit format
 * This is used as a pre-commit hook
 *
 * Note: Version checking is now handled by release-it
 */

// Conventional commit regex pattern
const CONVENTIONAL_COMMIT_PATTERN =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z-]+\))?!?: .+/i;

// Function to check if commit message follows conventional commit format
function checkCommitMessage(): boolean {
  try {
    // Get the commit message file from command line argument (passed by commit-msg hook)
    // Falls back to COMMIT_EDITMSG for manual testing
    const commitMsgFile = process.argv[2] || '.git/COMMIT_EDITMSG';
    const commitMsg = fs.readFileSync(commitMsgFile, 'utf-8').trim();

    // Skip check for merge commits
    if (commitMsg.startsWith('Merge ')) {
      return true;
    }

    // Skip check for release commits created by release-it
    if (commitMsg.startsWith('chore: release v')) {
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
