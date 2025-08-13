// This file is auto-generated. Do not edit manually.
// Generated on: 2025-08-13T01:50:07.718Z

/**
 * Application version from package.json
 */
export const VERSION = '1.7.1';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-08-13T01:50:07.719Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
