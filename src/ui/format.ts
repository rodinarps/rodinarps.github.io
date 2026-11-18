export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** 605 -> "10m 05s" */
export function formatTimeLeft(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}
