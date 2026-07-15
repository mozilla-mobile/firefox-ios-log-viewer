import type { LogLevel, LogLine } from './types';

export interface Filters {
  level: LogLevel | '';
  category: string | '';
  /// Inclusive lower/upper bounds as `datetime-local` input values
  /// (e.g. "2026-07-10T09:46" or "…:46:42"). Empty string means "unbounded".
  from?: string;
  to?: string;
}

/// Canonical zero-padded key (YYYYMMDDHHmmssSSS) for lexicographic time
/// comparison. Works for both log timestamps ("2026-07-10 09:46:42.942") and
/// coarser `datetime-local` values ("2026-07-10T09:46") — comparing digits as
/// a fixed-width string sidesteps timezone parsing entirely. Pad with '9' to
/// turn a coarse value into an inclusive upper bound (e.g. a minute-precision
/// "to" then covers that whole minute).
function timeKey(value: string, pad: '0' | '9' = '0'): string {
  return (value.replace(/\D/g, '') + pad.repeat(17)).slice(0, 17);
}

/// Filter parsed lines by level, category, and/or timestamp range. Empty string
/// means "any". Unstructured lines (no level/category/timestamp) are hidden when
/// any filter is active.
export function filterLines(lines: LogLine[], filters: Filters): LogLine[] {
  const { level, category, from, to } = filters;
  const fromKey = from ? timeKey(from, '0') : '';
  const toKey = to ? timeKey(to, '9') : '';
  if (!level && !category && !fromKey && !toKey) return lines;
  return lines.filter((l) => {
    if (level && l.level !== level) return false;
    if (category && l.category !== category) return false;
    if (fromKey || toKey) {
      if (!l.timestamp) return false;
      const k = timeKey(l.timestamp);
      if (fromKey && k < fromKey) return false;
      if (toKey && k > toKey) return false;
    }
    return true;
  });
}

/// Positions (within `lines`) whose raw text contains `query` (case-insensitive).
export function findMatches(lines: LogLine[], query: string): number[] {
  if (!query) return [];
  const q = query.toLowerCase();
  const out: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].raw.toLowerCase().includes(q)) out.push(i);
  }
  return out;
}
