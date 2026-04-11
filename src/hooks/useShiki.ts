import { useState, useEffect, useRef, useCallback } from "react"
import type { Highlighter } from "shiki"

type ShikiState = {
  highlighter: Highlighter | null
  loading: boolean
}

export function useShiki(theme: string, hasCodeBlocks: boolean) {
  const [state, setState] = useState<ShikiState>({ highlighter: null, loading: false })
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    if (!hasCodeBlocks) return

    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: [themeRef.current],
        langs: [],
      })
    ).then((highlighter) => {
      if (!cancelled) {
        setState({ highlighter, loading: false })
      }
    }).catch(() => {
      if (!cancelled) {
        setState({ highlighter: null, loading: false })
      }
    })

    return () => {
      cancelled = true
    }
  }, [hasCodeBlocks])

  // Load a new theme when it changes
  useEffect(() => {
    const h = state.highlighter
    if (!h) return

    const loadedThemes = h.getLoadedThemes()
    if (!loadedThemes.includes(theme)) {
      h.loadTheme(theme).catch(() => {
        // Theme unavailable, keep current
      })
    }
  }, [theme, state.highlighter])

  const highlight = useCallback(
    async (code: string, lang: string): Promise<string | null> => {
      const h = state.highlighter
      if (!h) return null

      try {
        const loadedLangs = h.getLoadedLanguages()
        if (!loadedLangs.includes(lang)) {
          await h.loadLanguage(lang as Parameters<typeof h.loadLanguage>[0])
        }

        return h.codeToHtml(code, {
          lang,
          theme: themeRef.current,
        })
      } catch {
        // Language not available, return null for fallback
        return null
      }
    },
    [state.highlighter]
  )

  return { highlight, loading: state.loading, ready: !!state.highlighter }
}
