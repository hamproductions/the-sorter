import fs from 'fs';
import path from 'path';

// Read package.json to get the current version
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

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
