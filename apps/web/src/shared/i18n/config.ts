import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import {
  resources,
  supportedLocales,
  defaultLocale,
  namespaces,
  type Locale,
} from "@zeyn/i18n";

export { supportedLocales, defaultLocale, type Locale };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "uz",
    supportedLngs: ["uz", "en", "ru"],
    ns: namespaces,
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "zeyn-locale",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
