import { useEffect, useRef, useState } from 'react';

interface Props {
  all: string[];
  /// Currently-shown categories (checked). Every entry is a member of `all`.
  selected: string[];
  onChange: (next: string[]) => void;
}

/// A compact multi-select dropdown: a button that opens a checkbox panel with
/// "Select all" / "Clear all" shortcuts. Closes on outside click or Escape.
export function CategoryFilter({ all, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selectedSet = new Set(selected);
  const label =
    selected.length === all.length
      ? 'All'
      : selected.length === 0
        ? 'None'
        : `${selected.length} of ${all.length}`;

  const toggle = (cat: string) => {
    const next = new Set(selectedSet);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    // Preserve the canonical order rather than click order.
    onChange(all.filter((c) => next.has(c)));
  };

  return (
    <div className="multiselect" ref={ref}>
      <button
        type="button"
        className="multiselect-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Category: {label} <span className="caret">▾</span>
      </button>
      {open && (
        <div className="multiselect-panel">
          <div className="multiselect-actions">
            <button type="button" onClick={() => onChange([...all])} disabled={selected.length === all.length}>
              Select all
            </button>
            <button type="button" onClick={() => onChange([])} disabled={selected.length === 0}>
              Clear all
            </button>
          </div>
          <div className="multiselect-list">
            {all.map((cat) => (
              <label key={cat} className="multiselect-item">
                <input type="checkbox" checked={selectedSet.has(cat)} onChange={() => toggle(cat)} />
                {cat}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
