# RodinaRPS

A browser game: play Rock Paper Scissors against a computer that learns your habits.
Built with TypeScript, Vite and plain CSS — no framework.

## Features

- **Time Mode** – 1–60 minutes (presets 5, 10, 15, 30, 60) with pause/resume.
- **Rounds Mode** – 1–50 rounds (presets 10, 20, 30, 50).
- **Learning opponent** – after 3 rounds it counters your most-played move, but still plays 30% of its moves at random.
- **Match history** – every finished match is saved in your browser (see [Saved history](#saved-history)): totals, win rate, your most played moves, and a list of recent matches.
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
│   ├── constants.ts      # mode settings (presets, min/max), AI tuning, limits
│   ├── rules.ts          # who beats whom
│   ├── opponent.ts       # the computer's move selection
│   ├── match.ts          # one game session: scores, rounds, time/rounds left
│   ├── record.ts         # a finished match as saved data + validation of saved data
│   └── stats.ts          # totals and per-move statistics from saved matches
├── storage/
│   └── historyStore.ts   # saves matches in localStorage; backup export / import
├── ui/                   # everything that touches the page
│   ├── view.ts           # screens, scores, progress bar, banner, toast
│   ├── historyView.ts    # the match history screen
│   ├── settingsDialog.ts # "how long / how many rounds?" dialog
│   ├── messages.ts       # all user-facing text
│   ├── icons.ts          # inline SVG icons (createIcon, hydrateIcons)
│   ├── format.ts         # small formatting helpers
│   ├── download.ts       # saves a text file through the browser's download
│   └── dom.ts            # querySelector that fails loudly, element builder
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

## Saved history

Every **finished** match is saved automatically (matches you restart or leave early are not):
when it started, the mode and setting, the final score, and every round (your move and the computer's).

- **Where it lives:** in your browser's `localStorage`, under the key `rodinarps:history`. It never leaves your device;
  there is no server, no account and no tracking. Cookies are not used.
- **It belongs to one browser:** each browser, each browser profile and each web address has its own copy.
- **What clears it:** deleting a site's data, or "cookies and other site data" in your browser's clear-data dialog,
  or a cleaner set to remove it. Clearing only the *cached images and files* does not.
- **Backups:** the history screen has **Export backup** (a `.json` file you keep) and **Import backup**
  (merges a backup into the current history and skips matches that are already saved). Export before you clear browser data.
- **Limits:** the newest 500 matches are kept. If the browser blocks or fills its storage, the game still works; it just can't save.
- **Changing the saved format:** saved data is validated when read (`isMatchRecord`). If you change the shape of
  `MatchRecord`, bump `RECORD_VERSION` in `src/core/record.ts` and convert old data instead of dropping it.

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

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` runs the tests, builds the game and publishes it
on every push to `main`.

1. Push this project to a GitHub repository (suggested name: `rodinarps`, default branch `main`).
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` (or run the workflow from the **Actions** tab). The game appears at
   `https://<your-username>.github.io/rodinarps/`.

`vite.config.ts` uses `base: "./"`, so the same build works under any repository name or custom domain.

## Browser note

The **Quit** button shows a message instead of closing the tab, because browsers don't let a page close itself.

## License

The game's code is released under the [MIT License](LICENSE) © 2026 AbuKaram01.
The bundled fonts and icons keep their own licenses, listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Author

AbuKaram01 · <abukaram01@proton.me>
