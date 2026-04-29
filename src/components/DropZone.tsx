import { useState, useCallback } from "react"
import { FileUp, Clock, FileText, ExternalLink, ClipboardPaste, Trash2, FilePlus } from "lucide-react"
import { Box, Stack, Text, Title } from "@/components/primitives"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { deriveFilename } from "@/lib/utils"
import type { RecentFile } from "@/hooks/useRecentFiles"

type DropZoneProps = {
  onFileContent: (content: string, name: string) => void
  onOpenFile: () => void
  onNewBlank: () => void
  onOpenRecent: (name: string) => void
  onSwitchToFile: (name: string) => void
  onRemoveRecent: (name: string) => void
  onPaste: () => void
  recentFiles: RecentFile[]
  openFilenames: Set<string>
}

const ACCEPTED_EXTENSIONS = [".md", ".markdown", ".txt", ".mdx"]

function isValidFile(name: string): boolean {
  return ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export function DropZone({ onFileContent, onOpenFile, onNewBlank, onOpenRecent, onSwitchToFile, onRemoveRecent, onPaste, recentFiles, openFilenames }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (!isValidFile(file.name)) {
        toast.error("Please drop a Markdown file (.md, .markdown, .txt, .mdx)")
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        onFileContent(reader.result as string, file.name)
      }
      reader.onerror = () => {
        toast.error("Failed to read file")
      }
      reader.readAsText(file)
    },
    [onFileContent]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text/plain")
      if (text.trim()) {
        onFileContent(text, deriveFilename(text))
      }
    },
    [onFileContent]
  )

  return (
    <Box
      className="flex-1 flex items-center justify-center p-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <Stack gap="gap-8" className="items-center max-w-md w-full">
        {/* Drop area */}
        <Stack
          gap="gap-5"
          className={[
            "items-center rounded-xl border-2 border-dashed p-10 w-full transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-muted-foreground/30",
          ].join(" ")}
        >
          <Logo size={48} className="text-primary" />
          <Stack gap="gap-1" className="items-center text-center">
            <Title level={1} className="text-2xl text-foreground">
              MD View
            </Title>
            <Text className="text-sm text-muted-foreground">
              View Markdown files beautifully on any device
            </Text>
          </Stack>

          <Box className="flex flex-wrap justify-center gap-2">
            <Button
              size="lg"
              onClick={onOpenFile}
              className="active:scale-[0.97] transition-transform"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Open File
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onNewBlank}
              className="active:scale-[0.97] transition-transform"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onPaste}
              className="active:scale-[0.97] transition-transform"
            >
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Paste
            </Button>
          </Box>

          <Text className="text-xs text-muted-foreground">
            or drag a file here
          </Text>
        </Stack>

        {/* Recent files */}
        {recentFiles.length > 0 && (
          <Stack gap="gap-2" className="w-full">
            <Text
              as="span"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
            >
              <Clock className="h-3 w-3" />
              Recent Files
            </Text>
            <Stack gap="gap-1">
              {recentFiles.map((file) => {
                const isOpen = openFilenames.has(file.name)
                return (
                  <RecentFileRow
                    key={`${file.name}-${file.openedAt}`}
                    file={file}
                    isOpen={isOpen}
                    onOpen={() => {
                      if (isOpen) {
                        onSwitchToFile(file.name)
                      } else if (file.hasHandle) {
                        onOpenRecent(file.name)
                      } else {
                        toast.info("Re-open this file using the file picker")
                      }
                    }}
                    onRemove={() => onRemoveRecent(file.name)}
                  />
                )
              })}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

function RecentFileRow({
  file,
  isOpen,
  onOpen,
  onRemove,
}: {
  file: RecentFile
  isOpen: boolean
  onOpen: () => void
  onRemove: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const clickable = file.hasHandle || isOpen

  return (
    <Box
      className={[
        "flex items-center rounded-lg px-3 py-2.5 w-full transition-colors duration-100",
        clickable
          ? "hover:bg-muted/50"
          : "opacity-60",
      ].join(" ")}
    >
      <Box
        as="button"
        className={[
          "flex items-center gap-2 min-w-0 flex-1 text-left",
          clickable ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
        onClick={onOpen}
      >
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <Text as="span" className="text-sm text-foreground truncate">
          {file.name}
        </Text>
        {isOpen && (
          <Text as="span" className="text-[10px] uppercase tracking-wider text-primary font-medium ml-1 shrink-0">
            Open
          </Text>
        )}
      </Box>
      <Box className="flex items-center gap-2 shrink-0 ml-3">
        {confirming ? (
          <>
            <Text as="span" className="text-xs text-muted-foreground">Remove?</Text>
            <button
              className="px-2 py-0.5 rounded text-xs cursor-pointer font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              onClick={onRemove}
            >
              Yes
            </button>
            <button
              className="px-2 py-0.5 rounded text-xs cursor-pointer font-medium border border-border hover:bg-muted transition-colors"
              onClick={() => setConfirming(false)}
            >
              No
            </button>
          </>
        ) : (
          <>
            <Text as="span" className="text-xs text-muted-foreground hidden sm:inline">
              {formatBytes(file.size)} &middot; {formatDate(file.openedAt)}
            </Text>
            {file.hasHandle && (
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            )}
            <button
              className="p-1 rounded cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Remove from recent"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </Box>
    </Box>
  )
}
