# Rock · Paper · Scissors (Web Edition)

A browser game: play Rock Paper Scissors against a computer that learns your habits.

## Features

- **Time Mode** – 1–60 minutes (presets 5, 10, 15, 30, 60) with pause/resume.
- **Rounds Mode** – 1–50 rounds (presets 10, 20, 30, 50).
- **Learning opponent** – after 3 rounds it counters your most-played move, but still plays 30% of its moves at random.
- Live score, result banner, progress bar, restart / home controls, responsive layout.

## Development

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev        # dev server with hot reload
npm test           # unit tests (Vitest)
npm run typecheck  # TypeScript check only
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

## Project structure

```
src/
├── main.ts               # entry point: creates the view + dialog and starts the app
├── app.ts                # controller: connects the game rules to the page
├── core/                 # game rules — no DOM, fully unit-tested
│   ├── types.ts          # Choice, Mode, RoundResult, ...
│   ├── constants.ts      # emoji, mode settings (presets, min/max), AI tuning
│   ├── rules.ts          # who beats whom
│   ├── opponent.ts       # the computer's move selection
│   └── match.ts          # one game session: scores, history, time/rounds left
├── ui/                   # everything that touches the page
│   ├── view.ts           # screens, scores, progress bar, banner, toast
│   ├── settingsDialog.ts # "how long / how many rounds?" dialog
│   ├── messages.ts       # all user-facing text
│   ├── icons.ts          # inline SVG icons (createIcon, hydrateIcons)
│   ├── format.ts         # small formatting helpers
│   └── dom.ts            # querySelector that fails loudly
├── utils/timers.ts       # tiny wrappers around setInterval / setTimeout
├── assets/fonts/         # self-hosted DM Sans + Space Grotesk (woff2)
├── assets/icons/         # SVG icons: Twemoji art + Lucide UI icons
└── styles/main.css
public/                   # favicon.svg + license texts, copied as-is into the build
tests/                    # Vitest unit tests + guards against external requests and system glyphs
THIRD_PARTY_NOTICES.md    # fonts and icons: authors and licenses
```

The rules in `core/` never touch the DOM or timers, so they can be tested without a browser.
`ui/` never decides game logic; `app.ts` is the only place where the two meet.

## Self-contained by design

The game makes **no requests to any other site**: no CDN, no web-font service, no analytics.

- **Fonts** – DM Sans and Space Grotesk are bundled in `src/assets/fonts/` (variable `woff2`, latin subset)
  under the SIL Open Font License 1.1.
- **Emoji and symbols** – no emoji or special characters are drawn by the visitor's operating system.
  The hands and result icons are Twemoji (CC BY 4.0) and the interface icons are Lucide (ISC), all inlined as SVG
  from `src/assets/icons/`, so the game looks the same on every device.
- **Licenses** – see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); the full texts are in `public/licenses/`
  and are shipped with the build.
- **Enforced by the browser** – the production build adds a `Content-Security-Policy` that only allows
  same-origin scripts, styles and fonts, so an accidental external link is blocked instead of silently loading.
- **Enforced by the tests** – `tests/self-contained.test.ts` fails if `index.html` or anything in `src/` contains an
  external URL, or a character the bundled fonts don't cover (e.g. an emoji typed by mistake).

What is still outside the project:

- **Build tools** (Vite, TypeScript, Vitest) come from npm at build time only; versions are pinned in `package-lock.json`
  and none of them ship with the game.
- **Hosting** – GitHub Pages is just one option. `npm run build` produces plain static files in `dist/`
  that can be served from any web server.

## Browser note

The **Quit** button shows a message instead of closing the tab, because browsers don't let a page close itself.

## License

The game's code is released under the [MIT License](LICENSE) © 2026 AbuKaram01.
The bundled fonts and icons keep their own licenses, listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Author

AbuKaram01 · <abukaram01@proton.me>
