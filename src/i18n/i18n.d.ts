// import the original type declarations
import 'i18next';
// import all namespaces (for the default language, only)
import type translations from '../../public/locales/en/translation.json';

declare module 'i18next' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    // custom resources type
    resources: typeof translations;
    // other
  }
}
