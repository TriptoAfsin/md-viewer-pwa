import { useRegisterSW } from "virtual:pwa-register/react"
import { RefreshCw, X } from "lucide-react"

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-border bg-background/95 backdrop-blur px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
      <RefreshCw className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm text-foreground">A new version is available.</span>
      <button
        onClick={() => updateServiceWorker()}
        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Reload
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
