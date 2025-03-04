import fs from 'fs';
import path from 'path';

/**
 * Script to update version.ts file with the version from release-it
 * This is called by release-it after bumping the version
 */

// Get the version from command line arguments
const version = process.argv[2];

if (!version) {
  console.error('❌ No version provided');
  process.exit(1);
}

// Create the version.ts file content
const versionFileContent = `// This file is auto-generated. Do not edit manually.
// Generated on: ${new Date().toISOString()}

/**
 * Application version from package.json
 */
export const VERSION = '${version}';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '${new Date().toISOString()}';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return \`v\${VERSION} (Built: \${new Date(BUILD_TIMESTAMP).toLocaleString()})\`;
};
`;

// Write the version.ts file
const versionFilePath = path.resolve(process.cwd(), 'src', 'version.ts');
fs.writeFileSync(versionFilePath, versionFileContent);

console.log(`✅ Updated version.ts with version ${version}`);
