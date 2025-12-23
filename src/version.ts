// This file is auto-generated. Do not edit manually.
// Generated on: 2025-12-23T13:26:20.773Z

/**
 * Application version from package.json
 */
export const VERSION = '1.13.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-12-23T13:26:20.773Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
