import { parse } from "yaml"

export type Frontmatter = {
  /** Parsed YAML mapping, or null when the block isn't a valid key/value map. */
  data: Record<string, unknown> | null
  /** The raw YAML text between the fences. */
  raw: string
}

const FRONTMATTER = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/

/** Split a leading YAML frontmatter block (`---` … `---`) off the markdown body. */
export function splitFrontmatter(markdown: string): { frontmatter: Frontmatter | null; body: string } {
  const match = FRONTMATTER.exec(markdown)
  if (!match) return { frontmatter: null, body: markdown }

  const raw = match[1]
  let data: Record<string, unknown> | null = null
  try {
    const parsed: unknown = parse(raw)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>
    }
  } catch {
    // Invalid YAML — fall back to showing the raw block
  }

  return { frontmatter: { data, raw }, body: markdown.slice(match[0].length) }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function valueToHtml(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value)) {
    return `<ul>${value.map((item) => `<li>${valueToHtml(item)}</li>`).join("")}</ul>`
  }
  if (value instanceof Date) return escapeHtml(value.toISOString().slice(0, 10))
  if (typeof value === "object") return frontmatterTableHtml(value as Record<string, unknown>)
  return escapeHtml(String(value))
}

function frontmatterTableHtml(data: Record<string, unknown>): string {
  const rows = Object.entries(data)
    .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${valueToHtml(value)}</td></tr>`)
    .join("")
  return `<table class="frontmatter"><tbody>${rows}</tbody></table>`
}

/** Standalone HTML for the frontmatter block, used by the PDF export pipeline. */
export function frontmatterToHtml(frontmatter: Frontmatter): string {
  return frontmatter.data
    ? frontmatterTableHtml(frontmatter.data)
    : `<pre><code>${escapeHtml(frontmatter.raw)}</code></pre>`
}
