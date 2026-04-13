import { useEffect, useRef } from "react"

const POLL_INTERVAL_MS = 2000

type FileWatcherOptions = {
  fileHandle: FileSystemFileHandle | null
  enabled: boolean
  onFileChanged: (content: string, lastModified: number) => void
  onError?: (error: unknown) => void
}

/**
 * Polls a FileSystemFileHandle for external changes. Calls `onFileChanged`
 * with new content when the file's `lastModified` timestamp advances.
 *
 * Behavior:
 * - Establishes a baseline `lastModified` synchronously when the effect
 *   mounts, BEFORE the first poll delay. This avoids missing edits that
 *   happen in the interval between opening the file and the first poll.
 * - Pauses polling when the tab is hidden (battery-friendly).
 * - Guards against late responses after unmount or handle change.
 * - Stops polling silently if permission is denied or file is deleted.
 */
export function useFileWatcher({
  fileHandle,
  enabled,
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
    let lastModified = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleNext = () => {
      if (cancelled) return
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
    }

    const poll = async () => {
      if (cancelled) return
      if (document.hidden) {
        scheduleNext()
        return
      }

      try {
        const file = await fileHandle.getFile()
        if (cancelled) return

        if (file.lastModified > lastModified) {
          const content = await file.text()
          if (cancelled) return
          lastModified = file.lastModified
          onFileChangedRef.current(content, lastModified)
        }
      } catch (err) {
        if (cancelled) return
        onErrorRef.current?.(err)
        return
      }

      scheduleNext()
    }

    // Establish baseline immediately so the first external edit is detected
    // even if it happens before the first scheduled poll.
    ;(async () => {
      try {
        const file = await fileHandle.getFile()
        if (cancelled) return
        lastModified = file.lastModified
      } catch (err) {
        if (cancelled) return
        onErrorRef.current?.(err)
        return
      }
      scheduleNext()
    })()

    return () => {
      cancelled = true
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }, [fileHandle, enabled])
}
