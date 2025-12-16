// This file is auto-generated. Do not edit manually.
// Generated on: 2025-12-16T18:25:26.954Z

/**
 * Application version from package.json
 */
export const VERSION = '1.11.1';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-12-16T18:25:26.954Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
