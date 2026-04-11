# MD View — Design Document

## Overview

MD View is a sleek, lightweight Progressive Web App for viewing Markdown files on any device. Users open local `.md` files via the system file picker, drag & drop, or paste raw markdown. The app renders it beautifully with VS Code-quality syntax highlighting, and can export to PDF (selectable text) or plain text. Fully offline, fully private — files never leave the device.

Public deployment. Mobile-first, desktop-friendly.

## Tech Stack

- React 19 + TypeScript + Vite 8 (with React Compiler)
- Tailwind CSS 4 + shadcn/ui components
- `react-markdown` + `remark-gfm` (tables, strikethrough, task lists)
- `rehype-shiki` for syntax highlighting (lazy-loaded)
- `jspdf` for text-based PDF export (lazy-loaded)
- `vite-plugin-pwa` for service worker + offline caching

## Primitive Components

Reusable semantic primitives instead of raw HTML elements:

| Component | Renders as | Purpose |
|-----------|-----------|---------|
| `Box` | `<div>` (polymorphic via `as` prop) | Layout container, replaces all raw divs |
| `Text` | `<p>` (polymorphic) | Body text, captions, labels |
| `Title` | `<h1>`-`<h6>` via `level` prop | All headings |
| `Input` | `<input>` | Form inputs (extends shadcn Input) |
| `Stack` | `<div>` with flex column | Vertical layout with gap |
| `HStack` | `<div>` with flex row | Horizontal layout with gap |
| `Icon` | `<svg>` | Wraps all SVG icons |

All primitives accept `className` for Tailwind overrides and forward refs.

## File Structure

```
src/
  components/
    primitives/
      Box.tsx
      Text.tsx
      Title.tsx
      Stack.tsx
      HStack.tsx
      Icon.tsx
    ui/              <- shadcn components
      button.tsx
      context-menu.tsx
      sheet.tsx
      select.tsx
      toast.tsx
      dropdown-menu.tsx
      sonner.tsx
    Header.tsx       <- app bar: logo, filename, hamburger menu
    DropZone.tsx     <- landing state: file picker + drag/drop + paste
    MarkdownView.tsx <- rendered markdown display
    CodeBlock.tsx    <- shiki-powered code block with copy button
    ThemePicker.tsx  <- shiki theme selector in hamburger menu
  hooks/
    useFileReader.ts <- File System Access API + fallback
    useTheme.ts      <- light/dark mode + localStorage persistence
    useShiki.ts      <- lazy shiki highlighter initialization
  lib/
    export-pdf.ts    <- lazy jspdf export logic
    export-text.ts   <- plain text download
    utils.ts         <- cn() helper
    animations.ts    <- shared transition/animation config
  App.tsx
  main.tsx
  index.css
public/
  favicon.svg        <- custom MD View icon
  og-image.png       <- Open Graph preview image
```

## UI States

### Empty State (Landing)

Centered drop zone. Full page is the drag target. Contents:
- MD View logo + "MD View" title
- Large "Open File" button (system file picker)
- Muted helper text: "or drag a file here, or paste markdown"
- Subtle dashed border on the drop zone, highlights on drag-over

### Viewing State

- **Header** (fixed, slim): Left: MD View logo. Center: filename (truncated on mobile). Right: hamburger icon.
- **Sheet menu** (slides from right): Theme toggle (light/dark), Shiki syntax theme picker (Select with ~10 popular themes), Export PDF, Export Text, Open New File.
- **Content area**: Scrollable, max-width 720px prose container, generous padding for mobile reading comfort.
- **Right-click context menu** (ContextMenu): Copy selection, Export as PDF, Export as Text, Open New File.

## Visual Direction — Soft Editorial

### Light Mode
- Background: `stone-50` (#fafaf9)
- Text primary: `stone-900` (#1c1917)
- Text secondary: `stone-500` (#78716c)
- Borders: `stone-200` (#e7e5e4)
- Accent: `violet-600` (#7c3aed)
- Accent background: `violet-50` (#f5f3ff)

### Dark Mode
- Background: `stone-950` (#0c0a09)
- Text primary: `stone-100` (#f5f5f4)
- Text secondary: `stone-400` (#a8a29e)
- Borders: `stone-800` (#292524)
- Accent: `violet-400` (#a78bfa)
- Accent background: `violet-950` (#2e1065)

### Typography
- Body: system-ui stack, 16px/1.7
- Headings: same stack, semibold, tighter line-height
- Code: ui-monospace, 'Cascadia Code', 'Fira Code', monospace

### Micro-interactions & Animations
- **Page transitions**: Fade-in on state change (empty <-> viewing), 200ms ease-out
- **Drop zone**: Border color animates on drag-over, subtle scale pulse on valid drop
- **Buttons**: Gentle scale-down on press (0.97), spring-back on release
- **Sheet menu**: Slides in with slight spring easing (not linear)
- **Context menu**: Fade + slight Y-translate on open (150ms)
- **Code copy button**: Check icon morphs in on success, fades back after 2s
- **Theme toggle**: Smooth color transitions on all themed elements (150ms)
- **Toast notifications**: Slide up + fade in, auto-dismiss with progress
- **File load**: Content area fades in after markdown is parsed
- **Hover states**: Subtle background tint transitions (100ms)

All animations use CSS transitions/Tailwind `transition-*` utilities. No animation library needed. Respect `prefers-reduced-motion` — disable all non-essential animations.

## Markdown Rendering

### react-markdown + remark-gfm
- Tables with clean grid lines and alternating row tints
- Task lists with styled checkboxes
- Strikethrough, autolinks

### Content Styling
- h1/h2: subtle bottom border
- Blockquotes: left violet accent border
- Code blocks: rounded, soft background, Shiki theme
- Inline code: slight background tint, rounded
- Links: violet accent, underline on hover
- Images: max-width 100%, rounded corners
- Horizontal rules: subtle stone border

### Shiki Integration
- Lazy-load highlighter only when code blocks exist
- Load only detected languages (not full bundle)
- Popular user-selectable themes: github-dark, github-light, one-dark-pro, dracula, nord, vitesse-dark, vitesse-light, tokyo-night, catppuccin-mocha, min-light
- Theme choice persisted to localStorage

## Export

### PDF (jspdf)
- Lazy-loaded on export click
- Text-based output (selectable, searchable)
- Maps markdown structure to PDF: headings, paragraphs, code blocks, lists
- Respects current theme colors
- Filename: `{original-name}.pdf`

### Plain Text
- Strips markdown formatting
- Downloads as `{original-name}.txt`
- Uses Blob + URL.createObjectURL

## PWA & Offline

### vite-plugin-pwa
- Precache: app shell, CSS, JS bundles
- Runtime cache: Shiki language/theme WASM files (CacheFirst)
- Full offline — works without network after first visit

### Manifest
- `name`: "MD View — Markdown Viewer"
- `short_name`: "MD View"
- `theme_color`: "#7c3aed"
- `background_color`: "#fafaf9"
- `display`: "standalone"
- Icons: 192x192, 512x512 (generated from custom SVG)

### Meta Tags
```html
<title>MD View — Markdown Viewer</title>
<meta name="description" content="A sleek PWA to view, highlight, and export Markdown files on any device.">
<meta name="theme-color" content="#7c3aed">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta property="og:title" content="MD View — Markdown Viewer">
<meta property="og:description" content="View Markdown beautifully on any device. Offline-ready.">
<meta property="og:type" content="website">
```

## File Handling

1. **File picker**: `<input type="file" accept=".md,.markdown,.txt">` (universal)
2. **Enhanced**: File System Access API where available (Chrome/Edge)
3. **Drag & drop**: `onDragOver`/`onDrop` on root element
4. **Paste**: `onPaste` listener reads clipboard text

## Performance Budget

- **Critical path** (~50KB gzipped): React, react-markdown, remark-gfm, Tailwind, shadcn, app shell
- **Lazy chunks**: Shiki (~100KB, only when code blocks detected), jspdf (~100KB, only on export)
- **Target**: LCP < 1.5s, TTI < 2s on 3G
