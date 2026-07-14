import { memo, useMemo } from 'react';
import type { LogLine } from '../core/types';
import { applySearch, highlightSegments } from '../core/highlight';

interface Props {
  line: LogLine;
  selected: boolean;
  isCurrentMatch: boolean;
  query: string;
  style: React.CSSProperties;
  onSelect: (index: number) => void;
}

function LogRowImpl({ line, selected, isCurrentMatch, query, style, onSelect }: Props) {
  const segments = useMemo(
    () => applySearch(highlightSegments(line), query),
    [line, query]
  );

  const cls = ['row'];
  if (line.level === 'WARNING') cls.push('lvl-warning');
  if (line.level === 'FATAL') cls.push('lvl-fatal');
  if (selected) cls.push('selected');
  if (isCurrentMatch) cls.push('current-match');

  return (
    <div
      className={cls.join(' ')}
      style={style}
      onClick={() => onSelect(line.index)}
      title={`line ${line.index + 1}`}
    >
      <span className="gutter">{line.index + 1}</span>
      <span className="content">
        {segments.map((s, i) => (
          <span key={i} className={s.cls}>
            {s.text}
          </span>
        ))}
      </span>
    </div>
  );
}

export const LogRow = memo(LogRowImpl);
