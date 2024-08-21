import { useTranslation } from 'react-i18next';
import { Button } from '../ui/styled/button';
import { Wrap } from 'styled-system/jsx';
import type { Locale } from '~/i18n';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const handleSetLocale = (locale: Locale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <Wrap>
      <Button
        variant="link"
        data-active={currentLanguage === 'en' ? 'true' : undefined}
        onClick={() => handleSetLocale('en')}
        _active={{ fontWeight: 'bold' }}
      >
        English
      </Button>
      |
      <Button
        variant="link"
        onClick={() => handleSetLocale('ja')}
        data-active={currentLanguage === 'ja' ? 'true' : undefined}
        _active={{ fontWeight: 'bold' }}
      >
        日本語
      </Button>
    </Wrap>
  );
}
