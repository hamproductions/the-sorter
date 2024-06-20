import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ja from './locales/ja.json';
// don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init
export const resources = {
  en: {
    translation: en
  },
  ja: {
    translation: ja
  }
};

void i18n
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  // want your translations to be loaded from a professional CDN? => https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: undefined,
    fallbackLng: 'en',
    debug: import.meta.env.MODE === 'development',
    resources,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type Locale = 'en' | 'ja' | string;

export default i18n;
