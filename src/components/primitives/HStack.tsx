import type { ElementType, ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

type HStackProps<T extends ElementType = "div"> = {
  as?: T
  gap?: string
  className?: string
  children?: React.ReactNode
} & ComponentPropsWithoutRef<T>

export function HStack<T extends ElementType = "div">({ as, gap = "gap-4", className, ...props }: HStackProps<T>) {
  const Comp = as || "div"
  return <Comp className={cn("flex flex-row items-center", gap, className)} {...(props as any)} />
}
