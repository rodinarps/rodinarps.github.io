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
