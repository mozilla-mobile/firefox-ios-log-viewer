import type { LogLevel, LogLine } from './types';

// Anatomy of a standard line:
//   2026-07-10 09:46:42.942 DEBUG [tabs] TabDataStore - Save window data, ...
//   <timestamp>             <lvl> <cat>  <component>  - <message>
const LINE_RE =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) (DEBUG|INFO|WARNING|FATAL) \[([A-Za-z]+)\] (\S+) - (.*)$/;

/// Parse a single raw line. Lines that don't match the standard shape
/// (e.g. multi-line error continuations) are returned with only `raw` set.
export function parseLine(raw: string, index: number): LogLine {
  const m = LINE_RE.exec(raw);
  if (!m) return { index, raw };
  return {
    index,
    raw,
    timestamp: m[1],
    level: m[2] as LogLevel,
    category: m[3],
    component: m[4],
    message: m[5],
  };
}

/// Parse a whole log file's text into lines. A trailing empty line is dropped.
export function parseLog(text: string): LogLine[] {
  const rows = text.split(/\r?\n/);
  if (rows.length && rows[rows.length - 1] === '') rows.pop();
  return rows.map(parseLine);
}
