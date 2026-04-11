export function exportToText(markdown: string, filename: string) {
  // Strip markdown formatting
  const text = markdown
    .replace(/^#{1,6}\s+/gm, "")         // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")     // bold
    .replace(/\*(.+?)\*/g, "$1")         // italic
    .replace(/__(.+?)__/g, "$1")         // bold alt
    .replace(/_(.+?)_/g, "$1")           // italic alt
    .replace(/~~(.+?)~~/g, "$1")         // strikethrough
    .replace(/`{3}[\s\S]*?`{3}/g, "")   // code fences
    .replace(/`(.+?)`/g, "$1")          // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "")    // images
    .replace(/^[-*+]\s+/gm, "  - ")     // list items
    .replace(/^\d+\.\s+/gm, "  ")       // ordered list items
    .replace(/^>\s?/gm, "")             // blockquotes
    .replace(/\n{3,}/g, "\n\n")         // collapse extra newlines
    .trim()

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.replace(/\.(md|markdown|mdx)$/i, ".txt")
  a.click()
  URL.revokeObjectURL(url)
}
