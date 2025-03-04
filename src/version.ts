// This file is auto-generated. Do not edit manually.
// Generated on: 2025-03-04T07:57:36.838Z

/**
 * Application version from package.json
 */
export const VERSION = '1.1.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-03-04T07:57:36.838Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
