// This file is auto-generated. Do not edit manually.
// Generated on: 2026-09-28T07:33:10.371Z

/**
 * Application version from package.json
 */
export const VERSION = '2.1.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-09-28T07:33:10.372Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
