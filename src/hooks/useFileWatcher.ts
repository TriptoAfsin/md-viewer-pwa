import { useEffect, useRef } from "react"

const POLL_INTERVAL_MS = 2000

type FileWatcherOptions = {
  fileHandle: FileSystemFileHandle | null
  enabled: boolean
  initialLastModified: number | null
  onFileChanged: (content: string, lastModified: number) => void
  onError?: (error: unknown) => void
}

/**
 * Polls a FileSystemFileHandle for external changes. Calls `onFileChanged`
 * with new content when the file's `lastModified` timestamp advances.
 *
 * - Only polls while `enabled` is true and the document is visible.
 * - Pauses polling when the tab is hidden (battery-friendly).
 * - Guards against late responses after unmount or handle change.
 * - Stops polling silently if permission is denied or file is deleted.
 */
export function useFileWatcher({
  fileHandle,
  enabled,
  initialLastModified,
  onFileChanged,
  onError,
}: FileWatcherOptions) {
  // Keep latest callbacks in refs so effect doesn't re-run when they change
  const onFileChangedRef = useRef(onFileChanged)
  onFileChangedRef.current = onFileChanged
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    if (!enabled || !fileHandle) return

    let cancelled = false
    let lastModified = initialLastModified ?? 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleNext = () => {
      if (cancelled) return
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
    }

    const poll = async () => {
      if (cancelled) return
      // Skip polling while tab is hidden
      if (document.hidden) {
        scheduleNext()
        return
      }

      try {
        const file = await fileHandle.getFile()
        if (cancelled) return

        if (file.lastModified > lastModified && lastModified > 0) {
          const content = await file.text()
          if (cancelled) return
          lastModified = file.lastModified
          onFileChangedRef.current(content, lastModified)
        } else if (lastModified === 0) {
          // First check — establish baseline without firing callback
          lastModified = file.lastModified
        }
      } catch (err) {
        if (cancelled) return
        onErrorRef.current?.(err)
        // Stop polling on error (permission denied, file deleted, etc.)
        return
      }

      scheduleNext()
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }, [fileHandle, enabled, initialLastModified])
}
