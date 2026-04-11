import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import { FolderOpen, FileDown, FileText, ClipboardCopy } from "lucide-react"
import { Box, Text, Title } from "@/components/primitives"
import { CodeBlock } from "@/components/CodeBlock"
import { ShikiCodeBlock } from "@/components/ShikiCodeBlock"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { useShiki } from "@/hooks/useShiki"
import { toast } from "sonner"
import type { Components } from "react-markdown"

type MarkdownViewProps = {
  content: string
  filename: string | null
  shikiTheme: string
  onOpenFile: () => void
  onExportPdf: () => void
  onExportText: () => void
}

export function MarkdownView({
  content,
  filename,
  shikiTheme,
  onOpenFile,
  onExportPdf,
  onExportText,
}: MarkdownViewProps) {
  const hasCodeBlocks = useMemo(() => /```[\s\S]*?```/.test(content), [content])
  const { highlight, ready } = useShiki(shikiTheme, hasCodeBlocks)

  const handleCopySelection = () => {
    const selection = window.getSelection()?.toString()
    if (selection) {
      navigator.clipboard.writeText(selection)
      toast.success("Copied to clipboard")
    }
  }

  const components: Components = useMemo(
    () => ({
      h1: ({ children, id }) => (
        <Title level={1} id={id} className="text-3xl mt-8 mb-4 pb-2 border-b border-border text-foreground">
          {children}
        </Title>
      ),
      h2: ({ children, id }) => (
        <Title level={2} id={id} className="text-2xl mt-6 mb-3 pb-1.5 border-b border-border text-foreground">
          {children}
        </Title>
      ),
      h3: ({ children, id }) => (
        <Title level={3} id={id} className="text-xl mt-5 mb-2 text-foreground">
          {children}
        </Title>
      ),
      h4: ({ children, id }) => (
        <Title level={4} id={id} className="text-lg mt-4 mb-2 text-foreground">
          {children}
        </Title>
      ),
      h5: ({ children, id }) => (
        <Title level={5} id={id} className="text-base mt-3 mb-1 text-foreground">
          {children}
        </Title>
      ),
      h6: ({ children, id }) => (
        <Title level={6} id={id} className="text-sm mt-3 mb-1 text-muted-foreground">
          {children}
        </Title>
      ),
      p: ({ children }) => (
        <Text className="my-3 leading-7 text-foreground break-words">{children}</Text>
      ),
      a: ({ href, children }) => {
        const isAnchor = href?.startsWith("#")
        return (
          <a
            href={href}
            {...(isAnchor
              ? {
                  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    const id = href!.slice(1)
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
                  },
                }
              : { target: "_blank", rel: "noopener noreferrer" })}
            className="text-primary underline-offset-4 hover:underline transition-colors break-all"
          >
            {children}
          </a>
        )
      },
      blockquote: ({ children }) => (
        <Box
          as="blockquote"
          className="my-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground"
        >
          {children}
        </Box>
      ),
      ul: ({ children }) => (
        <Box as="ul" className="my-3 ml-6 list-disc space-y-1 text-foreground">
          {children}
        </Box>
      ),
      ol: ({ children }) => (
        <Box as="ol" className="my-3 ml-6 list-decimal space-y-1 text-foreground">
          {children}
        </Box>
      ),
      li: ({ children }) => (
        <Box as="li" className="leading-7">{children}</Box>
      ),
      hr: () => <Box as="hr" className="my-6 border-t border-border" />,
      img: ({ src, alt }) => (
        <Box
          as="img"
          className="max-w-full rounded-lg my-4"
          src={src}
          alt={alt || ""}
          loading="lazy"
        />
      ),
      table: ({ children }) => (
        <Box className="my-4 overflow-x-auto">
          <Box
            as="table"
            className="w-full border-collapse text-sm"
          >
            {children}
          </Box>
        </Box>
      ),
      thead: ({ children }) => (
        <Box as="thead" className="border-b-2 border-border">
          {children}
        </Box>
      ),
      th: ({ children }) => (
        <Box as="th" className="px-3 py-2 text-left font-semibold text-foreground">
          {children}
        </Box>
      ),
      tr: ({ children }) => (
        <Box as="tr" className="border-b border-border even:bg-muted/30">
          {children}
        </Box>
      ),
      td: ({ children }) => (
        <Box as="td" className="px-3 py-2 text-foreground">
          {children}
        </Box>
      ),
      code: ({ className, children }) => {
        const match = /language-(\w+)/.exec(className || "")
        const lang = match?.[1]
        const codeString = String(children).replace(/\n$/, "")

        // Inline code
        if (!lang && !className) {
          return (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground break-all">
              {children}
            </code>
          )
        }

        // Code block with Shiki
        if (lang && ready) {
          return (
            <ShikiCodeBlock language={lang} highlight={highlight}>
              {codeString}
            </ShikiCodeBlock>
          )
        }

        // Code block fallback
        return <CodeBlock language={lang}>{codeString}</CodeBlock>
      },
      pre: ({ children }) => <>{children}</>,
    }),
    [ready, highlight]
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 w-full overflow-x-hidden animate-in fade-in duration-300">
          {/* Mobile filename */}
          {filename && (
            <Text className="text-xs text-muted-foreground mb-6 sm:hidden truncate">
              {filename}
            </Text>
          )}

          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
            {content}
          </ReactMarkdown>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 animate-in fade-in slide-in-from-top-1 duration-150">
        <ContextMenuItem onClick={handleCopySelection}>
          <ClipboardCopy className="h-4 w-4 mr-2" />
          Copy Selection
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onExportPdf}>
          <FileDown className="h-4 w-4 mr-2" />
          Export as PDF
        </ContextMenuItem>
        <ContextMenuItem onClick={onExportText}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Text
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onOpenFile}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Open New File
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
