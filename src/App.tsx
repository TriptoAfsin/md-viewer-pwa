import { useState, useCallback, useRef, useEffect, useMemo, type RefObject } from "react"
import { Box, Stack } from "@/components/primitives"
import { Header } from "@/components/Header"
import { DropZone } from "@/components/DropZone"
import { MarkdownView } from "@/components/MarkdownView"
import { MarkdownEditor } from "@/components/MarkdownEditor"
import { TabBar } from "@/components/TabBar"
import { MobileTabSwitcher } from "@/components/MobileTabSwitcher"
import { Toaster } from "@/components/ui/sonner"
import { UpdateBanner } from "@/components/UpdateBanner"
import { toast } from "sonner"
import { useRecentFiles } from "@/hooks/useRecentFiles"
import { useServiceWorker } from "@/hooks/useServiceWorker"
import { useFileWatcher } from "@/hooks/useFileWatcher"
import { deriveFilename } from "@/lib/utils"

const SHIKI_THEME_KEY = "md-view-shiki-theme"
const TABS_STORAGE_KEY = "md-view-tabs"
const ACTIVE_TAB_KEY = "md-view-active-tab"
const MAX_TABS = 10

export type Tab = {
  id: string
  markdown: string | null
  filename: string | null
  fileHandle: FileSystemFileHandle | null
  editing: boolean
  dirty: boolean
  scrollPosition: number
}

function createTab(
  markdown: string | null,
  filename: string | null,
  fileHandle?: FileSystemFileHandle
): Tab {
  return {
    id: crypto.randomUUID(),
    markdown,
    filename,
    fileHandle: fileHandle ?? null,
    editing: false,
    dirty: false,
    scrollPosition: 0,
  }
}

function getStoredShikiTheme(): string {
  try {
    return localStorage.getItem(SHIKI_THEME_KEY) || "github-dark"
  } catch {
    return "github-dark"
  }
}

type StoredTab = Omit<Tab, "fileHandle">

function getStoredTabs(): { tabs: Tab[]; activeTabId: string | null } {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY)
    const activeId = localStorage.getItem(ACTIVE_TAB_KEY)
    if (!raw) return { tabs: [], activeTabId: null }
    const stored: StoredTab[] = JSON.parse(raw)
    const tabs: Tab[] = stored.map((t) => ({ ...t, fileHandle: null }))
    return { tabs, activeTabId: activeId && tabs.some((t) => t.id === activeId) ? activeId : null }
  } catch {
    return { tabs: [], activeTabId: null }
  }
}

function saveTabs(tabs: Tab[], activeTabId: string | null) {
  try {
    const toStore: StoredTab[] = tabs
      .filter((t) => t.markdown != null)
      .map(({ fileHandle: _, ...rest }) => rest)
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(toStore))
    localStorage.setItem(ACTIVE_TAB_KEY, activeTabId ?? "")
  } catch {
    // localStorage unavailable
  }
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => getStoredTabs().tabs)
  const [activeTabId, setActiveTabId] = useState<string | null>(() => getStoredTabs().activeTabId)
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false)
  const [shikiTheme, setShikiTheme] = useState(getStoredShikiTheme)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addRecentFile, openRecentFile, removeRecentFile, recentFiles } = useRecentFiles()
  const { needRefresh, handleReload, handleDismiss, checkForUpdate } = useServiceWorker()

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  // Filenames currently open in tabs — used to mark recent files as already-open.
  // Recomputes on tab changes so the list un-greys as soon as a tab closes.
  const openFilenames = useMemo(
    () => new Set(tabs.map((t) => t.filename).filter((n): n is string => !!n)),
    [tabs]
  )

  // Always-current refs so callbacks never read stale closures
  const markdownRef: RefObject<string | null> = useRef(activeTab?.markdown ?? null)
  markdownRef.current = activeTab?.markdown ?? null
  const activeTabRef: RefObject<Tab | null> = useRef(activeTab)
  activeTabRef.current = activeTab
  const tabsRef: RefObject<Tab[]> = useRef(tabs)
  tabsRef.current = tabs

  // Persist tabs to localStorage whenever they change
  useEffect(() => {
    saveTabs(tabs, activeTabId)
  }, [tabs, activeTabId])

  const updateTab = useCallback((id: string, updater: (tab: Tab) => Tab) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }, [])

  const handleShikiThemeChange = useCallback((theme: string) => {
    setShikiTheme(theme)
    try {
      localStorage.setItem(SHIKI_THEME_KEY, theme)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const handleFileContent = useCallback(
    (content: string, name: string, handle?: FileSystemFileHandle) => {
      const current = activeTabRef.current
      // Reuse the active tab if it's empty (new tab)
      if (current && current.markdown == null) {
        updateTab(current.id, (t) => ({
          ...t,
          markdown: content,
          filename: name,
          fileHandle: handle ?? null,
        }))
        addRecentFile(name, content.length, handle)
        return
      }
      if (tabsRef.current.length >= MAX_TABS) {
        toast.error("Maximum 10 tabs open. Close a tab first.")
        return
      }
      const newTab = createTab(content, name, handle)
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTab.id)
      addRecentFile(name, content.length, handle)
    },
    [addRecentFile, updateTab]
  )

  const handleOpenFile = useCallback(async () => {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await window.showOpenFilePicker!({
          types: [
            {
              description: "Markdown files",
              accept: {
                "text/markdown": [".md", ".markdown", ".mdx"],
                "text/plain": [".txt"],
              },
            },
          ],
          multiple: false,
        })
        const file = await handle.getFile()
        const validExts = [".md", ".markdown", ".mdx", ".txt"]
        const hasValidExt = validExts.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        )
        if (!hasValidExt) {
          toast.error(
            "Unsupported file type. Please open a Markdown file (.md, .markdown, .mdx, .txt)"
          )
          return
        }
        const content = await file.text()
        handleFileContent(content, file.name, handle)
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
      }
    }
    fileInputRef.current?.click()
  }, [handleFileContent])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validExts = [".md", ".markdown", ".mdx", ".txt"]
      const hasValidExt = validExts.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
      if (!hasValidExt) {
        toast.error(
          "Unsupported file type. Please open a Markdown file (.md, .markdown, .mdx, .txt)"
        )
        e.target.value = ""
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        const sample = content.slice(0, 1024)
        const nonPrintable = sample.replace(/[\x20-\x7E\t\n\r]/g, "").length
        if (sample.length > 0 && nonPrintable / sample.length > 0.1) {
          toast.error("This file doesn't appear to be a text file")
          return
        }
        handleFileContent(content, file.name)
      }
      reader.onerror = () => {
        toast.error("Failed to read file")
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    [handleFileContent]
  )

  const handleOpenRecent = useCallback(
    async (name: string) => {
      const result = await openRecentFile(name)
      if (result) {
        handleFileContent(result.content, result.name, result.handle)
        toast.success(`Opened ${result.name}`)
      } else {
        toast.error("Cannot re-open file. Use the file picker to open it again.")
      }
    },
    [openRecentFile, handleFileContent]
  )

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        handleFileContent(text, deriveFilename(text))
        toast.success("Pasted from clipboard")
      } else {
        toast.error("Clipboard is empty")
      }
    } catch {
      toast.error("Cannot read clipboard. Please allow clipboard access.")
    }
  }, [handleFileContent])

  const handleToggleEdit = useCallback(() => {
    if (!activeTabId) return
    updateTab(activeTabId, (t) => ({ ...t, editing: !t.editing }))
  }, [activeTabId, updateTab])

  const handleEditorChange = useCallback(
    (value: string) => {
      if (!activeTabId) return
      updateTab(activeTabId, (t) => ({ ...t, markdown: value, dirty: true }))
    },
    [activeTabId, updateTab]
  )

  const handleExportPdf = useCallback(async () => {
    const current = markdownRef.current
    const tab = activeTabRef.current
    if (!current || !tab?.filename) return
    try {
      const { exportToPdf } = await import("@/lib/export-pdf")
      await exportToPdf(current, tab.filename)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    }
  }, [])

  const handleExportText = useCallback(async () => {
    const current = markdownRef.current
    const tab = activeTabRef.current
    if (!current || !tab?.filename) return
    try {
      const { exportToText } = await import("@/lib/export-text")
      exportToText(current, tab.filename)
      toast.success("Text file exported successfully")
    } catch {
      toast.error("Failed to export text")
    }
  }, [])

  const handleSave = useCallback(async () => {
    const current = markdownRef.current
    const tab = activeTabRef.current
    if (!current || !tab?.fileHandle) return
    try {
      const permission = await tab.fileHandle.requestPermission({
        mode: "readwrite",
      })
      if (permission !== "granted") {
        toast.error("Write permission denied")
        return
      }
      const writable = await tab.fileHandle.createWritable()
      await writable.write(current)
      await writable.close()
      updateTab(tab.id, (t) => ({ ...t, dirty: false }))
      toast.success("File saved")
    } catch {
      toast.error("Failed to save file")
    }
  }, [updateTab])

  const handleSaveAs = useCallback(async () => {
    const current = markdownRef.current
    const tab = activeTabRef.current
    if (!current) return
    if (!("showSaveFilePicker" in window)) {
      const blob = new Blob([current], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = tab?.filename || "document.md"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("File downloaded")
      return
    }
    try {
      const handle = await window.showSaveFilePicker!({
        suggestedName: tab?.filename || "document.md",
        types: [
          {
            description: "Markdown files",
            accept: { "text/markdown": [".md", ".markdown", ".mdx"] },
          },
          {
            description: "Text files",
            accept: { "text/plain": [".txt"] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(current)
      await writable.close()
      if (tab) {
        updateTab(tab.id, (t) => ({
          ...t,
          fileHandle: handle,
          filename: handle.name,
          dirty: false,
        }))
      }
      toast.success(`Saved as ${handle.name}`)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      toast.error("Failed to save file")
    }
  }, [updateTab])

  const handleGoHome = useCallback(() => {
    setActiveTabId(null)
  }, [])

  const handleSwitchTab = useCallback(
    (id: string) => {
      if (activeTabId) {
        updateTab(activeTabId, (t) => ({
          ...t,
          scrollPosition: window.scrollY,
        }))
      }
      setActiveTabId(id)
    },
    [activeTabId, updateTab]
  )

  const handleSwitchToFile = useCallback(
    (name: string) => {
      const tab = tabsRef.current.find((t) => t.filename === name)
      if (tab) handleSwitchTab(tab.id)
    },
    [handleSwitchTab]
  )

  const handleCloseTab = useCallback(
    (id: string) => {
      const tab = tabsRef.current.find((t) => t.id === id)
      if (!tab) return

      const doClose = () => {
        setTabs((prev) => {
          const next = prev.filter((t) => t.id !== id)
          if (next.length === 0) {
            setActiveTabId(null)
            return next
          }
          if (id === activeTabId) {
            const closedIndex = prev.findIndex((t) => t.id === id)
            const newIndex = Math.min(closedIndex, next.length - 1)
            setActiveTabId(next[newIndex].id)
          }
          return next
        })
      }

      if (tab.dirty) {
        // Use a confirm-style toast for dirty tab warning
        toast("Unsaved changes will be lost.", {
          action: {
            label: "Close anyway",
            onClick: doClose,
          },
          cancel: {
            label: "Cancel",
            onClick: () => {},
          },
          duration: 5000,
        })
        return
      }
      doClose()
    },
    [activeTabId]
  )

  const handleRenameTab = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    updateTab(id, (t) => ({ ...t, filename: trimmed }))
  }, [updateTab])

  const handleNewTab = useCallback(() => {
    if (tabs.length >= MAX_TABS) {
      toast.error("Maximum 10 tabs open. Close a tab first.")
      return
    }
    const newTab = createTab(null, null)
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [tabs.length])

  // Restore scroll position when switching tabs
  useEffect(() => {
    if (activeTab) {
      requestAnimationFrame(() => {
        window.scrollTo(0, activeTab.scrollPosition)
      })
    }
  }, [activeTabId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle files launched via OS file association (File Handling API)
  useEffect(() => {
    if (window.launchQueue) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (!launchParams.files?.length) return
        for (const fileHandle of launchParams.files) {
          try {
            const file = await fileHandle.getFile()
            const content = await file.text()
            handleFileContent(content, file.name, fileHandle)
          } catch {
            toast.error(`Failed to open ${fileHandle.name}`)
          }
        }
      })
    }
  }, [handleFileContent])

  // Watch the active tab's file for external changes (live-reload).
  // Only polls when: tab has a file handle, is not dirty, and is not being edited.
  const handleExternalFileChange = useCallback(
    (content: string, _lastModified: number) => {
      const tab = activeTabRef.current
      if (!tab) return
      updateTab(tab.id, (t) => ({ ...t, markdown: content }))
      toast.info(`${tab.filename ?? "File"} updated from disk`)
    },
    [updateTab]
  )

  useFileWatcher({
    fileHandle: activeTab?.fileHandle ?? null,
    enabled:
      !!activeTab?.fileHandle && !activeTab.editing && !activeTab.dirty,
    onFileChanged: handleExternalFileChange,
    onError: (err) => {
      console.warn("[file-watcher] stopped:", err)
    },
  })

  const handleReloadFile = useCallback(async () => {
    const tab = activeTabRef.current
    if (!tab?.fileHandle) {
      toast.error("No file to reload")
      return
    }
    if (tab.dirty) {
      toast("Unsaved changes will be lost.", {
        action: {
          label: "Reload anyway",
          onClick: async () => {
            try {
              const file = await tab.fileHandle!.getFile()
              const content = await file.text()
              updateTab(tab.id, (t) => ({ ...t, markdown: content, dirty: false }))
              toast.success("Reloaded from disk")
            } catch {
              toast.error("Failed to reload file")
            }
          },
        },
        cancel: { label: "Cancel", onClick: () => {} },
        duration: 5000,
      })
      return
    }
    try {
      const file = await tab.fileHandle.getFile()
      const content = await file.text()
      updateTab(tab.id, (t) => ({ ...t, markdown: content }))
      toast.success("Reloaded from disk")
    } catch {
      toast.error("Failed to reload file")
    }
  }, [updateTab])

  // Keyboard shortcuts: Ctrl+S, Ctrl+T, Ctrl+W, Ctrl+Tab, Ctrl+Shift+Tab
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+S — save
      if (ctrl && e.key === "s") {
        e.preventDefault()
        const tab = activeTabRef.current
        if (!tab?.editing || !markdownRef.current) return
        if (tab.fileHandle) {
          handleSave()
        } else {
          handleSaveAs()
        }
        return
      }

      // Ctrl+P — print
      if (ctrl && e.key === "p") {
        e.preventDefault()
        if (activeTabRef.current?.markdown != null) {
          window.print()
        }
        return
      }

      // Ctrl+T — new tab
      if (ctrl && e.key === "t") {
        e.preventDefault()
        handleNewTab()
        return
      }

      // Ctrl+W — close tab
      if (ctrl && e.key === "w") {
        e.preventDefault()
        const tab = activeTabRef.current
        if (tab) {
          handleCloseTab(tab.id)
        }
        return
      }

      // Ctrl+Tab / Ctrl+Shift+Tab — cycle tabs
      if (ctrl && e.key === "Tab") {
        e.preventDefault()
        const currentTabs = tabsRef.current
        if (currentTabs.length < 2) return
        const currentId = activeTabRef.current?.id
        const idx = currentTabs.findIndex((t) => t.id === currentId)
        if (idx === -1) return
        const nextIdx = e.shiftKey
          ? (idx - 1 + currentTabs.length) % currentTabs.length
          : (idx + 1) % currentTabs.length
        handleSwitchTab(currentTabs[nextIdx].id)
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleSave, handleSaveAs, handleNewTab, handleCloseTab, handleSwitchTab])

  return (
    <Stack gap="gap-0" className="min-h-svh">
      <Header
        filename={activeTab?.filename ?? null}
        shikiTheme={shikiTheme}
        editing={activeTab?.editing ?? false}
        hasFileHandle={!!activeTab?.fileHandle}
        recentFiles={recentFiles}
        tabCount={tabs.length}
        onShikiThemeChange={handleShikiThemeChange}
        onOpenFile={handleOpenFile}
        onToggleEdit={handleToggleEdit}
        onOpenRecent={handleOpenRecent}
        onRemoveRecent={removeRecentFile}
        onExportPdf={handleExportPdf}
        onExportText={handleExportText}
        onPaste={handlePasteFromClipboard}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onGoHome={handleGoHome}
        onOpenMobileTabSwitcher={() => setMobileTabsOpen(true)}
        onCheckForUpdate={checkForUpdate}
        onReloadFile={handleReloadFile}
      />

      {tabs.length >= 1 && (
        <div className="hidden sm:block sticky top-[calc(3.5rem+var(--safe-top))] z-40">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSwitchTab={handleSwitchTab}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
            onRenameTab={handleRenameTab}
          />
        </div>
      )}

      <Box as="main" className="flex-1 flex flex-col">
        {activeTab?.markdown != null ? (
          activeTab.editing ? (
            <MarkdownEditor
              key={activeTab.id}
              value={activeTab.markdown}
              onChange={handleEditorChange}
            />
          ) : (
            <MarkdownView
              key={activeTab.id}
              content={activeTab.markdown}
              filename={activeTab.filename}
              shikiTheme={shikiTheme}
              onOpenFile={handleOpenFile}
              onExportPdf={handleExportPdf}
              onExportText={handleExportText}
            />
          )
        ) : (
          <DropZone
            onFileContent={handleFileContent}
            onOpenFile={handleOpenFile}
            onOpenRecent={handleOpenRecent}
            onSwitchToFile={handleSwitchToFile}
            onRemoveRecent={removeRecentFile}
            onPaste={handlePasteFromClipboard}
            recentFiles={recentFiles}
            openFilenames={openFilenames}
          />
        )}
      </Box>

      <MobileTabSwitcher
        open={mobileTabsOpen}
        onOpenChange={setMobileTabsOpen}
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={(id) => {
          handleSwitchTab(id)
          setMobileTabsOpen(false)
        }}
        onCloseTab={handleCloseTab}
        onNewTab={() => {
          handleNewTab()
          setMobileTabsOpen(false)
        }}
        onRenameTab={handleRenameTab}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.mdx"
        className="hidden"
        onChange={handleFileInput}
      />

      <UpdateBanner needRefresh={needRefresh} onReload={handleReload} onDismiss={handleDismiss} />
      <Toaster position="bottom-center" />
    </Stack>
  )
}

export default App
