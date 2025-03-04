// This file is auto-generated. Do not edit manually.
// Generated on: 2025-03-04T08:28:22.199Z

/**
 * Application version from package.json
 */
export const VERSION = '1.1.4';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-03-04T08:28:22.199Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
