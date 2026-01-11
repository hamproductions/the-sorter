// This file is auto-generated. Do not edit manually.
// Generated on: 2026-01-11T08:29:36.731Z

/**
 * Application version from package.json
 */
export const VERSION = '1.17.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-01-11T08:29:36.731Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
