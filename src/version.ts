// This file is auto-generated. Do not edit manually.
// Generated on: 2026-11-20T09:49:56.909Z

/**
 * Application version from package.json
 */
export const VERSION = '2.7.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-11-20T09:49:56.909Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
