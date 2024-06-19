import { FaMoon, FaSun } from 'react-icons/fa6';
import { IconButton } from '../ui/icon-button';
import { useColorModeContext } from '~/context/ColorModeContext';

export function ColorModeToggle() {
  const { colorMode, setColorMode } = useColorModeContext();
  return (
    <IconButton
      variant="subtle"
      onClick={() => setColorMode?.(colorMode === 'dark' ? 'light' : 'dark')}
    >
      {colorMode === 'dark' ? <FaMoon /> : <FaSun />}
    </IconButton>
  );
}
