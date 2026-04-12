import { useState, useEffect, useCallback } from "react"

export type AccentColor = {
  name: string
  light: string
  lightForeground: string
  dark: string
  darkForeground: string
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    name: "Violet",
    light: "#7c3aed",
    lightForeground: "#faf5ff",
    dark: "#a78bfa",
    darkForeground: "#1c1917",
  },
  {
    name: "Blue",
    light: "#2563eb",
    lightForeground: "#eff6ff",
    dark: "#60a5fa",
    darkForeground: "#1c1917",
  },
  {
    name: "Emerald",
    light: "#059669",
    lightForeground: "#ecfdf5",
    dark: "#34d399",
    darkForeground: "#1c1917",
  },
  {
    name: "Rose",
    light: "#e11d48",
    lightForeground: "#fff1f2",
    dark: "#fb7185",
    darkForeground: "#1c1917",
  },
  {
    name: "Amber",
    light: "#d97706",
    lightForeground: "#fffbeb",
    dark: "#fbbf24",
    darkForeground: "#1c1917",
  },
  {
    name: "Slate",
    light: "#475569",
    lightForeground: "#f8fafc",
    dark: "#94a3b8",
    darkForeground: "#1c1917",
  },
]

const STORAGE_KEY = "md-view-accent-color"
const DEFAULT_NAME = "Violet"

function getStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME
  } catch {
    return DEFAULT_NAME
  }
}

function applyAccent(color: AccentColor) {
  const root = document.documentElement
  // Light mode vars on :root
  root.style.setProperty("--primary-light", color.light)
  root.style.setProperty("--primary-foreground-light", color.lightForeground)
  root.style.setProperty("--primary-dark", color.dark)
  root.style.setProperty("--primary-foreground-dark", color.darkForeground)

  // Apply based on current mode
  const isDark = root.classList.contains("dark")
  root.style.setProperty("--primary", isDark ? color.dark : color.light)
  root.style.setProperty("--primary-foreground", isDark ? color.darkForeground : color.lightForeground)
  root.style.setProperty("--ring", isDark ? color.dark : color.light)
}

export function useAccentColor() {
  const [accentName, setAccentName] = useState(getStored)

  const accent = ACCENT_COLORS.find((c) => c.name === accentName) || ACCENT_COLORS[0]

  // Apply on mount and when accent changes
  useEffect(() => {
    applyAccent(accent)
  }, [accent])

  // Re-apply when dark/light mode toggles (class change on <html>)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyAccent(accent)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [accent])

  const setAccent = useCallback((name: string) => {
    setAccentName(name)
    try {
      localStorage.setItem(STORAGE_KEY, name)
    } catch {
      // localStorage unavailable
    }
  }, [])

  return { accentName, setAccent, accents: ACCENT_COLORS } as const
}
