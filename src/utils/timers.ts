/** Wraps setInterval so callers never juggle raw timer ids. */
export class RepeatingTimer {
  private id: number | null = null;

  start(callback: () => void, intervalMs: number): void {
    this.stop();
    this.id = window.setInterval(callback, intervalMs);
  }

  stop(): void {
    if (this.id === null) return;
    window.clearInterval(this.id);
    this.id = null;
  }
}

/** Wraps setTimeout; scheduling again replaces the pending call. */
export class DelayedAction {
  private id: number | null = null;

  schedule(callback: () => void, delayMs: number): void {
    this.cancel();
    this.id = window.setTimeout(() => {
      this.id = null;
      callback();
    }, delayMs);
  }

  cancel(): void {
    if (this.id === null) return;
    window.clearTimeout(this.id);
    this.id = null;
  }
}
