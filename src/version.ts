// This file is auto-generated. Do not edit manually.
// Generated on: 2025-05-02T05:45:06.345Z

/**
 * Application version from package.json
 */
export const VERSION = '1.5.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2025-05-02T05:45:06.345Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
