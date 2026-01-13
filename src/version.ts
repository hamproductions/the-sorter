// This file is auto-generated. Do not edit manually.
// Generated on: 2026-01-13T08:28:21.443Z

/**
 * Application version from package.json
 */
export const VERSION = '1.17.2';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-01-13T08:28:21.443Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
