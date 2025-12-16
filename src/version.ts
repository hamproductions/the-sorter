// This file is auto-generated. Do not edit manually.
// Generated on: 2025-12-16T04:35:29.130Z

/**
 * Application version from package.json
 */
export const VERSION = '1.10.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-12-16T04:35:29.131Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
