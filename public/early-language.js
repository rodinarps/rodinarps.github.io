// Runs before the page is drawn. If the saved language is English, the page (written in Arabic) is
// switched to English direction at once and kept hidden until main.ts has translated it, so nobody
// sees a flash of Arabic that then jumps. Arabic visitors are not affected at all.
// The storage key must match PREFERENCES_STORAGE_KEY in src/storage/preferences.ts (a test checks it).
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem("rodinarps:preferences") || "null");
    if (saved && saved.language === "en") {
      var root = document.documentElement;
      root.lang = "en";
      root.dir = "ltr";
      root.setAttribute("data-language-pending", "");
      // Safety net: never leave the page hidden if the app fails to start.
      setTimeout(function () {
        root.removeAttribute("data-language-pending");
      }, 2000);
    }
  } catch (error) {
    // Storage blocked or unreadable: the page simply stays in Arabic, the default.
  }
})();
