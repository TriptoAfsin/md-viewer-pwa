import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Detect chunk load failures (stale SW cache serving old HTML for missing JS/CSS)
// and auto-recover by clearing caches and reloading
function handleChunkError(message: string) {
  if (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk')
  ) {
    // Avoid infinite reload loop
    const lastRecovery = sessionStorage.getItem('chunk-error-recovery')
    if (lastRecovery && Date.now() - Number(lastRecovery) < 30000) return

    sessionStorage.setItem('chunk-error-recovery', String(Date.now()))
    console.warn('[PWA Recovery] Chunk load failed. Clearing caches...')

    const tasks: Promise<unknown>[] = []
    if ('serviceWorker' in navigator) {
      tasks.push(
        navigator.serviceWorker.getRegistrations().then(regs =>
          Promise.all(regs.map(r => r.unregister()))
        )
      )
    }
    if ('caches' in window) {
      tasks.push(
        caches.keys().then(names =>
          Promise.all(names.map(n => caches.delete(n)))
        )
      )
    }
    Promise.all(tasks).finally(() => {
      window.location.reload()
    })
  }
}

window.addEventListener('error', (event) => {
  if (event.message) handleChunkError(event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason || '')
  handleChunkError(message)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
