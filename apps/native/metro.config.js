const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

if (!process.env.EXPO_PUBLIC_SERVER_URL) {
  throw new Error(
    "EXPO_PUBLIC_SERVER_URL is not set.\n\n" +
      "Babel inlines EXPO_PUBLIC_* at bundle time, so an unset value produces a " +
      "bundle that builds cleanly and then crashes on launch with " +
      '"Invalid environment variables".\n\n' +
      "Local builds: copy apps/native/.env.example to apps/native/.env\n" +
      "EAS builds:   .env is gitignored and never uploaded — set it under " +
      "build.<profile>.env in apps/native/eas.json"
  );
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const uniwindConfig = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
  extraThemes: ["arcade"],
});

module.exports = uniwindConfig;
