import type { LogLevel, LogLine } from './types';

export interface Filters {
  level: LogLevel | '';
  category: string | '';
}

/// Filter parsed lines by level and/or category. Empty string means "any".
/// Unstructured lines (no level/category) are hidden when a filter is active.
export function filterLines(lines: LogLine[], filters: Filters): LogLine[] {
  const { level, category } = filters;
  if (!level && !category) return lines;
  return lines.filter(
    (l) => (!level || l.level === level) && (!category || l.category === category)
  );
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
