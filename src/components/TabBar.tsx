import { useRef, useEffect, useState } from "react"
import { FileText, X, Plus } from "lucide-react"
import { Box, HStack, Text } from "@/components/primitives"
import { Button } from "@/components/ui/button"
import { MAX_TABS, type Tab } from "@/App"

type TabBarProps = {
  tabs: Tab[]
  activeTabId: string | null
  onSwitchTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
  onRenameTab: (id: string, newName: string) => void
}

export function TabBar({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  onRenameTab,
}: TabBarProps) {
  const activeRef = useRef<HTMLButtonElement>(null)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll active tab into view when it changes
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    })
  }, [activeTabId])

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingTabId) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editingTabId])

  const startRename = (tab: Tab) => {
    setEditingTabId(tab.id)
    setEditValue(tab.filename || "Untitled")
  }

  const commitRename = () => {
    if (editingTabId && editValue.trim()) {
      onRenameTab(editingTabId, editValue.trim())
    }
    setEditingTabId(null)
  }

  const cancelRename = () => {
    setEditingTabId(null)
  }

  const atLimit = tabs.length >= MAX_TABS
  const nearLimit = tabs.length >= MAX_TABS * 0.8

  return (
    <Box className="border-b border-border bg-background/80 backdrop-blur-sm w-full min-w-0 overflow-hidden">
      <HStack gap="gap-0" className="h-9 min-w-0">
        <HStack
          gap="gap-0"
          className="h-9 flex-1 min-w-0 overflow-x-auto scrollbar-thin"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            const isEditing = tab.id === editingTabId
            return (
              <button
                key={tab.id}
                ref={isActive ? activeRef : undefined}
                onClick={() => onSwitchTab(tab.id)}
                onMouseDown={(e) => {
                  // Suppress the middle-click autoscroll cursor
                  if (e.button === 1) e.preventDefault()
                }}
                onAuxClick={(e) => {
                  if (e.button !== 1) return
                  e.preventDefault()
                  onCloseTab(tab.id)
                }}
                onDoubleClick={(e) => {
                  e.preventDefault()
                  startRename(tab)
                }}
                className={[
                  "group flex items-center gap-1.5 px-3 h-9 max-w-[180px] min-w-[70px] text-sm border-b-2 cursor-pointer transition-colors",
                  isActive
                    ? "border-primary bg-muted/50 text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30",
                ].join(" ")}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {tab.dirty && (
                  <Box className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename()
                      if (e.key === "Escape") cancelRename()
                      e.stopPropagation()
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className="truncate text-xs bg-transparent border-b border-primary outline-none w-full min-w-0"
                  />
                ) : (
                  <Text
                    as="span"
                    className="truncate text-xs"
                    title="Double-click to rename"
                  >
                    {tab.filename || "Untitled"}
                  </Text>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCloseTab(tab.id)
                  }}
                  className={[
                    "ml-auto p-0.5 rounded cursor-pointer shrink-0 transition-all",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  ].join(" ")}
                  title="Close tab (middle-click or Ctrl+W)"
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            )
          })}
        </HStack>
        <HStack
          gap="gap-1"
          className="shrink-0 h-9 px-1.5 border-l border-border bg-background/80"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNewTab}
            disabled={atLimit}
            className="shrink-0"
            title={atLimit ? `Maximum ${MAX_TABS} tabs open` : "New tab (Ctrl+T)"}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only">New tab</span>
          </Button>
          <Text
            as="span"
            className={[
              "text-[11px] tabular-nums px-1.5 py-0.5 rounded select-none",
              atLimit
                ? "text-destructive font-medium"
                : nearLimit
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
            ].join(" ")}
            title={`${tabs.length} of ${MAX_TABS} tabs open`}
          >
            {tabs.length}/{MAX_TABS}
          </Text>
        </HStack>
      </HStack>
    </Box>
  )
}
