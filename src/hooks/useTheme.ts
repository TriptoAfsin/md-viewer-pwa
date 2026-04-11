import { useState, useEffect, useCallback } from "react"

type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "md-view-theme"

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme
  const root = document.documentElement

  if (resolved === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }

  const themeColor = resolved === "dark" ? "#0c0a09" : "#7c3aed"
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor)
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return "system"
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // localStorage unavailable
    }
    applyTheme(newTheme)
  }, [])

  // Apply theme on mount and listen for system changes
  useEffect(() => {
    applyTheme(theme)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme

  return { theme, setTheme, resolvedTheme } as const
}
