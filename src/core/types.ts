// Framework-agnostic types shared by the desktop app and the (future) web page.

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'FATAL';

export const LOG_LEVELS: LogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'FATAL'];

/// One parsed log line. `index` is the stable 0-based position in the source
/// file and is used as the selection identity (survives filtering).
export interface LogLine {
  index: number;
  raw: string;
  timestamp?: string;
  level?: LogLevel;
  category?: string;
  component?: string;
  message?: string;
}

/// A slice of a rendered line tagged with a highlight class.
export interface Segment {
  text: string;
  cls: string;
}
