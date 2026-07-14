# Log Viewer

A bespoke viewer for Firefox iOS device logs. Runs as a standalone macOS app
(via [Tauri](https://tauri.app)) and as a plain web page — both share the same
UI and parsing core.

## Features

- **Syntax highlighting** of each line's anatomy: timestamp, level, `[category]`,
  component, and message — plus keyword hotspots (crash/watchdog terms, lifecycle
  transitions, sync/AppServices, tab counts). Rules mirror the klogg highlighter set.
- **Level filter** dropdown (DEBUG / INFO / WARNING / FATAL).
- **Category filter** dropdown, populated from the canonical
  `LoggerCategory.swift` list.
- **Search bar** that *navigates* to matching lines: Enter jumps to the next
  match (Shift+Enter previous), the hit is highlighted, and the row scrolls into
  view. Shows `current/total` match count.
- **Single-line selection**: click a line to select+highlight it; click it again
  (or another line) to deselect. Only one line is selected at a time.
- **Virtualized rendering** so large logs (tens of thousands of lines) stay smooth.
- Load a file via the **Open log…** button or by **dropping** it on the window.

## Tech

- **React + Vite + TypeScript** frontend.
- **Tauri v2** desktop shell (tiny native app using the system WebView).
- `src/core/` is framework-agnostic TypeScript (parser, highlight rules, filter,
  search) reused unchanged by the desktop app and any web deployment.

## Develop

```bash
npm install
npm run dev          # web app at http://localhost:5173
npm run tauri:dev    # native macOS window (hot-reloads the same UI)
```

## Build

```bash
npm run build        # static web bundle in dist/  (host anywhere)
npm run tauri:build  # macOS .app + .dmg in src-tauri/target/release/bundle/
```

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
    LogRow.tsx     one virtualized, highlighted row
  App.tsx          toolbar, dropdowns, search nav, virtualized list, selection
src-tauri/         Tauri desktop shell
```

## Reusing on the web

The web build (`npm run build`) is a self-contained static site — deploy `dist/`
as-is. To embed the viewer inside an existing page instead, import from
`src/core/*` (parsing + highlighting are DOM-free) and reuse `LogRow`/`App`, or
lift the toolbar + virtualized list into your own component.

## Keeping categories in sync

`src/core/categories.ts` mirrors
`firefox-ios/BrowserKit/Sources/Common/Logger/LoggerCategory.swift`. If that enum
changes, update the list here (kept alphabetical).
