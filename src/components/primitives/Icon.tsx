import { forwardRef } from "react"
import { cn } from "@/lib/utils"

type IconProps = {
  size?: number
  className?: string
  children: React.ReactNode
}

export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  function Icon({ size = 20, className, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn("inline-flex shrink-0 items-center justify-center", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        {children}
      </span>
    )
  }
)
