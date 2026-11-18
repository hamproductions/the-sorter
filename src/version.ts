// This file is auto-generated. Do not edit manually.
// Generated on: 2026-11-18T07:15:17.623Z

/**
 * Application version from package.json
 */
export const VERSION = '2.5.0';

/**
 * Build timestamp
 */
export const BUILD_TIMESTAMP = '2026-11-18T07:15:17.624Z';

/**
 * Returns the application version with build information
 */
export const getVersionString = (): string => {
  return `v${VERSION} (Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()})`;
};
