import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)
  return String(result)
}

function buildStyledContainer(html: string): HTMLDivElement {
  const container = document.createElement("div")
  container.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: -9999px",
    "width: 794px",       // A4 at 96dpi
    "padding: 48px",
    "background: #ffffff",
    "color: #1c1917",
    "font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    "font-size: 14px",
    "line-height: 1.7",
    "box-sizing: border-box",
  ].join(";")

  container.innerHTML = `<style>
    .pdf-content h1 { font-size: 28px; font-weight: 700; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e7e5e4; }
    .pdf-content h2 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e7e5e4; }
    .pdf-content h3 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
    .pdf-content h4 { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
    .pdf-content h5 { font-size: 14px; font-weight: 600; margin: 10px 0 4px; }
    .pdf-content h6 { font-size: 13px; font-weight: 600; margin: 10px 0 4px; color: #78716c; }
    .pdf-content p { margin: 10px 0; }
    .pdf-content a { color: #7c3aed; text-decoration: underline; }
    .pdf-content blockquote { margin: 12px 0; padding-left: 16px; border-left: 4px solid #7c3aed80; color: #78716c; font-style: italic; }
    .pdf-content ul { margin: 10px 0; padding-left: 24px; list-style: disc; }
    .pdf-content ol { margin: 10px 0; padding-left: 24px; list-style: decimal; }
    .pdf-content li { margin: 3px 0; }
    .pdf-content hr { border: none; border-top: 1px solid #e7e5e4; margin: 20px 0; }
    .pdf-content img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
    .pdf-content code { background: #f5f5f4; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; font-size: 13px; }
    .pdf-content pre { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 12px 0; }
    .pdf-content pre code { background: none; padding: 0; font-size: 12px; }
    .pdf-content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .pdf-content th { text-align: left; font-weight: 600; padding: 8px; border-bottom: 2px solid #e7e5e4; }
    .pdf-content td { padding: 8px; border-bottom: 1px solid #e7e5e4; }
    .pdf-content tr:nth-child(even) { background: #fafaf9; }
    .pdf-content del { text-decoration: line-through; color: #a8a29e; }
    .pdf-content input[type="checkbox"] { margin-right: 6px; }
  </style><div class="pdf-content">${html}</div>`

  document.body.appendChild(container)
  return container
}

export async function exportToPdf(markdown: string, filename: string) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ])

  const html = await markdownToHtml(markdown)
  const container = buildStyledContainer(html)

  // Let the browser layout and load any images
  await new Promise((r) => setTimeout(r, 100))

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    })

    const imgWidth = canvas.width
    const imgHeight = canvas.height

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pageWidth - margin * 2
    const contentHeight = (imgHeight * contentWidth) / imgWidth

    // Split into pages
    const pageContentHeight = pageHeight - margin * 2
    let remainingHeight = contentHeight
    let srcY = 0

    let firstPage = true
    while (remainingHeight > 0) {
      if (!firstPage) doc.addPage()
      firstPage = false

      const sliceHeight = Math.min(remainingHeight, pageContentHeight)
      // Source rectangle in the original image pixel space
      const srcSliceHeight = (sliceHeight / contentHeight) * imgHeight

      // Create a slice canvas for this page
      const sliceCanvas = document.createElement("canvas")
      sliceCanvas.width = imgWidth
      sliceCanvas.height = Math.ceil(srcSliceHeight)
      const ctx = sliceCanvas.getContext("2d")!
      ctx.drawImage(
        canvas,
        0, Math.round(srcY), imgWidth, Math.ceil(srcSliceHeight),
        0, 0, imgWidth, Math.ceil(srcSliceHeight),
      )

      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95)
      doc.addImage(sliceData, "JPEG", margin, margin, contentWidth, sliceHeight)

      srcY += srcSliceHeight
      remainingHeight -= pageContentHeight
    }

    const pdfName = filename.replace(/\.(md|markdown|txt|mdx)$/i, ".pdf")
    doc.save(pdfName)
  } finally {
    document.body.removeChild(container)
  }
}
