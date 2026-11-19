import { CHOICES } from "../core/constants";
import { recordVerdict } from "../core/record";
import type { HistoryStats } from "../core/stats";
import type { MatchRecord, RoundResult } from "../core/types";
import { make, requireElement } from "./dom";
import { capitalize, describeMatchSetup, formatMatchDate, formatPercent } from "./format";
import { createIcon } from "./icons";
import { HISTORY_TEXT } from "./messages";

const MAX_LISTED_MATCHES = 30;
const VERDICT_LABEL: Record<RoundResult, string> = { win: "WIN", lose: "LOSS", tie: "TIE" };

export interface HistoryHandlers {
  onOpen(): void;
  onBack(): void;
  onExport(): void;
  onImportFile(file: File): void;
  onClear(): void;
}

/** The match history screen, and the button on the home screen that opens it. */
export class HistoryView {
  private readonly openButton = requireElement<HTMLButtonElement>("#open-history");
  private readonly count = requireElement("#history-count");

  private readonly statMatches = requireElement("#stat-matches");
  private readonly statWins = requireElement("#stat-wins");
  private readonly statLosses = requireElement("#stat-losses");
  private readonly statWinRate = requireElement("#stat-winrate");
  private readonly summary = requireElement("#history-summary");
  private readonly moveList = requireElement("#move-list");

  private readonly matchList = requireElement("#match-list");
  private readonly empty = requireElement("#history-empty");
  private readonly listNote = requireElement("#history-list-note");
  private readonly note = requireElement("#history-note");

  private readonly exportButton = requireElement<HTMLButtonElement>("#export-history");
  private readonly importButton = requireElement<HTMLButtonElement>("#import-history");
  private readonly clearButton = requireElement<HTMLButtonElement>("#clear-history");
  private readonly importInput = requireElement<HTMLInputElement>("#import-input");

  bind(handlers: HistoryHandlers): void {
    this.openButton.addEventListener("click", handlers.onOpen);
    requireElement("#history-back").addEventListener("click", handlers.onBack);
    this.exportButton.addEventListener("click", handlers.onExport);
    this.clearButton.addEventListener("click", handlers.onClear);

    this.importButton.addEventListener("click", () => this.importInput.click());
    this.importInput.addEventListener("change", () => {
      const file = this.importInput.files?.[0];
      this.importInput.value = ""; // so choosing the same file again still counts as a change
      if (file) handlers.onImportFile(file);
    });
  }

  /** The number on the home screen's "Match history" button. */
  renderCount(count: number): void {
    this.count.textContent = String(count);
  }

  render(records: readonly MatchRecord[], stats: HistoryStats, storageAvailable: boolean): void {
    this.statMatches.textContent = String(stats.matches);
    this.statWins.textContent = String(stats.matchWins);
    this.statLosses.textContent = String(stats.matchLosses);
    this.statWinRate.textContent = formatPercent(stats.matchWins, stats.matches);
    this.summary.textContent = summaryText(stats);

    this.renderMoves(stats);
    this.renderMatches(records);

    const hasMatches = records.length > 0;
    this.exportButton.disabled = !hasMatches;
    this.clearButton.disabled = !hasMatches;
    this.importButton.disabled = !storageAvailable;
    this.note.textContent = storageAvailable ? HISTORY_TEXT.noteAvailable : HISTORY_TEXT.noteUnavailable;
  }

  private renderMoves(stats: HistoryStats): void {
    this.moveList.replaceChildren(
      ...CHOICES.map((choice) => {
        const { played, won } = stats.moves[choice];

        const row = make("li", "move-row");
        row.dataset.choice = choice;

        const icon = make("span", "move-icon");
        icon.setAttribute("aria-hidden", "true");
        icon.append(createIcon(choice));

        const fill = make("span", "move-bar-fill");
        fill.style.width = `${stats.rounds === 0 ? 0 : (played / stats.rounds) * 100}%`;
        const bar = make("span", "move-bar");
        bar.setAttribute("aria-hidden", "true");
        bar.append(fill);

        const meta = `${played} played · ${formatPercent(won, played)} won`;
        row.append(icon, make("span", "move-name", capitalize(choice)), bar, make("span", "move-meta", meta));
        return row;
      }),
    );
  }

  private renderMatches(records: readonly MatchRecord[]): void {
    const newestFirst = records.slice(-MAX_LISTED_MATCHES).reverse();

    this.matchList.replaceChildren(...newestFirst.map(matchRow));
    this.matchList.hidden = records.length === 0;
    this.empty.textContent = HISTORY_TEXT.empty;
    this.empty.hidden = records.length > 0;

    const hasMore = records.length > newestFirst.length;
    this.listNote.hidden = !hasMore;
    if (hasMore) this.listNote.textContent = HISTORY_TEXT.latest(newestFirst.length, records.length);
  }
}

function summaryText(stats: HistoryStats): string {
  const parts = [
    `Ties ${stats.matchTies}`,
    `Rounds played ${stats.rounds}`,
    `Round win rate ${formatPercent(stats.roundWins, stats.rounds)}`,
  ];
  if (stats.favoriteMove) parts.push(`Favorite move ${capitalize(stats.favoriteMove)}`);
  return parts.join(" · ");
}

function matchRow(record: MatchRecord): HTMLElement {
  const verdict = recordVerdict(record);

  const info = make("div", "match-info");
  info.append(
    make("span", "match-setup", describeMatchSetup(record.mode, record.setting)),
    make("span", "match-date", formatMatchDate(record.startedAt)),
  );

  const badge = make("span", "match-badge", VERDICT_LABEL[verdict]);
  badge.dataset.tone = verdict;

  const row = make("li", "match-row");
  row.append(info, make("strong", "match-score", `${record.playerScore} — ${record.cpuScore}`), badge);
  return row;
}
