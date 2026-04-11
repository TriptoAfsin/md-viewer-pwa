import { useRef, useEffect } from "react"
import { Box } from "@/components/primitives"

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus the textarea when entering edit mode
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.focus()
      // Move cursor to end
      el.selectionStart = el.selectionEnd = el.value.length
    }
  }, [])

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const newValue = value.slice(0, start) + "  " + value.slice(end)
      onChange(newValue)
      // Restore cursor position after React re-renders
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2
      })
    }
  }

  return (
    <Box className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
      <Box
        as="textarea"
        ref={textareaRef}
        className="flex-1 w-full resize-none rounded-lg border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        // @ts-expect-error polymorphic textarea props
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write markdown here..."
        spellCheck={false}
      />
    </Box>
  )
}
