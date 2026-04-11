import { type ElementType, type ComponentPropsWithRef, forwardRef } from "react"
import { cn } from "@/lib/utils"

type HStackProps<T extends ElementType = "div"> = {
  as?: T
  gap?: string
  className?: string
} & Omit<ComponentPropsWithRef<T>, "as" | "className"> & {
  className?: string
}

function HStackInner<T extends ElementType = "div">(
  { as, gap = "gap-4", className, ...props }: HStackProps<T>,
  ref: React.ForwardedRef<Element>
) {
  const Comp = as || "div"
  return <Comp ref={ref} className={cn("flex flex-row items-center", gap, className)} {...props} />
}

export const HStack = forwardRef(HStackInner) as <T extends ElementType = "div">(
  props: HStackProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null
