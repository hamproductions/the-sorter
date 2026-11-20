import type { ReactNode } from 'react';
import { createContext, useContext, useEffect } from 'react';
import { LocalStorage, useLocalStorage } from '~/hooks/useLocalStorage';

type ColorModes = 'dark' | 'light';
const ColorModeContext = createContext<{
  colorMode?: ColorModes | null;
  setColorMode?: (mode: ColorModes) => void;
}>({});

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useLocalStorage<ColorModes>('color-mode', undefined);

  useEffect(() => {
    if (colorMode == null) {
      const saved = new LocalStorage<ColorModes>('color-mode').value;
      setColorMode(
        saved === 'dark' || saved === 'light'
          ? saved
          : window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
      );
      return;
    }
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [colorMode, setColorMode]);

  return (
    <>
      <script
        lang="js"
        dangerouslySetInnerHTML={{
          __html: `
            (() => {
              let savedSettings;
              try { savedSettings = localStorage.getItem('color-mode'); } catch {}
              const dark = savedSettings === '"dark"' ||
                (savedSettings == null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
              document.documentElement.classList.add(dark ? 'dark' : 'light');
            })();
          `
        }}
      />
      <ColorModeContext.Provider value={{ colorMode, setColorMode }}>
        {children}
      </ColorModeContext.Provider>
    </>
  );
}

export const useColorModeContext = () => useContext(ColorModeContext);
