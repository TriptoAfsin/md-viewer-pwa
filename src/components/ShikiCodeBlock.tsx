import { useState, useEffect } from "react"
import { CodeBlock } from "@/components/CodeBlock"

type ShikiCodeBlockProps = {
  children: string
  language: string
  highlight: (code: string, lang: string) => Promise<string | null>
}

export function ShikiCodeBlock({ children, language, highlight }: ShikiCodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    highlight(children, language).then((result) => {
      if (!cancelled) setHtml(result)
    })
    return () => {
      cancelled = true
    }
  }, [children, language, highlight])

  return (
    <CodeBlock language={language} highlightedHtml={html ?? undefined}>
      {children}
    </CodeBlock>
  )
}
