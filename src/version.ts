// This file is auto-generated. Do not edit manually.
// Generated on: 2026-01-26T04:53:22.519Z

/**
 * Application version from package.json
 */
export const VERSION = '1.18.1';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-01-26T04:53:22.519Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
