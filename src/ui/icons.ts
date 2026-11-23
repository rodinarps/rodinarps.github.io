import type { Mode } from "../core/types";

/**
 * Every icon the game uses. Each one has a matching file in src/assets/icons/.
 * The three choices (rock, paper, scissors) share their names with their icons.
 */
const ICON_NAMES = [
  // Twemoji art
  "rock",
  "paper",
  "scissors",
  "party",
  "skull",
  "handshake",
  "trophy",
  // Lucide UI icons
  "clock",
  "rows-3",
  "arrow-up-right",
  "arrow-right",
  "pause",
  "play",
  "rotate-cw",
  "house",
  "x",
  "sparkle",
  "history",
  "download",
  "upload",
  "trash-2",
  "arrow-left",
  "infinity",
  "flag",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const MODE_ICON: Record<Mode, IconName> = {
  time: "clock",
  rounds: "rows-3",
  free: "infinity",
};

const rawIcons = import.meta.glob<string>("../assets/icons/**/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Prepares an SVG file for inlining: no comments, no size or namespace, hidden from screen readers. */
function prepare(svg: string): string {
  return svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim()
    .replace(/<svg\b[^>]*>/, (rootTag) =>
      rootTag
        .replace(/\s(?:xmlns|width|height|class)="[^"]*"/g, "")
        .replace("<svg", '<svg class="icon" aria-hidden="true" focusable="false"'),
    );
}

const markupByName = new Map<string, string>(
  Object.entries(rawIcons).map(([path, svg]) => [
    (path.split("/").pop() ?? path).replace(/\.svg$/, ""),
    prepare(svg),
  ]),
);

export function isIconName(value: unknown): value is IconName {
  return ICON_NAMES.includes(value as IconName);
}

export function iconMarkup(name: IconName): string {
  const markup = markupByName.get(name);
  if (!markup) throw new Error(`Missing icon file: ${name}.svg`);
  return markup;
}

export function createIcon(name: IconName): SVGElement {
  const template = document.createElement("template");
  template.innerHTML = iconMarkup(name);
  const icon = template.content.firstElementChild;
  if (!(icon instanceof SVGElement)) throw new Error(`Icon is not valid SVG: ${name}`);
  return icon;
}

/** Fills every `<span data-icon="name">` in the page with its inline SVG. */
export function hydrateIcons(root: ParentNode = document): void {
  for (const element of root.querySelectorAll<HTMLElement>("[data-icon]")) {
    const name = element.dataset.icon;
    if (!isIconName(name)) throw new Error(`Unknown icon name in HTML: ${name}`);
    element.replaceChildren(createIcon(name));
  }
}
