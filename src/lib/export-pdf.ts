export async function exportToPdf(markdown: string, filename: string) {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = margin

  const lines = markdown.split("\n")

  for (const line of lines) {
    // Headings
    if (line.startsWith("# ")) {
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      const text = line.replace(/^# /, "")
      const wrapped = doc.splitTextToSize(text, maxWidth)
      if (y + wrapped.length * 8 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 8 + 4
    } else if (line.startsWith("## ")) {
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      const text = line.replace(/^## /, "")
      const wrapped = doc.splitTextToSize(text, maxWidth)
      if (y + wrapped.length * 7 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 7 + 3
    } else if (line.startsWith("### ")) {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      const text = line.replace(/^### /, "")
      const wrapped = doc.splitTextToSize(text, maxWidth)
      if (y + wrapped.length * 6 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 6 + 2
    } else if (line.startsWith("```")) {
      // Code fence markers — skip
      doc.setFontSize(10)
      doc.setFont("courier", "normal")
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      const text = `  \u2022 ${line.replace(/^[-*] /, "")}`
      const wrapped = doc.splitTextToSize(text, maxWidth)
      if (y + wrapped.length * 5 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5 + 1
    } else if (line.trim() === "") {
      y += 4
    } else {
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      // Strip basic markdown formatting for PDF text
      const text = line
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      const wrapped = doc.splitTextToSize(text, maxWidth)
      if (y + wrapped.length * 5 > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5 + 1
    }
  }

  const pdfName = filename.replace(/\.(md|markdown|txt|mdx)$/i, ".pdf")
  doc.save(pdfName)
}
