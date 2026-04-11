import { type ElementType, type ComponentPropsWithRef, forwardRef } from "react"
import { cn } from "@/lib/utils"

type StackProps<T extends ElementType = "div"> = {
  as?: T
  gap?: string
  className?: string
} & Omit<ComponentPropsWithRef<T>, "as" | "className"> & {
  className?: string
}

function StackInner<T extends ElementType = "div">(
  { as, gap = "gap-4", className, ...props }: StackProps<T>,
  ref: React.ForwardedRef<Element>
) {
  const Comp = as || "div"
  return <Comp ref={ref} className={cn("flex flex-col", gap, className)} {...props} />
}

export const Stack = forwardRef(StackInner) as <T extends ElementType = "div">(
  props: StackProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null
