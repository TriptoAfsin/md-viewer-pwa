import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Derive a filename from pasted markdown content.
 * Priority: first markdown heading → first non-empty text line → timestamped fallback.
 */
export function deriveFilename(text: string): string {
  const lines = text.split("\n")

  // 1. Look for the first markdown heading (# … or ## … etc.)
  for (const line of lines.slice(0, 30)) {
    const match = line.match(/^#{1,6}\s+(.+)/)
    if (match) return slugify(match[1])
  }

  // 2. Use the first non-empty, non-whitespace line of plain text
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("```") && !trimmed.startsWith("---")) {
      return slugify(trimmed)
    }
  }

  // 3. Fallback with timestamp
  const ts = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "")
  return `pasted-${ts}.md`
}

/** Turn a heading/line into a safe, short filename ending in .md */
function slugify(text: string): string {
  const clean = text
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // strip filesystem-unsafe chars
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50)
    .trimEnd()

  if (!clean) return "pasted-content.md"
  return clean.endsWith(".md") ? clean : `${clean}.md`
}
