import type { ElementType, ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

type TextProps<T extends ElementType = "p"> = {
  as?: T
  className?: string
  children?: React.ReactNode
} & ComponentPropsWithoutRef<T>

export function Text<T extends ElementType = "p">({ as, className, ...props }: TextProps<T>) {
  const Comp = as || "p"
  return <Comp className={cn(className)} {...(props as any)} />
}
