import { useState, useCallback, useRef } from "react"
import { Box, Stack } from "@/components/primitives"
import { Header } from "@/components/Header"
import { DropZone } from "@/components/DropZone"
import { MarkdownView } from "@/components/MarkdownView"
import { MarkdownEditor } from "@/components/MarkdownEditor"
import { Toaster } from "@/components/ui/sonner"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addRecentFile, openRecentFile, recentFiles } = useRecentFiles()

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
      setEditing(false)
      addRecentFile(name, content.length, handle)
    },
    [addRecentFile]
  )

  const handleOpenFile = useCallback(async () => {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
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

      const reader = new FileReader()
      reader.onload = () => {
        handleFileContent(reader.result as string, file.name)
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

  const handleToggleEdit = useCallback(() => {
    setEditing((prev) => !prev)
  }, [])

  const handleEditorChange = useCallback((value: string) => {
    setMarkdown(value)
  }, [])

  const handleExportPdf = useCallback(async () => {
    if (!markdown || !filename) return
    try {
      const { exportToPdf } = await import("@/lib/export-pdf")
      await exportToPdf(markdown, filename)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    }
  }, [markdown, filename])

  const handleExportText = useCallback(async () => {
    if (!markdown || !filename) return
    try {
      const { exportToText } = await import("@/lib/export-text")
      exportToText(markdown, filename)
      toast.success("Text file exported successfully")
    } catch {
      toast.error("Failed to export text")
    }
  }, [markdown, filename])

  return (
    <Stack gap="gap-0" className="min-h-svh">
      <Header
        filename={filename}
        shikiTheme={shikiTheme}
        editing={editing}
        onShikiThemeChange={handleShikiThemeChange}
        onOpenFile={handleOpenFile}
        onToggleEdit={handleToggleEdit}
        onExportPdf={handleExportPdf}
        onExportText={handleExportText}
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

      <Toaster position="bottom-center" />
    </Stack>
  )
}

export default App
