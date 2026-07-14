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
  const [query, setQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => filterLines(lines, { level, category }),
    [lines, level, category]
  );

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

  // Scroll to the active match whenever it changes.
  useEffect(() => {
    if (currentMatchRow >= 0) {
      virtualizer.scrollToIndex(currentMatchRow, { align: 'center' });
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

  const commitSearch = useCallback(() => {
    setCommittedQuery(query);
    setCurrentMatch(0);
  }, [query]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!matches.length) return;
      setCurrentMatch((c) => (c + dir + matches.length) % matches.length);
    },
    [matches.length]
  );

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (query !== committedQuery) commitSearch();
      else step(e.shiftKey ? -1 : 1);
    }
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
        <button onClick={() => fileInputRef.current?.click()}>Open log…</button>
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
          Level
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

        <div className="search">
          <input
            type="text"
            placeholder="Search text…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

        <div className="spacer" />
        <span className="meta">
          {fileName
            ? `${fileName} — ${filtered.length.toLocaleString()} / ${lines.length.toLocaleString()} lines`
            : ''}
        </span>
      </div>

      <div className="viewport" ref={scrollRef}>
        {lines.length === 0 ? (
          <div className={`empty ${dragOver ? 'drag' : ''}`}>
            Drop a log file here, or click <em>Open log…</em>
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
