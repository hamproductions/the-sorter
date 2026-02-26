// This file is auto-generated. Do not edit manually.
// Generated on: 2026-02-26T07:10:07.964Z

/**
 * Application version from package.json
 */
export const VERSION = '1.18.2';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-02-26T07:10:07.965Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
