import { type ElementType, type ComponentPropsWithRef, forwardRef } from "react"
import { cn } from "@/lib/utils"

type BoxProps<T extends ElementType = "div"> = {
  as?: T
  className?: string
} & Omit<ComponentPropsWithRef<T>, "as" | "className"> & {
  className?: string
}

function BoxInner<T extends ElementType = "div">(
  { as, className, ...props }: BoxProps<T>,
  ref: React.ForwardedRef<Element>
) {
  const Comp = as || "div"
  return <Comp ref={ref} className={cn(className)} {...props} />
}

export const Box = forwardRef(BoxInner) as <T extends ElementType = "div">(
  props: BoxProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null
