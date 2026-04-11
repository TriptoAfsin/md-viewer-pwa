import type { ElementType, ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

type StackProps<T extends ElementType = "div"> = {
  as?: T
  gap?: string
  className?: string
  children?: React.ReactNode
} & ComponentPropsWithoutRef<T>

export function Stack<T extends ElementType = "div">({ as, gap = "gap-4", className, ...props }: StackProps<T>) {
  const Comp = as || "div"
  return <Comp className={cn("flex flex-col", gap, className)} {...(props as any)} />
}
