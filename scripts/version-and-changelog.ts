import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script to update version and changelog in one command
 * This makes it easier to maintain version and changelog together
 * Optimized for conventional commits
 */

// Function to get the current version from package.json
function getCurrentVersion(): string {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

// Function to update the version using bun version command
function updateVersion(versionType: 'patch' | 'minor' | 'major'): string {
  try {
    // Run the bun version command
    execSync(`bun version:${versionType}`, { stdio: 'inherit' });
    
    // Get the new version after update
    return getCurrentVersion();
  } catch (error) {
    console.error(`❌ Error updating version: ${error}`);
    process.exit(1);
  }
}

// Function to update the version.ts file
function updateVersionFile() {
  try {
    // Run the update-version script
    execSync('bun run scripts/update-version.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Error updating version.ts file: ${error}`);
    process.exit(1);
  }
}

// Function to update the changelog
function updateChangelog() {
  try {
    // Run the update-changelog script
    execSync('bun run scripts/update-changelog.ts', { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Error updating changelog: ${error}`);
    process.exit(1);
  }
}

// Function to determine version type from commit messages
function determineVersionTypeFromCommits(): 'patch' | 'minor' | 'major' | null {
  try {
    // Get the last version tag
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    
    // Get commit messages since the last tag
    const commitMessages = execSync(`git log ${lastTag}..HEAD --pretty=format:"%s"`, { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);
    
    if (commitMessages.length === 0) {
      return null;
    }
    
    // Check for breaking changes (major)
    const hasBreakingChanges = commitMessages.some(msg => 
      msg.includes('BREAKING CHANGE') || 
      msg.includes('!:') || 
      msg.match(/^[a-z]+\([^)]*\)!:/)
    );
    
    if (hasBreakingChanges) {
      return 'major';
    }
    
    // Check for features (minor)
    const hasFeatures = commitMessages.some(msg => 
      msg.startsWith('feat') || 
      msg.startsWith('feature')
    );
    
    if (hasFeatures) {
      return 'minor';
    }
    
    // Default to patch for fixes and other changes
    return 'patch';
  } catch (error) {
    console.log('Error determining version type from commits:', error);
    return null;
  }
}

// Function to prompt the user for input
function prompt(question: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(question, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  // Get the version type from command line arguments
  const args = process.argv.slice(2);
  let versionType = args[0]?.toLowerCase();
  
  // If no version type is provided, try to determine it from commits
  if (!versionType) {
    console.log('No version type specified, analyzing commits...');
    const suggestedType = determineVersionTypeFromCommits();
    
    if (suggestedType) {
      console.log(`Based on commit messages, suggesting a "${suggestedType}" version update.`);
      
      // Use the suggested type if available
      versionType = suggestedType;
    } else {
      console.log('Could not determine version type from commits, defaulting to "patch".');
      versionType = 'patch';
    }
  }
  
  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error('❌ Please specify a valid version type: patch, minor, or major');
    console.error('Example: bun run scripts/version-and-changelog.ts patch');
    process.exit(1);
  }
  
  // Get the current version before update
  const oldVersion = getCurrentVersion();
  
  // Update the version
  console.log(`\n🔄 Updating version (${versionType})...`);
  const newVersion = updateVersion(versionType as 'patch' | 'minor' | 'major');
  console.log(`✅ Version updated from ${oldVersion} to ${newVersion}`);
  
  // Update the version.ts file
  console.log('\n🔄 Updating version.ts file...');
  updateVersionFile();
  
  // Update the changelog
  console.log('\n🔄 Updating changelog...');
  updateChangelog();
  
  // Ask if user wants to automatically commit and tag
  const answer = await prompt('\nDo you want to automatically commit and tag this release? (Y/n): ');
  
  if (answer.toLowerCase() !== 'n') {
    try {
      // Stage changes
      console.log('\n🔄 Staging changes...');
      execSync('git add package.json src/version.ts CHANGELOG.md', { stdio: 'inherit' });
      
      // Commit changes
      console.log('\n🔄 Committing changes...');
      execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' });
      
      // Create tag
      console.log('\n🔄 Creating tag...');
      execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { stdio: 'inherit' });
      
      console.log(`\n✅ All updates completed for version ${newVersion}`);
      console.log(`✅ Created tag v${newVersion}`);
      console.log('\nRemember to push the changes and tag:');
      console.log('  git push');
      console.log('  git push --tags');
    } catch (error) {
      console.error(`\n❌ Error during git operations: ${error}`);
      console.log('\nYou can manually commit and tag with:');
      console.log('  git add package.json src/version.ts CHANGELOG.md');
      console.log(`  git commit -m "chore: release v${newVersion}"`);
      console.log(`  git tag -a v${newVersion} -m "Version ${newVersion}"`);
    }
  } else {
    console.log(`\n✅ All updates completed for version ${newVersion}`);
    console.log('\nRemember to commit these changes:');
    console.log('  git add package.json src/version.ts CHANGELOG.md');
    console.log(`  git commit -m "chore: release v${newVersion}"`);
    console.log(`  git tag -a v${newVersion} -m "Version ${newVersion}"`);
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
