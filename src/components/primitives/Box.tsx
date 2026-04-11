import type { ElementType, ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

type BoxProps<T extends ElementType = "div"> = {
  as?: T
  className?: string
  children?: React.ReactNode
} & ComponentPropsWithoutRef<T>

export function Box<T extends ElementType = "div">({ as, className, ...props }: BoxProps<T>) {
  const Comp = as || "div"
  return <Comp className={cn(className)} {...(props as any)} />
}
