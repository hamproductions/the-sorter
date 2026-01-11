// This file is auto-generated. Do not edit manually.
// Generated on: 2026-01-11T08:35:46.274Z

/**
 * Application version from package.json
 */
export const VERSION = '1.17.1';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-01-11T08:35:46.274Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
