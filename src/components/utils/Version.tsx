import { BUILD_TIMESTAMP, getVersionString, VERSION } from '../../version';

interface VersionProps {
  /**
   * Display format for the version
   * - 'full': Shows version with build timestamp (v1.0.0 (Built: 3/4/2025, 4:22:19 PM))
   * - 'version': Shows only the version number (v1.0.0)
   * - 'timestamp': Shows only the build timestamp (Built: 3/4/2025, 4:22:19 PM)
   */
  format?: 'full' | 'version' | 'timestamp';

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Component to display application version information
 */
export function Version({ format = 'full', className = '' }: VersionProps) {
  let content = '';

  switch (format) {
    case 'version':
      content = `v${VERSION}`;
      break;
    case 'timestamp':
      content = `Built: ${new Date(BUILD_TIMESTAMP).toLocaleString()}`;
      break;
    case 'full':
    default:
      content = getVersionString();
      break;
  }

  return (
    <span className={className} title={getVersionString()}>
      {content}
    </span>
  );
}

export default Version;
