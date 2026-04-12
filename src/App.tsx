import { useState, useCallback, useRef, type RefObject } from "react"
import { Box, Stack } from "@/components/primitives"
import { Header } from "@/components/Header"
import { DropZone } from "@/components/DropZone"
import { MarkdownView } from "@/components/MarkdownView"
import { MarkdownEditor } from "@/components/MarkdownEditor"
import { Toaster } from "@/components/ui/sonner"
import { UpdateBanner } from "@/components/UpdateBanner"
import { toast } from "sonner"
import { useRecentFiles } from "@/hooks/useRecentFiles"

const SHIKI_THEME_KEY = "md-view-shiki-theme"

function getStoredShikiTheme(): string {
  try {
    return localStorage.getItem(SHIKI_THEME_KEY) || "github-dark"
  } catch {
    return "github-dark"
  }
}

function App() {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [shikiTheme, setShikiTheme] = useState(getStoredShikiTheme)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Always-current markdown ref so export callbacks never read stale closures
  const markdownRef: RefObject<string | null> = useRef(markdown)
  markdownRef.current = markdown
  const { addRecentFile, openRecentFile, removeRecentFile, recentFiles } = useRecentFiles()

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
      setMarkdown(content)
      setFilename(name)
      setFileHandle(handle ?? null)
      setEditing(false)
      addRecentFile(name, content.length, handle)
    },
    [addRecentFile]
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
        const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext))
        if (!hasValidExt) {
          toast.error("Unsupported file type. Please open a Markdown file (.md, .markdown, .mdx, .txt)")
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

      // Validate file type
      const validExts = [".md", ".markdown", ".mdx", ".txt"]
      const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext))
      if (!hasValidExt) {
        toast.error("Unsupported file type. Please open a Markdown file (.md, .markdown, .mdx, .txt)")
        e.target.value = ""
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        // Basic binary check — if >10% of first 1KB is non-printable, likely not text
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
        setMarkdown(result.content)
        setFilename(result.name)
        setEditing(false)
        toast.success(`Opened ${result.name}`)
      } else {
        toast.error("Cannot re-open file. Use the file picker to open it again.")
      }
    },
    [openRecentFile]
  )

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        handleFileContent(text, "pasted-content.md")
        toast.success("Pasted from clipboard")
      } else {
        toast.error("Clipboard is empty")
      }
    } catch {
      toast.error("Cannot read clipboard. Please allow clipboard access.")
    }
  }, [handleFileContent])

  const handleToggleEdit = useCallback(() => {
    setEditing((prev) => !prev)
  }, [])

  const handleEditorChange = useCallback((value: string) => {
    setMarkdown(value)
  }, [])

  const handleExportPdf = useCallback(async () => {
    const current = markdownRef.current
    if (!current || !filename) return
    try {
      const { exportToPdf } = await import("@/lib/export-pdf")
      await exportToPdf(current, filename)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    }
  }, [filename])

  const handleExportText = useCallback(async () => {
    const current = markdownRef.current
    if (!current || !filename) return
    try {
      const { exportToText } = await import("@/lib/export-text")
      exportToText(current, filename)
      toast.success("Text file exported successfully")
    } catch {
      toast.error("Failed to export text")
    }
  }, [filename])

  const handleSave = useCallback(async () => {
    const current = markdownRef.current
    if (!current || !fileHandle) return
    try {
      const permission = await fileHandle.requestPermission({ mode: "readwrite" })
      if (permission !== "granted") {
        toast.error("Write permission denied")
        return
      }
      const writable = await fileHandle.createWritable()
      await writable.write(current)
      await writable.close()
      toast.success("File saved")
    } catch {
      toast.error("Failed to save file")
    }
  }, [fileHandle])

  const handleSaveAs = useCallback(async () => {
    const current = markdownRef.current
    if (!current) return
    if (!("showSaveFilePicker" in window)) {
      // Fallback: download as file
      const blob = new Blob([current], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename || "document.md"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("File downloaded")
      return
    }
    try {
      const handle = await window.showSaveFilePicker!({
        suggestedName: filename || "document.md",
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
      setFileHandle(handle)
      setFilename(handle.name)
      toast.success(`Saved as ${handle.name}`)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      toast.error("Failed to save file")
    }
  }, [filename])

  const handleGoHome = useCallback(() => {
    setMarkdown(null)
    setFilename(null)
    setFileHandle(null)
    setEditing(false)
  }, [])

  return (
    <Stack gap="gap-0" className="min-h-svh">
      <Header
        filename={filename}
        shikiTheme={shikiTheme}
        editing={editing}
        hasFileHandle={!!fileHandle}
        recentFiles={recentFiles}
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
      />

      <Box as="main" className="flex-1 flex flex-col">
        {markdown != null ? (
          editing ? (
            <MarkdownEditor value={markdown} onChange={handleEditorChange} />
          ) : (
            <MarkdownView
              content={markdown}
              filename={filename}
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
            onRemoveRecent={removeRecentFile}
            onPaste={handlePasteFromClipboard}
            recentFiles={recentFiles}
          />
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.mdx"
        className="hidden"
        onChange={handleFileInput}
      />

      <UpdateBanner />
      <Toaster position="bottom-center" />
    </Stack>
  )
}

export default App
