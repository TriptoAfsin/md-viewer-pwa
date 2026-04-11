import { type ComponentPropsWithRef, forwardRef } from "react"
import { cn } from "@/lib/utils"

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
type HeadingTag = `h${HeadingLevel}`

type TitleProps = {
  level?: HeadingLevel
  className?: string
} & Omit<ComponentPropsWithRef<"h1">, "className"> & {
  className?: string
}

export const Title = forwardRef<HTMLHeadingElement, TitleProps>(
  function Title({ level = 1, className, ...props }, ref) {
    const Tag = `h${level}` as HeadingTag
    return <Tag ref={ref} className={cn("font-semibold tracking-tight", className)} {...props} />
  }
)
