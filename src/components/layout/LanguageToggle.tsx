import { useTranslation } from 'react-i18next';
import { Link } from '../ui/link';
import type { Locale } from '~/i18n';
import { Wrap } from 'styled-system/jsx';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const handleSetLocale = (locale: Locale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <Wrap>
      <Link
        data-active={currentLanguage === 'en' ? 'true' : undefined}
        onClick={() => handleSetLocale('en')}
        _active={{ fontWeight: 'bold' }}
      >
        English
      </Link>
      |
      <Link
        onClick={() => handleSetLocale('ja')}
        data-active={currentLanguage === 'ja' ? 'true' : undefined}
        _active={{ fontWeight: 'bold' }}
      >
        日本語
      </Link>
    </Wrap>
  );
}
