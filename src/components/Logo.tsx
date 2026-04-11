import { cn } from "@/lib/utils"

type LogoProps = {
  size?: number
  className?: string
}

export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect x="6" y="2" width="36" height="44" rx="4" fill="currentColor" opacity="0.15" />
      <rect x="6" y="2" width="36" height="44" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <line x1="14" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="14" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="14" y1="26" x2="30" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      <path d="M28 8L18 25h8l-4 15L34 22h-8l2-14z" fill="currentColor" />
    </svg>
  )
}
