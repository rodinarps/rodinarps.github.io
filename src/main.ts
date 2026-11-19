import { App } from "./app";
import { getBrowserStorage, HistoryStore } from "./storage/historyStore";
import { HistoryView } from "./ui/historyView";
import { hydrateIcons } from "./ui/icons";
import { SettingsDialog } from "./ui/settingsDialog";
import { GameView } from "./ui/view";

hydrateIcons();

const history = new HistoryStore(getBrowserStorage());
new App(new GameView(), new SettingsDialog(), new HistoryView(), history).start();
