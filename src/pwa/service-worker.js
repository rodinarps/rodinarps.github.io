/*
 * RodinaRPS service worker.
 *
 * On the first visit it stores the whole game on the device. After that the game opens and plays
 * without internet, and can be installed as an app. Nothing here talks to any other site.
 *
 * The two markers below are filled in at build time by build/precache-plugin.ts:
 *   VERSION          changes whenever any file of the game changes, so a new release gets a new cache
 *   PRECACHE_URLS    every file of the game, relative to this file
 */
const VERSION = "__VERSION__";
const PRECACHE_URLS = /*PRECACHE_URLS*/ [];

const CACHE_PREFIX = "rodinarps-";
const CACHE_NAME = CACHE_PREFIX + VERSION;

/** Turns "./assets/app.js" into a full address under this worker's own scope. */
const inScope = (path) => new URL(path, self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // "reload" skips the browser's HTTP cache, so a new release is never built from stale files.
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(inScope(url), { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(answer(request));
});

/** Files of the game come from the device. Anything else goes to the network, and offline pages fall back to the game. */
async function answer(request) {
  const cache = await caches.open(CACHE_NAME);
  const stored = await cache.match(request, { ignoreSearch: true });
  if (stored) return stored;

  try {
    return await fetch(request);
  } catch (error) {
    if (request.mode === "navigate") {
      const game = await cache.match(inScope("./"));
      if (game) return game;
    }
    throw error;
  }
}
