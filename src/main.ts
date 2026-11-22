import { App } from "./app";
import { getBrowserStorage } from "./storage/browserStorage";
import { HistoryStore } from "./storage/historyStore";
import { PreferencesStore } from "./storage/preferences";
import { HistoryView } from "./ui/historyView";
import { hydrateIcons } from "./ui/icons";
import { applyLanguage } from "./ui/language";
import { SettingsDialog } from "./ui/settingsDialog";
import { GameView } from "./ui/view";

const storage = getBrowserStorage();
const preferencesStore = new PreferencesStore(storage);
const preferences = preferencesStore.load();

applyLanguage(preferences.language);
hydrateIcons();

new App(
  new GameView(),
  new SettingsDialog(),
  new HistoryView(),
  new HistoryStore(storage),
  preferencesStore,
  preferences,
).start();

// The page is translated and drawn: show it (see public/early-language.js).
document.documentElement.removeAttribute("data-language-pending");
