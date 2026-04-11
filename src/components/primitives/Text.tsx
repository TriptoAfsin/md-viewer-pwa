import { type ElementType, type ComponentPropsWithRef, forwardRef } from "react"
import { cn } from "@/lib/utils"

type TextProps<T extends ElementType = "p"> = {
  as?: T
  className?: string
} & Omit<ComponentPropsWithRef<T>, "as" | "className"> & {
  className?: string
}

function TextInner<T extends ElementType = "p">(
  { as, className, ...props }: TextProps<T>,
  ref: React.ForwardedRef<Element>
) {
  const Comp = as || "p"
  return <Comp ref={ref} className={cn(className)} {...props} />
}

export const Text = forwardRef(TextInner) as <T extends ElementType = "p">(
  props: TextProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null
