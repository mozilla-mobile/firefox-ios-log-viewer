# Log Viewer

A bespoke viewer for Firefox iOS device logs. It builds to a **single
self-contained HTML file** you can open directly in any browser — no install,
no server. The UI follows the GitHub design language and matches your system
light/dark setting.

## Features

- **Syntax highlighting** of each line's anatomy: timestamp, level, `[category]`,
  component, and message — plus keyword hotspots (crash/watchdog terms, lifecycle
  transitions, sync/AppServices, tab counts). Rules mirror the klogg highlighter set.
- **Min-level filter** (DEBUG / INFO / WARNING / FATAL) — shows the selected
  level and everything more severe.
- **Category multi-select**, populated from the canonical `LoggerCategory.swift`
  list, with Select all / Clear all.
- **Date range** From/To pickers, prefilled to the log's full time span with a
  Reset dates button.
- **Live search** that *navigates* to matching lines: it searches as you type,
  Enter jumps to the next match (Shift+Enter previous), the hit is highlighted,
  and the row scrolls into view. Shows `current/total` match count.
- **Single-line selection**: click a line to select+highlight it; click it again
  (or another line) to deselect. Only one line is selected at a time.
- **Virtualized rendering** so large logs (tens of thousands of lines) stay smooth.
- Load a file via the **Open Log…** button or by **dropping** it on the window.

## Tech

- **React + Vite + TypeScript**, bundled into one HTML file via
  `vite-plugin-singlefile`.
- `src/core/` is framework-agnostic TypeScript (parser, highlight rules, filter,
  search), DOM-free and reusable in any web deployment.

## Develop

```bash
npm install
npm run dev          # dev server with hot reload
```

## Build

```bash
npm run build        # single self-contained dist/index.html — open it directly
```

Releases are published from CI (Actions → **Build & Release**), which attaches
the built HTML file to a GitHub Release.

## Project layout

```
src/
  core/            framework-agnostic, reusable
    types.ts       LogLine / LogLevel / Segment
    categories.ts  category list (mirror of LoggerCategory.swift)
    parser.ts      raw text -> LogLine[]
    highlight.ts   LogLine -> highlight Segments (+ search overlay)
    search.ts      level/category filter + text match positions
  components/
    LogRow.tsx        one virtualized, highlighted row
    CategoryFilter.tsx category multi-select dropdown
  App.tsx          toolbar, filters, search nav, virtualized list, selection
```

## Reusing on the web

The build (`npm run build`) is a single self-contained `dist/index.html` — host
it anywhere or just open the file. To embed the viewer inside an existing page
instead, import from `src/core/*` (parsing + highlighting are DOM-free) and
reuse `LogRow`/`App`, or lift the toolbar + virtualized list into your own
component.

## Keeping categories in sync

`src/core/categories.ts` mirrors
`firefox-ios/BrowserKit/Sources/Common/Logger/LoggerCategory.swift`. If that enum
changes, update the list here (kept alphabetical).
