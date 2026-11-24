/** Chrome's "install this app" event, which TypeScript does not know about yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

/**
 * Lets the game work without internet. It does nothing while developing (so nothing is cached under your feet)
 * and silently gives up where the browser has no service workers: the game works the same, just online only.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // Offline support is a bonus; the game itself does not depend on it.
    });
  });
}

/**
 * Shows an "Install app" button when the browser says the game can be installed (Chrome, Edge, Android).
 * Safari has no such event: there, Share -> Add to Home Screen does the same job.
 */
export function setUpInstallButton(button: HTMLButtonElement): void {
  let offer: BeforeInstallPromptEvent | null = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    offer = event as BeforeInstallPromptEvent;
    button.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    offer = null;
    button.hidden = true;
  });

  button.addEventListener("click", () => {
    const pending = offer;
    if (!pending) return;
    offer = null; // an offer can only be used once
    button.hidden = true;
    void pending.prompt();
  });
}
