import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LogLevel, LogLine } from './core/types';
import { LOG_LEVELS } from './core/types';
import { LOG_CATEGORIES } from './core/categories';
import { parseLog } from './core/parser';
import { filterLines, findMatches } from './core/search';
import { LogRow } from './components/LogRow';
import './App.css';

const ROW_HEIGHT = 20;

export default function App() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [fileName, setFileName] = useState('');
  const [level, setLevel] = useState<LogLevel | ''>('');
  const [category, setCategory] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => filterLines(lines, { level, category, from, to }),
    [lines, level, category, from, to]
  );

  // Earliest/latest timestamps in the file, as `datetime-local` values, used to
  // bound the range pickers. Log timestamps are lexicographically sortable, so
  // plain string min/max works.
  const timeBounds = useMemo(() => {
    let min = '';
    let max = '';
    for (const l of lines) {
      if (!l.timestamp) continue;
      if (!min || l.timestamp < min) min = l.timestamp;
      if (!max || l.timestamp > max) max = l.timestamp;
    }
    const toInput = (ts: string) => (ts ? ts.replace(' ', 'T').slice(0, 19) : '');
    return { min: toInput(min), max: toInput(max) };
  }, [lines]);

  // Match positions are indices into `filtered`.
  const matches = useMemo(
    () => findMatches(filtered, committedQuery),
    [filtered, committedQuery]
  );

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 24,
  });

  const currentMatchRow = matches.length
    ? matches[Math.min(currentMatch, matches.length - 1)]
    : -1;

  // Scroll to the active match whenever it changes, and select its line so the
  // current hit is highlighted just like a clicked row.
  useEffect(() => {
    if (currentMatchRow >= 0) {
      virtualizer.scrollToIndex(currentMatchRow, { align: 'center' });
      const line = filtered[currentMatchRow];
      if (line) setSelectedIndex(line.index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatchRow]);

  const loadFile = useCallback(async (file: File) => {
    const text = await file.text();
    setLines(parseLog(text));
    setFileName(file.name);
    setSelectedIndex(null);
    setCurrentMatch(0);
  }, []);

  // Prefill the range pickers with the file's first/last timestamp whenever a
  // new file is loaded. Keyed on the bounds, which only change with `lines`.
  useEffect(() => {
    setFrom(timeBounds.min);
    setTo(timeBounds.max);
  }, [timeBounds.min, timeBounds.max]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!matches.length) return;
      setCurrentMatch((c) => (c + dir + matches.length) % matches.length);
    },
    [matches.length]
  );

  // Search runs live on every change, so `query` and `committedQuery` stay in
  // sync; Enter just steps between the existing matches.
  const onSearchChange = useCallback((value: string) => {
    setQuery(value);
    setCommittedQuery(value);
    setCurrentMatch(0);
  }, []);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') step(e.shiftKey ? -1 : 1);
  };

  const onSelect = useCallback((index: number) => {
    setSelectedIndex((cur) => (cur === index ? null : index));
  }, []);

  const items = virtualizer.getVirtualItems();

  return (
    <div
      className="app"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) loadFile(f);
      }}
    >
      <div className="toolbar">
        <div className="toolbar-row">
          <button className="open-btn" onClick={() => fileInputRef.current?.click()}>
            Open Log…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
            }}
          />

          <label>
            Min level
            <select value={level} onChange={(e) => setLevel(e.target.value as LogLevel | '')}>
              <option value="">All</option>
              {LOG_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {LOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="spacer" />
          <span className="meta">
            {fileName
              ? `${fileName} — ${filtered.length.toLocaleString()} / ${lines.length.toLocaleString()} lines`
              : ''}
          </span>
        </div>

        <div className="toolbar-row">
          <label>
            From
            <input
              type="datetime-local"
              step="1"
              value={from}
              min={timeBounds.min}
              max={timeBounds.max}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label>
            To
            <input
              type="datetime-local"
              step="1"
              value={to}
              min={timeBounds.min}
              max={timeBounds.max}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>

          {(from || to) && (
            <button
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              title="Clear date range"
            >
              Clear dates
            </button>
          )}
        </div>

        <div className="toolbar-row">
          <div className="search">
            <input
              type="text"
              placeholder="Search text…"
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKey}
            />
            <button onClick={() => step(-1)} disabled={!matches.length} title="Previous (Shift+Enter)">
              ↑
            </button>
            <button onClick={() => step(1)} disabled={!matches.length} title="Next (Enter)">
              ↓
            </button>
            <span className="count">
              {committedQuery
                ? matches.length
                  ? `${currentMatch + 1}/${matches.length}`
                  : '0/0'
                : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="viewport" ref={scrollRef}>
        {lines.length === 0 ? (
          <div className={`empty ${dragOver ? 'drag' : ''}`}>
            Drop a log file here, or click <em>Open Log…</em>
          </div>
        ) : (
          <div className="rows" style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {items.map((vi) => {
              const line = filtered[vi.index];
              return (
                <LogRow
                  key={line.index}
                  line={line}
                  selected={selectedIndex === line.index}
                  isCurrentMatch={vi.index === currentMatchRow}
                  query={committedQuery}
                  onSelect={onSelect}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${vi.start}px)`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
