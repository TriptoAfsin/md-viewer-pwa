import { useEffect, useState, useRef } from "react"
import { Box, Text } from "@/components/primitives"

type MermaidDiagramProps = {
  code: string
}

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const mermaid = m.default
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
      })
      return mermaid
    })
  }
  return mermaidPromise
}

let idCounter = 0

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [themeVersion, setThemeVersion] = useState(0)
  const idRef = useRef(`mermaid-${++idCounter}`)

  // Watch for theme changes and re-render
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeVersion((v) => v + 1)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    setError(null)

    loadMermaid()
      .then(async (mermaid) => {
        // Re-initialize on theme change
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        })
        const { svg } = await mermaid.render(idRef.current, code)
        if (!cancelled) setSvg(svg)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram")
        }
      })

    return () => {
      cancelled = true
    }
  }, [code, themeVersion])

  if (error) {
    return (
      <Box className="my-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <Text className="text-sm font-medium text-destructive mb-1">
          Mermaid diagram error
        </Text>
        <Text as="pre" className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
          {error}
        </Text>
      </Box>
    )
  }

  if (!svg) {
    return (
      <Box className="my-4 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Rendering diagram...
      </Box>
    )
  }

  return (
    <Box
      className="my-4 flex justify-center overflow-x-auto rounded-lg border border-border bg-card p-4 [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
