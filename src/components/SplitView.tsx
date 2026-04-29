import { useRef, useCallback } from "react"
import { Box } from "@/components/primitives"
import { MarkdownView } from "@/components/MarkdownView"

type SplitViewProps = {
  value: string
  filename: string | null
  shikiTheme: string
  onChange: (value: string) => void
  onOpenFile: () => void
  onExportPdf: () => void
  onExportText: () => void
}

export function SplitView({
  value,
  filename,
  shikiTheme,
  onChange,
  onOpenFile,
  onExportPdf,
  onExportText,
}: SplitViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = useCallback(() => {
    const el = textareaRef.current
    if (el) onChange(el.value)
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      document.execCommand("insertText", false, "  ")
    }
  }

  return (
    <Box
      className="flex flex-col md:flex-row overflow-hidden w-full"
      style={{
        height: "calc(100svh - 3.5rem - 2.25rem - var(--safe-top))",
      }}
    >
      <Box className="flex-1 flex flex-col min-h-0 md:border-r border-b md:border-b-0 border-border p-3 md:p-4">
        <textarea
          ref={textareaRef}
          className="flex-1 w-full resize-none rounded-lg border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          defaultValue={value}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Write markdown here..."
          spellCheck={false}
        />
      </Box>
      <Box className="flex-1 min-h-0 overflow-y-auto">
        <MarkdownView
          content={value}
          filename={filename}
          shikiTheme={shikiTheme}
          onOpenFile={onOpenFile}
          onExportPdf={onExportPdf}
          onExportText={onExportText}
        />
      </Box>
    </Box>
  )
}
