import { useState, useEffect } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches)
    check()
    const mql = window.matchMedia("(pointer: coarse)")
    mql.addEventListener("change", check)
    return () => mql.removeEventListener("change", check)
  }, [])

  return isMobile
}
