import { useState, useCallback, useEffect } from "react"

export type RecentFile = {
  name: string
  size: number
  openedAt: number
  /** Only available on browsers with File System Access API (Chrome/Edge) */
  hasHandle: boolean
}

type StoredRecentFile = {
  name: string
  size: number
  openedAt: number
}

const STORAGE_KEY = "md-view-recent-files"
const IDB_NAME = "md-view-db"
const IDB_STORE = "file-handles"
const MAX_FILES = 10

// --- localStorage for metadata ---

function getStored(): StoredRecentFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_FILES)
  } catch {
    return []
  }
}

function persistMeta(files: StoredRecentFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
  } catch {
    // localStorage unavailable
  }
}

// --- IndexedDB for file handles (FSAA) ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function storeHandle(name: string, handle: FileSystemFileHandle) {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_STORE, "readwrite")
    tx.objectStore(IDB_STORE).put(handle, name)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // IndexedDB unavailable or quota exceeded
  }
}

async function getHandle(name: string): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_STORE, "readonly")
    const req = tx.objectStore(IDB_STORE).get(name)
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

function supportsFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window
}

// --- Hook ---

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(() =>
    getStored().map((f) => ({ ...f, hasHandle: false }))
  )

  // Check which files have stored handles on mount
  useEffect(() => {
    if (!supportsFileSystemAccess()) return

    async function checkHandles() {
      const stored = getStored()
      const withHandles = await Promise.all(
        stored.map(async (f) => {
          const handle = await getHandle(f.name)
          return { ...f, hasHandle: !!handle }
        })
      )
      setRecentFiles(withHandles)
    }

    checkHandles()
  }, [])

  const addRecentFile = useCallback(
    (name: string, size: number, handle?: FileSystemFileHandle) => {
      // Store handle in IndexedDB if available
      if (handle && supportsFileSystemAccess()) {
        storeHandle(name, handle)
      }

      setRecentFiles((prev) => {
        const filtered = prev.filter((f) => f.name !== name)
        const next = [
          { name, size, openedAt: Date.now(), hasHandle: !!handle },
          ...filtered,
        ].slice(0, MAX_FILES)

        persistMeta(next.map(({ hasHandle: _, ...rest }) => rest))
        return next
      })
    },
    []
  )

  const openRecentFile = useCallback(
    async (name: string): Promise<{ content: string; name: string } | null> => {
      if (!supportsFileSystemAccess()) return null

      const handle = await getHandle(name)
      if (!handle) return null

      try {
        // Request permission (may prompt user)
        const permission = await handle.requestPermission({ mode: "read" })
        if (permission !== "granted") return null

        const file = await handle.getFile()
        const content = await file.text()
        return { content, name: file.name }
      } catch {
        return null
      }
    },
    []
  )

  const removeRecentFile = useCallback((name: string) => {
    setRecentFiles((prev) => {
      const next = prev.filter((f) => f.name !== name)
      persistMeta(next.map(({ hasHandle: _, ...rest }) => rest))
      return next
    })
    // Also remove handle from IndexedDB
    if (supportsFileSystemAccess()) {
      openDB().then((db) => {
        const tx = db.transaction(IDB_STORE, "readwrite")
        tx.objectStore(IDB_STORE).delete(name)
      }).catch(() => {})
    }
  }, [])

  return { recentFiles, addRecentFile, openRecentFile, removeRecentFile } as const
}
