// Text pasted from social posts, docs, etc. often uses Unicode bullet glyphs,
// which Markdown doesn't recognize as list markers — the lines collapse into
// a single paragraph. Rewrite them as standard "- " items (outside code fences).
const UNICODE_BULLET = /^(\s*)[•◦▪▫‣⁃●○■□►▸➤➢∙·]\s+/
const FENCE = /^\s*(`{3,}|~{3,})/

export function normalizeMarkdown(markdown: string): string {
  let fence: string | null = null
  return markdown
    .split("\n")
    .map((line) => {
      const fenceMatch = FENCE.exec(line)
      if (fenceMatch) {
        const marker = fenceMatch[1]
        if (fence === null) fence = marker
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null
        return line
      }
      if (fence !== null) return line
      return line.replace(UNICODE_BULLET, "$1- ")
    })
    .join("\n")
}
