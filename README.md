# RodinaRPS

A browser game: play Rock Paper Scissors against an AI that learns your habits, in Arabic or English.
Built with TypeScript, Vite and plain CSS — no framework.

## Features

- **Time Mode** – 1–60 minutes (presets 5, 10, 15, 30, 60) with pause/resume.
- **Rounds Mode** – 1–50 rounds (presets 10, 20, 30, 50).
- **Four difficulty levels** – Easy, Medium, Hard and Extreme (see [Difficulty levels](#difficulty-levels)).
- **Arabic and English** – Arabic by default with a right-to-left layout, English one click away (see [Languages](#languages)).
- **Match history** – every finished match is saved in your browser (see [Saved history](#saved-history)): totals, win rate, your most played moves, and a list of recent matches.
- Live score, result banner, progress bar, restart / home controls, responsive layout.

## Difficulty levels

The AI picks its move *before* it sees yours. It only learns from rounds that are already over, so it never cheats.
It guesses what you will play next and plays the move that beats that guess; a level is simply how good the guess is.

| Level | Random rounds | How it guesses |
|---|---|---|
| **Easy** | 70% | Your most played move, and half the time it deliberately lets you win. |
| **Medium** | 30% | Your most played move. This is the original algorithm. |
| **Hard** | 15% | Your recent moves, and what you usually play after your last move: it spots sequences and cycles. |
| **Extreme** | 5% | Five methods at once (overall habits, recent habits, what follows your last one or two moves, and how you react to winning or losing). It follows whichever has been right most often lately. |

Nobody can beat a truly random player, so every level wins about a third of the rounds against one.
The levels differ in how well they exploit patterns. The AI's share of rounds against simulated players (400 rounds, 60 games each):

| Simulated player | Easy | Medium | Hard | Extreme |
|---|---|---|---|---|
| Random | 33% | 33% | 33% | 34% |
| Always rock | 38% | 80% | 90% | 96% |
| Rock, paper, scissors on repeat | 34% | 34% | 89% | 96% |
| Win-stay, lose-shift | 33% | 27% | 36% | 47% |
| Tries to outsmart the AI | 33% | 27% | 32% | 70% |

Medium is the original algorithm, so a player who works out how it behaves can out-think it.
The levels are plain data in `src/core/difficulty.ts` and the guessing methods are in `src/core/predictors.ts`;
`tests/difficulty-simulation.test.ts` checks their behaviour.

## Languages

Arabic is the default and English is one click away. Your choice (and your last difficulty) is remembered in this
browser under `rodinarps:preferences`.

- **All text** lives in `src/i18n/ar.ts` and `src/i18n/en.ts`. TypeScript refuses to compile if one language is missing a key,
  and the tests check that both use the same `{placeholders}`.
- **Text in `index.html`** is marked `data-i18n="key"` and filled in for the chosen language. The HTML itself holds the Arabic text,
  so the page is right before any script runs; a test checks it matches `ar.ts`.
- **Right to left:** `<html dir>` follows the language and the CSS uses logical properties (`margin-inline-start`, ...),
  with arrows mirrored.
- **Numbers** use Western digits in both languages, so they match the score and timer font.
- **To add a language:** copy `en.ts`, add it to `LANGUAGES` and `DIRECTION` in `src/i18n/index.ts`, and bundle a font that covers its letters.

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
├── main.ts               # entry point: loads preferences, picks the language, starts the app
├── app.ts                # controller: connects the game rules to the page
├── core/                 # game rules, no DOM, fully unit-tested
│   ├── types.ts          # Choice, Mode, Difficulty, MatchRecord, ...
│   ├── constants.ts      # mode settings (presets, min/max), UI timing, limits
│   ├── rules.ts          # who beats whom
│   ├── difficulty.ts     # the four levels and what each one does
│   ├── predictors.ts     # ways of guessing your next move
│   ├── opponent.ts       # the AI's move selection
│   ├── match.ts          # one game session: scores, rounds, time/rounds left
│   ├── record.ts         # a finished match as saved data, plus validation and upgrade of saved data
│   └── stats.ts          # totals and per-move statistics from saved matches
├── i18n/                 # en.ts, ar.ts and the t() helper
├── storage/
│   ├── browserStorage.ts # localStorage access that never throws
│   ├── historyStore.ts   # saves matches; backup export / import
│   └── preferences.ts    # remembers language and difficulty
├── ui/                   # everything that touches the page
│   ├── view.ts           # screens, scores, progress bar, banner, toast
│   ├── historyView.ts    # the match history screen
│   ├── settingsDialog.ts # "how long / how many rounds, and how hard?" dialog
│   ├── language.ts       # switches language, direction and page texts
│   ├── messages.ts       # banners and toasts, built from the current language
│   ├── icons.ts          # inline SVG icons (createIcon, hydrateIcons)
│   ├── format.ts         # small formatting helpers
│   ├── download.ts       # saves a text file through the browser's download
│   └── dom.ts            # querySelector that fails loudly, element builder
├── utils/timers.ts       # tiny wrappers around setInterval / setTimeout
├── assets/fonts/         # DM Sans + Space Grotesk (latin) and Cairo (Arabic), woff2
├── assets/icons/         # SVG icons: Twemoji art + Lucide UI icons
└── styles/main.css
public/                   # favicon.svg + license texts, copied as-is into the build
tests/                    # Vitest unit tests + guards against external requests and system glyphs
THIRD_PARTY_NOTICES.md    # fonts and icons: authors and licenses
```

The rules in `core/` never touch the DOM or timers, so they can be tested without a browser.
`ui/` never decides game logic; `app.ts` is the only place where the two meet.

## Saved history

Every **finished** match is saved automatically (matches you restart or leave early are not):
when it started, the mode, setting and difficulty, the final score, and every round (your move and the AI's).

- **Where it lives:** in your browser's `localStorage`, under the key `rodinarps:history`. It never leaves your device;
  there is no server, no account and no tracking. Cookies are not used.
- **It belongs to one browser:** each browser, each browser profile and each web address has its own copy.
- **What clears it:** deleting a site's data, or "cookies and other site data" in your browser's clear-data dialog,
  or a cleaner set to remove it. Clearing only the *cached images and files* does not.
- **Backups:** the history screen has **Export backup** (a `.json` file you keep) and **Import backup**
  (merges a backup into the current history and skips matches that are already saved). Export before you clear browser data.
- **Limits:** the newest 500 matches are kept. If the browser blocks or fills its storage, the game still works; it just can't save.
- **Older data:** matches saved before difficulty levels existed (format version 1, with `cpuScore`) are read as Medium matches
  against the AI and saved in the current format (version 2) the next time something is added. Old backup files still import.
- **Changing the saved format:** saved data is validated when read (`isMatchRecord`, `upgradeRecord`). If you change the shape of
  `MatchRecord`, bump `RECORD_VERSION` in `src/core/record.ts` and convert old data instead of dropping it.

## Self-contained by design

The game makes **no requests to any other site**: no CDN, no web-font service, no analytics.

- **Fonts** – DM Sans and Space Grotesk (latin) and Cairo (Arabic) are bundled in `src/assets/fonts/`
  (variable `woff2`, subsets) under the SIL Open Font License 1.1.
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
