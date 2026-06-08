# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check (tsc -b) then build for production
npm run lint      # ESLint over the repo
npm run preview   # Build, then serve via wrangler dev (Cloudflare runtime)
npm run deploy    # Build, then deploy to Cloudflare Workers
```

There is no test suite. `npm run build` runs `tsc -b` first, so type errors fail the build — use it to verify type correctness.

## Architecture

MD View is a **fully client-side** Progressive Web App for viewing/editing Markdown. Files never leave the device; there is no backend logic. Cloudflare Workers (`wrangler.jsonc`, `@cloudflare/vite-plugin`) only serves the static SPA build — `not_found_handling: single-page-application`.

### State model: everything lives in `App.tsx`

`App.tsx` is the single source of truth. It holds an array of `Tab` objects (see the `Tab` type) and one `activeTabId`. There is no router and no global state library — all handlers (`handleOpenFile`, `handleSave`, `handleToggleEdit`, tab CRUD, keyboard shortcuts, etc.) are defined here and passed down as props.

Key conventions in `App.tsx`:
- **Refs mirror state to avoid stale closures.** `markdownRef`, `activeTabRef`, and `tabsRef` are reassigned on every render so event handlers and async callbacks read current values. When adding handlers that fire from listeners or promises, read from these refs, not the state variables.
- **Persistence is localStorage-only.** Tabs are serialized to `md-view-tabs` / `md-view-active-tab` on every change. `FileSystemFileHandle`s are **not** serializable and are stripped before saving (`StoredTab` omits `fileHandle`), so handles are lost on reload — only the markdown text survives.
- A tab with `markdown == null` is an "empty" tab; opening a file reuses it instead of spawning a new one.
- `MAX_TABS = 30` is enforced in every tab-creating handler.

### Three view modes per tab

The active tab renders as one of: `MarkdownView` (read), `MarkdownEditor` (edit), or `SplitView` (both), selected by the `editing` / `splitView` booleans on the tab. `editing` and `splitView` are mutually exclusive (toggling one clears the other). Each view is keyed by `activeTab.id` to force remount on tab switch.

### Markdown rendering pipeline

- **On-screen** (`MarkdownView.tsx`): `react-markdown` + `remark-gfm` + `rehype-slug`, with custom component overrides mapping HTML elements to the `primitives` and themed Tailwind classes.
- **PDF export** (`lib/export-pdf.ts`): a *separate* pipeline using `unified`/`remark`/`rehype-stringify` to build standalone HTML, rendered off-screen and captured via `html2canvas` → `jsPDF`. Mermaid blocks are rendered to PNG. Inline CSS lives in `buildStyledContainer` (A4 = 794px @ 96dpi) — keep PDF styling in sync here, it does not share styles with the on-screen view.
- **Text export** (`lib/export-text.ts`): strips Markdown formatting.

Export modules are **lazy-loaded** via dynamic `import()` inside the handlers to keep `jsPDF`/`html2canvas`/`unified` out of the main bundle.

### Syntax highlighting (Shiki)

`useShiki.ts` lazy-loads Shiki only when the document contains code blocks (`hasCodeBlocks` regex check). Themes and languages are loaded on demand; `themeVersion` is bumped to force re-highlighting when the theme changes without recreating the highlighter. The selected Shiki theme is independent of the app light/dark theme and persists under `md-view-shiki-theme`. Shiki WASM/JSON assets are runtime-cached by the service worker (`CacheFirst`, see `vite.config.ts`).

### File System Access integration

The app progressively enhances with the File System Access API:
- `App.tsx` uses `showOpenFilePicker`/`showSaveFilePicker` when available, falling back to a hidden `<input type=file>` and blob download otherwise.
- `useRecentFiles.ts` stores file *metadata* in localStorage but the actual `FileSystemFileHandle`s in **IndexedDB** (`md-view-db` / `file-handles`), since handles survive there but not in localStorage. Reopening a recent file re-requests permission on the stored handle.
- `useFileWatcher.ts` polls the active file's handle for external changes (live-reload), enabled only when the tab has a handle and is not dirty/editing/split.
- `window.launchQueue` (File Handling API) handles files opened via OS file association — registered in the PWA manifest's `file_handlers` in `vite.config.ts`.

### UI layer

- **Primitives** (`components/primitives/`): `Box`, `Stack`, `HStack`, `Text`, `Title`, `Icon` — thin layout/typography wrappers. Prefer these over raw divs for layout, matching existing components.
- **shadcn/ui** components live in `components/ui/` (built on `@base-ui/react`). `cn()` from `lib/utils.ts` merges classes.
- Tailwind CSS 4 via `@tailwindcss/vite`; theme tokens and light/dark + accent-color variables are in `src/index.css`. Theme/accent state is managed by `useTheme.ts` and `useAccentColor.ts`.
- The `@/` alias maps to `src/`.

### Build specifics

- **React Compiler is enabled** (`babel-plugin-react-compiler` via `@rolldown/plugin-babel` in `vite.config.ts`). Components are auto-memoized — avoid manual `useMemo`/`useCallback` micro-optimizations unless there's a measured reason, and follow the Rules of React so the compiler can optimize safely.
- `vite-plugin-pwa` with `registerType: 'prompt'` — updates are surfaced via `useServiceWorker.ts` and `UpdateBanner`, not auto-applied.
