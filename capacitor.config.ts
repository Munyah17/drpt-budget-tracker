import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kmgvitallinks.wellspend",
  appName: "WellSpend",
  webDir: "shell",
  server: {
    url: "https://drpt-budget-tracker.vercel.app",
    cleartext: false,
    errorPath: "index.html",
  },
  ios: { contentInset: "always", backgroundColor: "#fff7fa" },
  plugins: {
    SplashScreen: { launchAutoHide: true, launchShowDuration: 800, backgroundColor: "#c81057" },
    StatusBar: { style: "DEFAULT" },
  },
};

export default config;
