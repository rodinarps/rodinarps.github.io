import { make } from "./dom";

/** Saves text as a file through the browser's normal download. Nothing is uploaded anywhere. */
export function downloadTextFile(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = make("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
