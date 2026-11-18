import { App } from "./app";
import { hydrateIcons } from "./ui/icons";
import { SettingsDialog } from "./ui/settingsDialog";
import { GameView } from "./ui/view";

hydrateIcons();
new App(new GameView(), new SettingsDialog()).start();
