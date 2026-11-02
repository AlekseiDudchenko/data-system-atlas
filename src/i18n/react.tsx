import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./index";

// No default language: a component outside a provider must not silently render Russian.
const LocaleContext = createContext<Locale | null>(null);

/** The provided locale, or the explicit one when a component renders outside a provider. */
export function useLocale(explicit?: Locale): Locale {
  const provided = useContext(LocaleContext);
  const locale = explicit ?? provided;
  if (!locale)
    throw new Error("useLocale needs a LocaleProvider or an explicit locale");
  return locale;
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}
