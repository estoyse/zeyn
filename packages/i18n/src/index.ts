import enCommon from "./locales/en/common.json";
import enSettings from "./locales/en/settings.json";
import enAuth from "./locales/en/auth.json";
import enLanding from "./locales/en/landing.json";
import enDashboard from "./locales/en/dashboard.json";
import enGame from "./locales/en/game.json";
import enGames from "./locales/en/games.json";
import enProfile from "./locales/en/profile.json";
import enEmail from "./locales/en/email.json";
import enOnboarding from "./locales/en/onboarding.json";
import enLegal from "./locales/en/legal.json";
import uzCommon from "./locales/uz/common.json";
import uzSettings from "./locales/uz/settings.json";
import uzAuth from "./locales/uz/auth.json";
import uzLanding from "./locales/uz/landing.json";
import uzDashboard from "./locales/uz/dashboard.json";
import uzGame from "./locales/uz/game.json";
import uzGames from "./locales/uz/games.json";
import uzProfile from "./locales/uz/profile.json";
import uzEmail from "./locales/uz/email.json";
import uzOnboarding from "./locales/uz/onboarding.json";
import uzLegal from "./locales/uz/legal.json";
import ruCommon from "./locales/ru/common.json";
import ruSettings from "./locales/ru/settings.json";
import ruAuth from "./locales/ru/auth.json";
import ruLanding from "./locales/ru/landing.json";
import ruDashboard from "./locales/ru/dashboard.json";
import ruGame from "./locales/ru/game.json";
import ruGames from "./locales/ru/games.json";
import ruProfile from "./locales/ru/profile.json";
import ruEmail from "./locales/ru/email.json";
import ruOnboarding from "./locales/ru/onboarding.json";
import ruLegal from "./locales/ru/legal.json";

export const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    auth: enAuth,
    landing: enLanding,
    dashboard: enDashboard,
    game: enGame,
    games: enGames,
    profile: enProfile,
    email: enEmail,
    onboarding: enOnboarding,
    legal: enLegal,
  },
  uz: {
    common: uzCommon,
    settings: uzSettings,
    auth: uzAuth,
    landing: uzLanding,
    dashboard: uzDashboard,
    game: uzGame,
    games: uzGames,
    profile: uzProfile,
    email: uzEmail,
    onboarding: uzOnboarding,
    legal: uzLegal,
  },
  ru: {
    common: ruCommon,
    settings: ruSettings,
    auth: ruAuth,
    landing: ruLanding,
    dashboard: ruDashboard,
    game: ruGame,
    games: ruGames,
    profile: ruProfile,
    email: ruEmail,
    onboarding: ruOnboarding,
    legal: ruLegal,
  },
} as const;

export const supportedLocales = ["uz", "en", "ru"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "uz";
export const namespaces = [
  "common",
  "settings",
  "auth",
  "landing",
  "dashboard",
  "game",
  "games",
  "profile",
  "email",
  "onboarding",
  "legal",
] as const;
