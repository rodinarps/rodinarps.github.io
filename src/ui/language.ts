import { DIRECTION, isMessageKey, otherLanguage, setLanguage, t, type Language } from "../i18n";

/**
 * Switches the whole page to a language: text direction, page title, and every element
 * marked `data-i18n="key"` (its text) or `data-i18n-aria-label="key"` (its accessible name).
 * Text that changes while you play is drawn by the view and dialogs themselves.
 */
export function applyLanguage(language: Language): void {
  setLanguage(language);

  const root = document.documentElement;
  root.lang = language;
  root.dir = DIRECTION[language];

  document.title = t("page.title");
  document.querySelector("#meta-description")?.setAttribute("content", t("page.description"));

  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n;
    if (!isMessageKey(key)) throw new Error(`Unknown text key in HTML: ${key}`);
    element.textContent = t(key);
  }
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]")) {
    const key = element.dataset.i18nAriaLabel;
    if (!isMessageKey(key)) throw new Error(`Unknown text key in HTML: ${key}`);
    element.setAttribute("aria-label", t(key));
  }

  // The toggle shows the OTHER language's name, so mark it with that language for screen readers.
  const toggle = document.querySelector<HTMLElement>("#language-toggle");
  if (toggle) toggle.lang = otherLanguage(language);
}
