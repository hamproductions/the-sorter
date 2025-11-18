// This file is auto-generated. Do not edit manually.
// Generated on: 2025-11-18T06:22:14.287Z

/**
 * Application version from package.json
 */
export const VERSION = '1.8.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-11-18T06:22:14.287Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
