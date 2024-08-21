import { FaMoon, FaSun } from 'react-icons/fa6';
import { IconButton } from '../ui/styled/icon-button';
import { useColorModeContext } from '~/context/ColorModeContext';

export function ColorModeToggle() {
  const { colorMode, setColorMode } = useColorModeContext();
  return (
    <IconButton
      variant="subtle"
      aria-label="Toggle Color Mode"
      onClick={() => setColorMode?.(colorMode === 'dark' ? 'light' : 'dark')}
    >
      {colorMode === 'dark' ? <FaMoon /> : <FaSun />}
    </IconButton>
  );
}
