import { useRef, useCallback } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "sonner"

const SW_CHECK_INTERVAL = 60 * 60 * 1000 // Check for updates every hour

export function useServiceWorker() {
  const dismissCount = useRef(0)
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      registrationRef.current = registration

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
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }, [updateServiceWorker])

  const handleDismiss = useCallback(() => {
    dismissCount.current++
    if (dismissCount.current >= 3) {
      handleReload()
    } else {
      setNeedRefresh(false)
    }
  }, [setNeedRefresh, handleReload])

  const checkForUpdate = useCallback(async () => {
    const registration = registrationRef.current
    if (!registration) {
      toast.info("No service worker registered")
      return
    }
    try {
      toast.info("Checking for updates...")
      await registration.update()
      // If needRefresh doesn't become true after a short delay, we're up to date
      setTimeout(() => {
        if (!registrationRef.current?.waiting) {
          toast.success("You're on the latest version")
        }
      }, 2000)
    } catch {
      toast.error("Failed to check for updates")
    }
  }, [])

  return {
    needRefresh,
    handleReload,
    handleDismiss,
    checkForUpdate,
  }
}
