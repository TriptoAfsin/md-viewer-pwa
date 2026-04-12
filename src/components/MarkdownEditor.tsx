import { useRef, useEffect, useCallback } from "react"
import { Box } from "@/components/primitives"

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    }
  }, [])

  const handleInput = useCallback(() => {
    const el = textareaRef.current
    if (el) onChange(el.value)
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      // execCommand preserves the native undo stack
      document.execCommand("insertText", false, "  ")
    }
  }

  return (
    <Box className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
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
  )
}
