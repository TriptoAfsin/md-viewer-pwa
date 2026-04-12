# Multi-Tab Support Design

## Overview

Add multi-tab support to MD View so users can have up to 10 markdown files open simultaneously. Desktop gets a browser-style tab bar; mobile gets a Chrome-style card grid switcher.

## Data Model

Replace the current flat state (`markdown`, `filename`, `fileHandle`, `editing`) with a tab array:

```ts
type Tab = {
  id: string                              // crypto.randomUUID()
  markdown: string | null                 // file content
  filename: string | null                 // display name
  fileHandle: FileSystemFileHandle | null // for save
  editing: boolean                        // per-tab edit/preview
  dirty: boolean                          // true if edited since last save
  scrollPosition: number                  // preserved on tab switch
}
```

App-level state:

```ts
const [tabs, setTabs] = useState<Tab[]>([])
const [activeTabId, setActiveTabId] = useState<string | null>(null)
const [mobileTabsOpen, setMobileTabsOpen] = useState(false)
// shikiTheme stays global
```

Derived: `const activeTab = tabs.find(t => t.id === activeTabId) ?? null`

Max 10 tabs enforced at every entry point.

## Key Behaviors

- **Opening a file** always creates a new tab (never replaces current)
- **Home button** navigates to DropZone (`activeTabId = null`) but keeps all tabs alive
- **Closing a dirty tab** shows inline confirmation before closing
- **Closing the last tab** returns to DropZone
- **Tab bar** only appears when 2+ tabs are open
- **Scroll position** saved on tab switch, restored on return

## Desktop Tab Bar (`TabBar.tsx`)

Sticky horizontal bar below the Header (`top-14`, `h-9`), same backdrop blur style. Only rendered when `tabs.length >= 2` on `sm+` screens.

Each tab item shows:
- FileText icon + truncated filename (max ~180px)
- Dirty dot indicator when unsaved
- X close button (hover on inactive, always visible on active)
- Active tab: `bg-muted/50 border-b-2 border-primary`

A "+" button at the end opens a new file. Overflow handled by `overflow-x-auto` with hidden scrollbar. New active tabs scroll into view automatically.

## Mobile Tab Switcher (`MobileTabSwitcher.tsx`)

Two pieces:

**Pill badge** in Header's left section (hidden on `sm+`): shows tab count when 2+ tabs. Tapping opens the overlay.

**Full-screen overlay** using Sheet (`side="bottom"`, `h-[100dvh]`):
- Top bar: "{n} tabs" label, "+" button, "Done" button
- 2-column card grid (`grid-cols-2 gap-3 p-4 overflow-y-auto`)
- Each card: filename, dirty dot, preview snippet (first ~100 chars, `line-clamp-4`), X close button
- Active card: `border-primary`; inactive: `border-border`
- Tap card = switch + close overlay

## Handler Changes

| Handler | Change |
|---|---|
| `handleFileContent` | Creates new tab (enforces max 10), sets active |
| `handleEditorChange` | Updates active tab's markdown, sets `dirty: true` |
| `handleToggleEdit` | Toggles active tab's `editing` |
| `handleSave/SaveAs` | Operates on active tab, resets `dirty: false` |
| `handleGoHome` | Sets `activeTabId = null`, tabs stay alive |
| `handleCloseTab(id)` | Dirty confirmation if needed, remove tab, switch to adjacent |
| `handleSwitchTab(id)` | Save scroll position, switch `activeTabId`, restore scroll |

## Keyboard Shortcuts

- `Ctrl+Tab` / `Ctrl+Shift+Tab` — cycle through tabs
- `Ctrl+W` — close active tab (with dirty confirmation)
- `Ctrl+T` — open new file in new tab

## Component Impact

| File | Change |
|---|---|
| `App.tsx` | Major refactor — new state model, all handlers, JSX layout |
| `Header.tsx` | Minor — add `tabCount` prop, mobile pill badge |
| `TabBar.tsx` | New file |
| `MobileTabSwitcher.tsx` | New file |
| `MarkdownView.tsx` | None — `key={activeTab.id}` handles remount |
| `MarkdownEditor.tsx` | None — same key-based remount |
| `DropZone.tsx` | None — `onFileContent` routes through App |

## Implementation Order

1. Define `Tab` type, refactor App.tsx state — single tab works identically to before
2. Create `TabBar.tsx`, wire into App.tsx — desktop multi-tab works
3. Create `MobileTabSwitcher.tsx`, add pill badge to Header.tsx — mobile works
4. Add keyboard shortcuts (Ctrl+Tab, Ctrl+W, Ctrl+T)
5. Add dirty tracking + close confirmation
6. Polish: scroll preservation, overflow scrolling, animations
