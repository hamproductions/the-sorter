// This file is auto-generated. Do not edit manually.
// Generated on: 2026-09-25T13:49:12.337Z

/**
 * Application version from package.json
 */
export const VERSION = '2.0.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-09-25T13:49:12.338Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
