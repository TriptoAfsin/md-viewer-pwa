import { useState, useEffect, useRef, useCallback } from "react"

type HighlighterInstance = Awaited<ReturnType<typeof import("shiki")["createHighlighter"]>>

export function useShiki(theme: string, hasCodeBlocks: boolean) {
  const [highlighter, setHighlighter] = useState<HighlighterInstance | null>(null)
  const [loading, setLoading] = useState(false)
  // Increment to force re-render of code blocks when theme changes
  const [themeVersion, setThemeVersion] = useState(0)
  const themeRef = useRef(theme)
  themeRef.current = theme

  // Initialize highlighter when code blocks exist
  useEffect(() => {
    if (!hasCodeBlocks) return

    let cancelled = false
    setLoading(true)

    import("shiki")
      .then(({ createHighlighter }) =>
        createHighlighter({
          themes: [themeRef.current],
          langs: [],
        })
      )
      .then((h) => {
        if (!cancelled) {
          setHighlighter(h)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [hasCodeBlocks])

  // Load new theme and bump version to re-render
  useEffect(() => {
    if (!highlighter) return

    const loadedThemes = highlighter.getLoadedThemes()
    if (loadedThemes.includes(theme)) {
      // Theme already loaded, just bump version to re-highlight
      setThemeVersion((v) => v + 1)
      return
    }

    highlighter
      .loadTheme(theme as any)
      .then(() => setThemeVersion((v) => v + 1))
      .catch(() => {
        // Theme unavailable
      })
  }, [theme, highlighter])

  const highlight = useCallback(
    async (code: string, lang: string): Promise<string | null> => {
      if (!highlighter) return null

      try {
        const loadedLangs = highlighter.getLoadedLanguages()
        if (!loadedLangs.includes(lang)) {
          await highlighter.loadLanguage(lang as Parameters<typeof highlighter.loadLanguage>[0])
        }

        return highlighter.codeToHtml(code, {
          lang,
          theme: themeRef.current,
        })
      } catch {
        return null
      }
    },
    // themeVersion forces new callback when theme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [highlighter, themeVersion]
  )

  return { highlight, loading, ready: !!highlighter }
}
