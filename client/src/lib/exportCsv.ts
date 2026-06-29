// Shared CSV export helper. Builds a quoted/escaped CSV from typed columns and
// triggers a browser download. Reused across registers/reports so each screen
// doesn't hand-roll Blob/anchor plumbing.

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const escapeCell = (v: string | number | null | undefined): string =>
  `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Build CSV text: optional metadata lines, then header row, then data rows. */
export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[], metadata: string[] = []): string {
  const headerRow = columns.map((c) => escapeCell(c.header)).join(",");
  const dataRows = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(","));
  const meta = metadata.length ? metadata.join("\n") + "\n" : "";
  return meta + headerRow + "\n" + dataRows.join("\n");
}

/** Download a string as a .csv file. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Convenience: build + download in one call. */
export function exportRowsToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
  metadata?: string[],
): void {
  downloadCsv(filename, buildCsv(columns, rows, metadata));
}
