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
    .pdf-content ul { margin: 10px 0; padding-left: 24px; list-style: none; }
    .pdf-content ol { margin: 10px 0; padding-left: 24px; list-style: none; }
    .pdf-content li { margin: 3px 0; }
    .pdf-content ul > li > .pdf-marker { display: inline-block; width: 1.2em; margin-left: -1.2em; }
    .pdf-content ol > li > .pdf-marker { display: inline-block; min-width: 1.6em; margin-left: -1.8em; padding-right: 0.2em; text-align: right; }
    .pdf-content hr { border: none; border-top: 1px solid #e7e5e4; margin: 20px 0; }
    .pdf-content img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
    .pdf-content code { background: #f5f5f4; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; font-size: 13px; }
    .pdf-content pre { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 12px 0; }
    .pdf-content pre code { background: none; padding: 0; font-size: 12px; }
    .pdf-content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .pdf-content th { text-align: left; font-weight: 600; padding: 8px; border-bottom: 2px solid #e7e5e4; }
    .pdf-content td { padding: 8px; border-bottom: 1px solid #e7e5e4; }
    .pdf-content tr:nth-child(even) { background: #fafaf9; }
    .pdf-content del {
      text-decoration: none;
      color: #a8a29e;
      background-image: linear-gradient(transparent calc(50% - 0.6px), #a8a29e calc(50% - 0.6px), #a8a29e calc(50% + 0.6px), transparent calc(50% + 0.6px));
    }
    .pdf-content input[type="checkbox"] { margin-right: 6px; }
  </style><div class="pdf-content">${html}</div>`

  document.body.appendChild(container)
  injectListMarkers(container)
  return container
}

// Render mermaid code blocks to PNG images. html2canvas does not reliably
// rasterize live SVG (foreignObject, etc.), so we serialize each diagram to a
// PNG data URL via an offscreen canvas and replace the <pre><code> block.
async function renderMermaidBlocks(container: HTMLElement) {
  const blocks = container.querySelectorAll<HTMLElement>(
    "pre > code.language-mermaid"
  )
  if (blocks.length === 0) return

  const mermaid = (await import("mermaid")).default
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "default", // PDF background is white — always use the light theme
  })

  for (let i = 0; i < blocks.length; i++) {
    const code = blocks[i].textContent ?? ""
    const pre = blocks[i].parentElement
    if (!pre?.parentElement) continue
    try {
      const id = `pdf-mermaid-${Date.now()}-${i}`
      const { svg } = await mermaid.render(id, code)
      const img = await svgStringToImg(svg)
      pre.parentElement.replaceChild(img, pre)
    } catch (err) {
      console.warn("[pdf-export] mermaid render failed:", err)
      // Leave the original <pre><code> in place as a fallback
    }
  }
}

async function svgStringToImg(svgString: string): Promise<HTMLImageElement> {
  // Pull intrinsic size out of the SVG (width/height or viewBox)
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, "image/svg+xml")
  const svgEl = doc.documentElement as unknown as SVGSVGElement
  let width = parseFloat(svgEl.getAttribute("width") ?? "") || 0
  let height = parseFloat(svgEl.getAttribute("height") ?? "") || 0
  if (!width || !height) {
    const vb = svgEl.getAttribute("viewBox")?.split(/[\s,]+/).map(Number)
    if (vb && vb.length === 4) {
      width = vb[2]
      height = vb[3]
    }
  }
  if (!width || !height) {
    width = 800
    height = 600
  }
  svgEl.setAttribute("width", String(width))
  svgEl.setAttribute("height", String(height))
  const finalSvg = new XMLSerializer().serializeToString(svgEl)
  const svgDataUrl =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(finalSvg)))

  const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
    const probe = new Image()
    probe.onload = () => resolve(probe)
    probe.onerror = (e) => reject(e)
    probe.src = svgDataUrl
  })

  // Rasterize to PNG at 2x for crispness in the PDF
  const scale = 2
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil(height * scale)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(loaded, 0, 0, canvas.width, canvas.height)

  const out = new Image()
  out.src = canvas.toDataURL("image/png")
  out.width = width
  out.height = height
  out.className = "pdf-mermaid"
  // max-height keeps even very tall diagrams within a single PDF page so they
  // don't get sliced across pages. Aspect ratio is preserved by width: auto.
  out.style.cssText =
    "display: block; max-width: 100%; max-height: 900px; width: auto; height: auto; margin: 12px auto;"
  // Wait for the data URL to decode so html2canvas sees a ready image
  await out.decode().catch(() => {})
  return out
}

// Build a sorted list of canvas-Y positions where it's safe to break pages.
// Includes the top/bottom of every block element plus the bottom of every text
// line inside paragraphs / list items / blockquotes (via Range.getClientRects),
// so pagination won't slice through a single line of text.
function collectBreakPoints(container: HTMLElement, scale: number): number[] {
  const containerTop = container.getBoundingClientRect().top
  const breaks = new Set<number>()
  const toCanvasY = (clientY: number) =>
    Math.round((clientY - containerTop) * scale)

  const blockSelector =
    "p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, table, tr, hr, img, figure, .pdf-content > *"
  container.querySelectorAll<HTMLElement>(blockSelector).forEach((el) => {
    const r = el.getBoundingClientRect()
    breaks.add(toCanvasY(r.top))
    breaks.add(toCanvasY(r.bottom))
  })

  // Per-line break points inside flowing text
  container
    .querySelectorAll<HTMLElement>(".pdf-content p, .pdf-content li, .pdf-content blockquote")
    .forEach((el) => {
      try {
        const range = document.createRange()
        range.selectNodeContents(el)
        const rects = range.getClientRects()
        for (let i = 0; i < rects.length; i++) {
          breaks.add(toCanvasY(rects[i].bottom))
        }
      } catch {
        // ignore — selection may fail for empty nodes
      }
    })

  return [...breaks].sort((a, b) => a - b)
}

// Find the largest break point in (srcY, idealEnd] that's also >= minEnd, so
// each page stays at least minEnd-srcY tall. Returns -1 if no such break.
function findBestBreak(
  breaks: number[],
  srcY: number,
  minEnd: number,
  idealEnd: number
): number {
  let best = -1
  for (const b of breaks) {
    if (b <= srcY) continue
    if (b > idealEnd) break
    if (b >= minEnd) best = b
  }
  return best
}

// html2canvas misaligns native list markers (renders them at cap-height instead
// of the text baseline). Replace them with inline span markers so the bullets
// and numbers sit on the correct line.
function injectListMarkers(container: HTMLElement) {
  const lists = container.querySelectorAll<HTMLElement>(".pdf-content ul, .pdf-content ol")
  lists.forEach((list) => {
    const ordered = list.tagName === "OL"
    const startAttr = ordered ? Number(list.getAttribute("start") ?? "1") : 0
    let index = startAttr
    Array.from(list.children).forEach((child) => {
      if (child.tagName !== "LI") return
      const li = child as HTMLElement
      // Skip GFM task-list items (those have a checkbox marker already)
      if (li.classList.contains("task-list-item")) return
      const marker = document.createElement("span")
      marker.className = "pdf-marker"
      marker.textContent = ordered ? `${index}.` : "•"
      li.insertBefore(marker, li.firstChild)
      if (ordered) index++
    })
  })
}

export async function exportToPdf(markdown: string, filename: string) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ])

  const html = await markdownToHtml(markdown)
  const container = buildStyledContainer(html)

  // Replace mermaid code blocks with rendered diagram images
  await renderMermaidBlocks(container)

  // Let the browser layout and load any images
  await new Promise((r) => setTimeout(r, 100))

  try {
    const scale = 2
    // Break points must be collected BEFORE html2canvas, while the original
    // container DOM is still the one whose getBoundingClientRect() we measure.
    const breaks = collectBreakPoints(container, scale)

    const canvas = await html2canvas(container, {
      scale,
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
    const pageContentHeightMm = pageHeight - margin * 2
    // Canvas pixels per PDF page (vertically)
    const pageContentPx = (pageContentHeightMm / contentWidth) * imgWidth
    // Don't accept a break point that would leave a page <50% utilized
    const minPageFillPx = pageContentPx * 0.5

    let srcY = 0
    let firstPage = true
    while (srcY < imgHeight) {
      if (!firstPage) doc.addPage()
      firstPage = false

      const idealEnd = Math.min(srcY + pageContentPx, imgHeight)
      let sliceEnd = idealEnd

      // Snap the page boundary to a clean break (between blocks / between
      // lines) when one exists in the lower half of the page.
      if (idealEnd < imgHeight) {
        const candidate = findBestBreak(
          breaks,
          srcY,
          srcY + minPageFillPx,
          idealEnd
        )
        if (candidate > 0) sliceEnd = candidate
      }

      const srcSliceHeight = Math.max(1, Math.ceil(sliceEnd - srcY))
      const sliceHeightMm = (srcSliceHeight / imgWidth) * contentWidth

      const sliceCanvas = document.createElement("canvas")
      sliceCanvas.width = imgWidth
      sliceCanvas.height = srcSliceHeight
      const ctx = sliceCanvas.getContext("2d")!
      // Fill with white so any letterboxing on a short final page stays clean
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(
        canvas,
        0, Math.round(srcY), imgWidth, srcSliceHeight,
        0, 0, imgWidth, srcSliceHeight
      )

      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95)
      doc.addImage(sliceData, "JPEG", margin, margin, contentWidth, sliceHeightMm)

      srcY = sliceEnd
    }

    const pdfName = filename.replace(/\.(md|markdown|txt|mdx)$/i, ".pdf")
    doc.save(pdfName)
  } finally {
    document.body.removeChild(container)
  }
}
