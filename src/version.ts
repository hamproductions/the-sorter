// This file is auto-generated. Do not edit manually.
// Generated on: 2025-12-23T13:40:22.535Z

/**
 * Application version from package.json
 */
export const VERSION = '1.13.3';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-12-23T13:40:22.536Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
