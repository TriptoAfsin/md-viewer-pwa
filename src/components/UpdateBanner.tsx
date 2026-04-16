import { RefreshCw, X } from "lucide-react"

type UpdateBannerProps = {
  needRefresh: boolean
  onReload: () => void
  onDismiss: () => void
}

export function UpdateBanner({ needRefresh, onReload, onDismiss }: UpdateBannerProps) {
  if (!needRefresh) return null

  return (
    <div
      className="fixed z-50 flex items-center gap-2 rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2.5 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300
      bottom-[max(1rem,var(--safe-bottom))]
      left-1/2 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2
      sm:left-auto sm:right-4 sm:w-auto sm:max-w-none sm:translate-x-0"
    >
      <RefreshCw className="h-4 w-4 text-primary shrink-0" />
      <span className="min-w-0 flex-1 text-sm text-foreground sm:whitespace-nowrap">
        Update available
      </span>
      <button
        onClick={onReload}
        className="rounded-md cursor-pointer bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        Reload
      </button>
      <button
        onClick={onDismiss}
        className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
