import { ar } from "./ar";
import { en, type MessageKey } from "./en";

export type { MessageKey };
export type Language = "ar" | "en";

export const LANGUAGES: readonly Language[] = ["ar", "en"];
export const DEFAULT_LANGUAGE: Language = "ar";

export const DIRECTION: Record<Language, "rtl" | "ltr"> = { ar: "rtl", en: "ltr" };

const DICTIONARIES: Record<Language, Record<MessageKey, string>> = { ar, en };

export type MessageParams = Readonly<Record<string, string | number>>;

export function isMessageKey(value: unknown): value is MessageKey {
  return typeof value === "string" && Object.hasOwn(en, value);
}

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

export function otherLanguage(language: Language): Language {
  return language === "ar" ? "en" : "ar";
}

/** Looks up a text in one language and fills in its `{placeholders}`. */
export function translate(language: Language, key: MessageKey, params: MessageParams = {}): string {
  return DICTIONARIES[language][key].replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? ""));
}

let currentLanguage: Language = DEFAULT_LANGUAGE;

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  currentLanguage = language;
}

/** A text in the language the page is currently showing. */
export function t(key: MessageKey, params?: MessageParams): string {
  return translate(currentLanguage, key, params);
}
