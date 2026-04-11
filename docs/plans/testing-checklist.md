# MD View — Testing Checklist

Run through every item before shipping. Test on Chrome (desktop), Firefox, Safari, and a real mobile device (or responsive mode).

---

## 1. File Input

### File Picker
- [ ] "Open File" button triggers system file picker
- [ ] Accepts `.md` files
- [ ] Accepts `.markdown` files
- [ ] Accepts `.txt` files
- [ ] Rejects non-text files gracefully (no crash, shows toast error)
- [ ] Cancelling the picker does nothing (no error, stays on current state)
- [ ] Opening a second file replaces the first

### Drag & Drop
- [ ] Dragging a file over the drop zone highlights the border
- [ ] Dropping a valid file renders it
- [ ] Dropping an invalid file shows a toast error
- [ ] Dragging out without dropping resets the border style
- [ ] Drag works on the full page, not just the drop zone box
- [ ] Multiple files dropped — only first is used (or shows error)

### Paste
- [ ] Pasting raw markdown text into the app renders it
- [ ] Pasting while already viewing a file replaces the content
- [ ] Pasting non-markdown text still renders (treated as plain text)
- [ ] Pasting an empty string does nothing

---

## 2. Markdown Rendering

### Basic Elements
- [ ] Headings h1 through h6 render with correct hierarchy
- [ ] h1 and h2 have subtle bottom borders
- [ ] Paragraphs render with proper spacing
- [ ] Bold and italic text render correctly
- [ ] Strikethrough text renders correctly
- [ ] Links render in violet accent color
- [ ] Links open in new tab (`target="_blank"`)
- [ ] Images render, max-width 100%, rounded corners
- [ ] Horizontal rules render as subtle borders

### GFM (GitHub Flavored Markdown)
- [ ] Tables render with clean grid lines
- [ ] Tables have alternating row tints
- [ ] Tables are horizontally scrollable on mobile
- [ ] Task lists render with styled checkboxes
- [ ] Autolinks render correctly
- [ ] Footnotes render if supported

### Code
- [ ] Inline code has background tint and rounded corners
- [ ] Fenced code blocks render with Shiki highlighting
- [ ] Code blocks have a copy button
- [ ] Copy button shows check icon on success, reverts after 2s
- [ ] Code blocks without a language hint still render (no crash)
- [ ] Long code lines are horizontally scrollable (no overflow)

### Blockquotes
- [ ] Blockquotes have left violet accent border
- [ ] Nested blockquotes render correctly

### Lists
- [ ] Ordered lists render with numbers
- [ ] Unordered lists render with bullets
- [ ] Nested lists indent properly

### Edge Cases
- [ ] Empty markdown file shows empty state or minimal content
- [ ] Very large file (1MB+) renders without freezing the UI
- [ ] File with only code blocks loads Shiki and highlights
- [ ] File with no code blocks does NOT load Shiki (check network tab)
- [ ] Malicious HTML in markdown is sanitized (no XSS)

---

## 3. Syntax Highlighting (Shiki)

- [ ] Default theme applies on first load
- [ ] All 10 themes selectable from the hamburger menu picker
- [ ] Changing theme updates all code blocks immediately
- [ ] Theme choice persists after page reload (localStorage)
- [ ] Theme works correctly in both light and dark mode
- [ ] Only detected languages are loaded (check network tab)
- [ ] Code blocks render correctly while Shiki is still loading (fallback)

---

## 4. Theme (Light/Dark Mode)

- [ ] Defaults to system preference on first visit
- [ ] Manual toggle in hamburger menu switches theme
- [ ] Toggle persists after page reload (localStorage)
- [ ] All text, backgrounds, borders update smoothly (150ms transition)
- [ ] Accent colors correct in both modes (violet-600 light, violet-400 dark)
- [ ] Code blocks respect the current color mode
- [ ] No flash of wrong theme on page load (FOUC)
- [ ] Meta theme-color updates when theme changes

---

## 5. Header & Navigation

- [ ] Header is fixed at top, stays visible on scroll
- [ ] Logo displays on the left
- [ ] Filename shows in center, truncates on small screens
- [ ] Hamburger icon on the right opens the Sheet menu
- [ ] No filename shown when in empty/landing state

---

## 6. Sheet Menu (Hamburger)

- [ ] Slides in from the right with spring easing animation
- [ ] Contains: theme toggle, syntax theme picker, Export PDF, Export Text, Open New File
- [ ] Clicking outside or pressing Escape closes the sheet
- [ ] All menu items are functional
- [ ] "Open New File" returns to the drop zone / triggers file picker
- [ ] Sheet is keyboard navigable (Tab, Enter, Escape)

---

## 7. Right-Click Context Menu

- [ ] Right-clicking on the markdown content area opens the context menu
- [ ] Items: Copy selection, Export as PDF, Export as Text, Open New File
- [ ] "Copy selection" copies currently selected text to clipboard
- [ ] "Copy selection" is disabled/hidden when nothing is selected
- [ ] Context menu has fade + Y-translate animation on open
- [ ] Context menu closes on click outside or Escape
- [ ] Does NOT interfere with native context menu on other areas (header, drop zone)

---

## 8. Export — PDF

- [ ] "Export as PDF" triggers jspdf export
- [ ] jspdf is lazy-loaded (check network tab — not in initial bundle)
- [ ] PDF contains selectable text (not an image)
- [ ] PDF filename matches original file: `{name}.pdf`
- [ ] Headings, paragraphs, code blocks, lists appear in PDF
- [ ] PDF generates for a large file without crashing
- [ ] Toast shows success message after export
- [ ] Export works offline

---

## 9. Export — Plain Text

- [ ] "Export as Text" downloads a `.txt` file
- [ ] Text file strips markdown formatting
- [ ] Filename matches original: `{name}.txt`
- [ ] Download works via Blob + URL.createObjectURL
- [ ] Export works offline

---

## 10. PWA & Offline

### Installation
- [ ] "Install app" prompt appears in supported browsers
- [ ] App installs and opens in standalone mode
- [ ] App icon shows the custom thunder+doc logo
- [ ] App name shows "MD View" in app switcher / home screen

### Manifest
- [ ] `name`: "MD View — Markdown Viewer"
- [ ] `short_name`: "MD View"
- [ ] `theme_color`: "#7c3aed"
- [ ] Icons at 192x192 and 512x512 are present and correct

### Offline
- [ ] After first visit, disconnect network
- [ ] App loads fully offline (app shell, styles, scripts)
- [ ] Can open a file and render markdown offline
- [ ] Can export to PDF offline
- [ ] Can export to text offline
- [ ] Can change Shiki theme offline (if languages/themes were cached)
- [ ] Can toggle light/dark mode offline

### Service Worker
- [ ] Service worker registers on first visit
- [ ] App shell is precached
- [ ] Shiki WASM/theme files use CacheFirst strategy
- [ ] New version of the app updates the service worker

---

## 11. Micro-Interactions & Animations

- [ ] Buttons: gentle scale-down (0.97) on press, spring-back on release
- [ ] Drop zone: border color animates on drag-over
- [ ] Drop zone: subtle scale pulse on valid file drop
- [ ] Sheet menu: slides in with spring easing (not linear)
- [ ] Context menu: fade + slight Y-translate on open (150ms)
- [ ] Code copy button: check icon morphs in on success
- [ ] Theme toggle: smooth color transition on all themed elements
- [ ] Toast: slides up + fades in
- [ ] File load: content area fades in after markdown is parsed
- [ ] Hover states: subtle background tint transitions (100ms)
- [ ] Page transition: fade between empty and viewing states (200ms)
- [ ] `prefers-reduced-motion: reduce` disables all non-essential animations

---

## 12. Primitive Components

- [ ] No raw `<div>` in any component — all use `Box`
- [ ] No raw `<p>`/`<span>` — all use `Text`
- [ ] No raw `<h1>`-`<h6>` — all use `Title` with `level` prop
- [ ] `Box` `as` prop works (renders as different elements)
- [ ] `Text` `as` prop works
- [ ] `Stack` renders flex column with consistent gap
- [ ] `HStack` renders flex row with consistent gap
- [ ] `Icon` wraps SVGs consistently
- [ ] All primitives forward refs correctly
- [ ] All primitives accept and merge `className`

---

## 13. Mobile

- [ ] All tap targets are at least 44x44px
- [ ] Bottom safe-area padding on notched phones (`env(safe-area-inset-bottom)`)
- [ ] No hover-dependent interactions (everything works with tap)
- [ ] Content is readable without horizontal scrolling
- [ ] Code blocks scroll horizontally within their container
- [ ] Tables scroll horizontally within their container
- [ ] File picker works on iOS Safari
- [ ] File picker works on Android Chrome
- [ ] Drag & drop degrades gracefully on mobile (picker is primary)
- [ ] Sheet menu is easy to dismiss on touch
- [ ] Smooth scrolling performance on content area

---

## 14. Accessibility

- [ ] All interactive elements are keyboard navigable
- [ ] Focus rings visible on Tab navigation
- [ ] Sheet, context menu, and toasts have proper ARIA attributes
- [ ] Images have alt text (from markdown)
- [ ] Color contrast meets WCAG AA in both light and dark mode
- [ ] Screen reader can navigate rendered markdown headings
- [ ] Skip-to-content link or logical focus order

---

## 15. Meta Tags & SEO

- [ ] `<title>` is "MD View — Markdown Viewer"
- [ ] `<meta name="description">` is present and descriptive
- [ ] `<meta name="theme-color">` is `#7c3aed`
- [ ] `<meta name="viewport">` includes `viewport-fit=cover`
- [ ] `<meta property="og:title">` is present
- [ ] `<meta property="og:description">` is present
- [ ] `<meta property="og:type">` is "website"
- [ ] `<link rel="manifest">` points to valid manifest
- [ ] Favicon is the custom thunder+doc SVG

---

## 16. Performance

- [ ] Initial bundle < 60KB gzipped (before lazy chunks)
- [ ] Shiki is NOT in the initial bundle (lazy-loaded)
- [ ] jspdf is NOT in the initial bundle (lazy-loaded)
- [ ] LCP < 1.5s on simulated 3G (Lighthouse)
- [ ] No layout shifts on file load (CLS ~ 0)
- [ ] No jank on scroll through long markdown
- [ ] Memory usage stable after opening multiple files sequentially

---

## 17. Cross-Browser

- [ ] Chrome (desktop) — all features work
- [ ] Firefox — all features work (File System Access API may not be available, fallback works)
- [ ] Safari — all features work (File System Access API fallback)
- [ ] Edge — all features work
- [ ] Chrome Android — file picker, rendering, exports
- [ ] Safari iOS — file picker, rendering, exports

---

## Sign-off

- [ ] All items above pass
- [ ] No console errors or warnings in production build
- [ ] `npm run build` succeeds without errors
- [ ] Lighthouse PWA score: 100
- [ ] Lighthouse Performance score: > 90
- [ ] Lighthouse Accessibility score: > 90
