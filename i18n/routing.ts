import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["he", "en", "nl"],
  defaultLocale: "he",
  localePrefix: "as-needed",
});
