// Tally-style "Due on" input parsing. Users type either a duration ("9 Days",
// "2 Months", "1 Year", or bare "9" = days) or an actual date. Reports and
// order-outstanding logic need a real ISO date, so allocations store BOTH:
// the raw text the user typed (display) and the resolved ISO date (logic).

const DUR_RE = /^\s*(\d+)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)?\s*$/i;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Resolve a "Due on" entry to an ISO date (YYYY-MM-DD), relative to `baseDate`
 * (the voucher date, ISO). Returns null when the text is unparseable.
 */
export function parseDueOn(text: string | null | undefined, baseDate?: string | null): string | null {
  const raw = (text || "").trim();
  if (!raw) return null;

  // Already an ISO date?
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Duration form: "9", "9 Days", "2 Months", "1 Year".
  const m = raw.match(DUR_RE);
  if (m) {
    const n = Number(m[1]);
    const unit = (m[2] || "d").toLowerCase();
    const base = baseDate && /^\d{4}-\d{2}-\d{2}/.test(baseDate) ? new Date(baseDate) : new Date();
    if (Number.isNaN(base.getTime())) return null;
    const d = new Date(base);
    if (unit.startsWith("d") || unit.startsWith("w")) {
      d.setDate(d.getDate() + n * (unit.startsWith("w") ? 7 : 1));
    } else if (unit.startsWith("m")) {
      d.setMonth(d.getMonth() + n);
    } else {
      d.setFullYear(d.getFullYear() + n);
    }
    return toIso(d);
  }

  // Date-ish forms: "1-Jul-26", "01/07/2026", "1 Jul 2026".
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return toIso(parsed);
  return null;
}

/** Local-timezone ISO date (avoids the toISOString UTC shift). */
export function toLocalIsoDate(d: Date): string {
  return toIso(d);
}
