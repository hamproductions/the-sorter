// This file is auto-generated. Do not edit manually.
// Generated on: 2026-02-27T17:34:46.696Z

/**
 * Application version from package.json
 */
export const VERSION = '1.19.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-02-27T17:34:46.696Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
