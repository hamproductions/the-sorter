// This file is auto-generated. Do not edit manually.
// Generated on: 2026-09-28T07:39:56.073Z

/**
 * Application version from package.json
 */
export const VERSION = '2.2.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-09-28T07:39:56.074Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
