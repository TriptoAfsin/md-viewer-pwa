import type { jsPDF as JsPDFType } from "jspdf"

// Strip markdown inline formatting
const INLINE_RE_BOLD = /\*\*(.+?)\*\*/g
const INLINE_RE_ITALIC = /\*(.+?)\*/g
const INLINE_RE_BOLD_ALT = /__(.+?)__/g
const INLINE_RE_ITALIC_ALT = /_(.+?)_/g
const INLINE_RE_STRIKE = /~~(.+?)~~/g
const INLINE_RE_CODE = /`(.+?)`/g
const INLINE_RE_LINK = /\[(.+?)\]\(.+?\)/g
const INLINE_RE_IMAGE = /!\[.*?\]\(.+?\)/g

// Replace emoji/unsupported chars with a placeholder to avoid jsPDF errors
const EMOJI_RE = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu

function stripInline(text: string): string {
  return text
    .replace(INLINE_RE_IMAGE, "")
    .replace(INLINE_RE_BOLD, "$1")
    .replace(INLINE_RE_ITALIC, "$1")
    .replace(INLINE_RE_BOLD_ALT, "$1")
    .replace(INLINE_RE_ITALIC_ALT, "$1")
    .replace(INLINE_RE_STRIKE, "$1")
    .replace(INLINE_RE_CODE, "$1")
    .replace(INLINE_RE_LINK, "$1")
}

function sanitizeText(text: string): string {
  // Replace emojis with a square placeholder since standard PDF fonts lack them
  return text.replace(EMOJI_RE, "\u25A1")
}

function ensureSpace(doc: JsPDFType, y: number, needed: number, margin: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed > pageHeight - margin) {
    doc.addPage()
    return margin
  }
  return y
}

type ParsedBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "ordered"; text: string; num: string; indent: number }
  | { type: "code"; lines: string[]; lang: string }
  | { type: "blockquote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "blank" }

function parseMarkdown(markdown: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const lines = markdown.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code fence
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: "code", lines: codeLines, lang })
      i++ // skip closing ```
      continue
    }

    // Table: detect header row with pipes
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*[-:]+/.test(lines[i + 1])) {
      const parseRow = (row: string) =>
        row.split("|").map((c) => c.trim()).filter(Boolean)
      const headers = parseRow(line)
      i += 2 // skip header + separator
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(parseRow(lines[i]))
        i++
      }
      blocks.push({ type: "table", headers, rows })
      continue
    }

    // Headings
    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2) })
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) })
    } else if (line.startsWith("### ") || line.startsWith("#### ") || line.startsWith("##### ") || line.startsWith("###### ")) {
      const text = line.replace(/^#{1,6}\s+/, "")
      blocks.push({ type: "h3", text })
    }
    // Horizontal rule
    else if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: "hr" })
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      blocks.push({ type: "blockquote", text: line.slice(2) })
    }
    // Unordered list
    else if (/^\s*[-*+]\s+/.test(line)) {
      const indent = line.search(/\S/)
      const text = line.replace(/^\s*[-*+]\s+/, "")
      blocks.push({ type: "bullet", text, indent: Math.floor(indent / 2) })
    }
    // Ordered list
    else if (/^\s*\d+\.\s+/.test(line)) {
      const indent = line.search(/\S/)
      const num = line.match(/^\s*(\d+)\./)?.[1] || "1"
      const text = line.replace(/^\s*\d+\.\s+/, "")
      blocks.push({ type: "ordered", text, num, indent: Math.floor(indent / 2) })
    }
    // Blank line
    else if (line.trim() === "") {
      blocks.push({ type: "blank" })
    }
    // Paragraph
    else {
      blocks.push({ type: "paragraph", text: line })
    }

    i++
  }

  return blocks
}

export async function exportToPdf(markdown: string, filename: string) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])

  const autoTable = autoTableModule.default

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxWidth = pageWidth - margin * 2
  let y = margin

  const blocks = parseMarkdown(markdown)

  for (const block of blocks) {
    switch (block.type) {
      case "h1": {
        y = ensureSpace(doc, y, 12, margin)
        doc.setFontSize(22)
        doc.setFont("helvetica", "bold")
        const wrapped = doc.splitTextToSize(sanitizeText(stripInline(block.text)), maxWidth)
        doc.text(wrapped, margin, y)
        y += wrapped.length * 9 + 2
        // Underline
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageWidth - margin, y)
        y += 4
        break
      }

      case "h2": {
        y = ensureSpace(doc, y, 10, margin)
        doc.setFontSize(17)
        doc.setFont("helvetica", "bold")
        const wrapped = doc.splitTextToSize(sanitizeText(stripInline(block.text)), maxWidth)
        doc.text(wrapped, margin, y)
        y += wrapped.length * 7.5 + 2
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.2)
        doc.line(margin, y, pageWidth - margin, y)
        y += 3
        break
      }

      case "h3": {
        y = ensureSpace(doc, y, 8, margin)
        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        const wrapped = doc.splitTextToSize(sanitizeText(stripInline(block.text)), maxWidth)
        doc.text(wrapped, margin, y)
        y += wrapped.length * 6 + 2
        break
      }

      case "paragraph": {
        doc.setFontSize(10.5)
        doc.setFont("helvetica", "normal")
        const text = sanitizeText(stripInline(block.text))
        const wrapped = doc.splitTextToSize(text, maxWidth)
        y = ensureSpace(doc, y, wrapped.length * 4.5, margin)
        doc.text(wrapped, margin, y)
        y += wrapped.length * 4.5 + 1.5
        break
      }

      case "bullet": {
        doc.setFontSize(10.5)
        doc.setFont("helvetica", "normal")
        const indent = margin + block.indent * 4
        const bulletWidth = maxWidth - (indent - margin) - 4
        const text = sanitizeText(stripInline(block.text))
        const wrapped = doc.splitTextToSize(text, bulletWidth)
        y = ensureSpace(doc, y, wrapped.length * 4.5, margin)
        doc.text("\u2022", indent, y)
        doc.text(wrapped, indent + 4, y)
        y += wrapped.length * 4.5 + 1
        break
      }

      case "ordered": {
        doc.setFontSize(10.5)
        doc.setFont("helvetica", "normal")
        const indent = margin + block.indent * 4
        const numWidth = maxWidth - (indent - margin) - 6
        const text = sanitizeText(stripInline(block.text))
        const wrapped = doc.splitTextToSize(text, numWidth)
        y = ensureSpace(doc, y, wrapped.length * 4.5, margin)
        doc.text(`${block.num}.`, indent, y)
        doc.text(wrapped, indent + 6, y)
        y += wrapped.length * 4.5 + 1
        break
      }

      case "blockquote": {
        y = ensureSpace(doc, y, 8, margin)
        // Violet left bar
        doc.setFillColor(124, 58, 237)
        doc.rect(margin, y - 3, 1.2, 6, "F")
        doc.setFontSize(10.5)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(120, 120, 120)
        const text = sanitizeText(stripInline(block.text))
        const wrapped = doc.splitTextToSize(text, maxWidth - 6)
        doc.text(wrapped, margin + 5, y)
        doc.setTextColor(0, 0, 0)
        y += wrapped.length * 4.5 + 2
        break
      }

      case "code": {
        const codeText = block.lines.join("\n")
        const codeSanitized = sanitizeText(codeText)
        doc.setFontSize(9)
        doc.setFont("courier", "normal")
        const codeWrapped = doc.splitTextToSize(codeSanitized, maxWidth - 8)
        const codeHeight = codeWrapped.length * 4 + 6

        y = ensureSpace(doc, y, codeHeight, margin)

        // Gray background
        doc.setFillColor(245, 245, 244)
        doc.setDrawColor(220, 220, 220)
        doc.roundedRect(margin, y - 3, maxWidth, codeHeight, 1.5, 1.5, "FD")

        // Language label
        if (block.lang) {
          doc.setFontSize(7)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(150, 150, 150)
          doc.text(block.lang, margin + 3, y)
          doc.setTextColor(0, 0, 0)
          y += 3
        }

        // Code text
        doc.setFontSize(9)
        doc.setFont("courier", "normal")
        doc.setTextColor(40, 40, 40)
        doc.text(codeWrapped, margin + 4, y + 1)
        doc.setTextColor(0, 0, 0)
        y += codeHeight - 2
        break
      }

      case "table": {
        y = ensureSpace(doc, y, 20, margin)

        autoTable(doc, {
          startY: y,
          head: [block.headers.map((h) => sanitizeText(stripInline(h)))],
          body: block.rows.map((row) =>
            row.map((cell) => sanitizeText(stripInline(cell)))
          ),
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            font: "helvetica",
            cellPadding: 2,
            lineColor: [220, 220, 220],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [245, 245, 244],
            textColor: [30, 30, 30],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [252, 252, 251],
          },
          theme: "grid",
        })

        // Get the Y position after the table
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
        break
      }

      case "hr": {
        y = ensureSpace(doc, y, 6, margin)
        y += 2
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageWidth - margin, y)
        y += 4
        break
      }

      case "blank": {
        y += 3
        break
      }
    }
  }

  const pdfName = filename.replace(/\.(md|markdown|txt|mdx)$/i, ".pdf")
  doc.save(pdfName)
}
