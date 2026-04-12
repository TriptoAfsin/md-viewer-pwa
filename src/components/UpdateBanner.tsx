import { useRegisterSW } from "virtual:pwa-register/react"
import { RefreshCw, X } from "lucide-react"
import { useRef, useCallback } from "react"

const SW_CHECK_INTERVAL = 60 * 60 * 1000 // Check for updates every hour
const MAX_DISMISSALS = 3 // After this many dismissals, force the update

export function UpdateBanner() {
  const dismissCount = useRef(0)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return

      // Periodically check for new SW versions
      setInterval(async () => {
        if (registration.installing || !navigator) return
        if ("connection" in navigator && !navigator.onLine) return

        try {
          const resp = await fetch(swUrl, {
            cache: "no-store",
            headers: { "cache-control": "no-cache" },
          })
          if (resp?.status === 200) {
            await registration.update()
          }
        } catch {
          // Network error, skip this check
        }
      }, SW_CHECK_INTERVAL)
    },
    onRegisterError(error) {
      console.error("[SW] Registration failed:", error)
    },
  })

  const handleReload = useCallback(() => {
    updateServiceWorker(true)
    // Fallback: if updateServiceWorker doesn't trigger a reload within 2s, force it
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }, [updateServiceWorker])

  const handleDismiss = useCallback(() => {
    dismissCount.current++
    if (dismissCount.current >= MAX_DISMISSALS) {
      // User has dismissed too many times, force update to prevent getting stuck on stale version
      handleReload()
    } else {
      setNeedRefresh(false)
    }
  }, [setNeedRefresh, handleReload])

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 flex items-center gap-2 rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2.5 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
      <RefreshCw className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm text-foreground whitespace-nowrap">Update available</span>
      <button
        onClick={handleReload}
        className="rounded-md cursor-pointer bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        Reload
      </button>
      <button
        onClick={handleDismiss}
        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
