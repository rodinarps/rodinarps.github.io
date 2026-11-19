export function requireElement<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required page element not found: ${selector}`);
  return element;
}

export function requireElements<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  const elements = [...document.querySelectorAll<T>(selector)];
  if (elements.length === 0) throw new Error(`Required page elements not found: ${selector}`);
  return elements;
}

/** Builds an element in one line. Text is set with `textContent`, so it can never be read as HTML. */
export function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
