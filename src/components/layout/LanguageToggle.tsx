import { useTranslation } from 'react-i18next';
import { Link } from '../ui/link';
import type { Locale } from '~/i18n';
import { Wrap } from 'styled-system/jsx';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const handleSetLocale = (locale: Locale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <Wrap>
      <Link href="#" onClick={() => handleSetLocale('en')}>
        English
      </Link>
      |
      <Link href="#" onClick={() => handleSetLocale('ja')}>
        日本語
      </Link>
    </Wrap>
  );
}
