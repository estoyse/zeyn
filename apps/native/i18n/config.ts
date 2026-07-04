import { resources, namespaces, defaultLocale, supportedLocales, type Locale } from "@zeyn/i18n";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as SecureStore from "expo-secure-store";

export { supportedLocales, defaultLocale, type Locale };

const LOCALE_STORAGE_KEY = "zeyn-locale";

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: "uz",
  supportedLngs: supportedLocales,
  ns: [...namespaces],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

function isLocale(value: string | null): value is Locale {
  return !!value && (supportedLocales as readonly string[]).includes(value);
}

export async function initLocale() {
  const stored = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) {
    await i18n.changeLanguage(stored);
  }
}

export async function setLocale(lng: Locale) {
  await i18n.changeLanguage(lng);
  await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, lng);
}

export default i18n;
