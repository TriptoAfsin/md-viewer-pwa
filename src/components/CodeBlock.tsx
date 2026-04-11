import { useState, useCallback, useEffect, useRef } from "react"
import { Check, Copy } from "lucide-react"
import { Box, HStack, Text } from "@/components/primitives"
import { Button } from "@/components/ui/button"

type CodeBlockProps = {
  children: string
  language?: string
  highlightedHtml?: string
}

export function CodeBlock({ children, language, highlightedHtml }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }, [children])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return (
    <Box className="group relative my-4 rounded-lg border border-border overflow-hidden">
      {/* Header bar */}
      <HStack className="h-9 px-3 justify-between bg-muted/50 border-b border-border">
        <Text as="span" className="text-xs text-muted-foreground font-mono">
          {language || "text"}
        </Text>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity active:scale-[0.97]"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500 transition-transform duration-200 scale-100 animate-in zoom-in-50" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">Copy code</span>
        </Button>
      </HStack>

      {/* Code content */}
      {highlightedHtml ? (
        <Box
          className="overflow-x-auto p-4 text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <Box as="pre" className="overflow-x-auto p-4 text-sm leading-relaxed bg-muted/30">
          <code className="font-mono !bg-transparent">{children}</code>
        </Box>
      )}
    </Box>
  )
}
