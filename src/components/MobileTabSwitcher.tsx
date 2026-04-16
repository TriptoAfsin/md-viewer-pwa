import { useState, useRef, useEffect } from "react"
import { Plus, X, Pencil, Check } from "lucide-react"
import { Box, HStack, Text } from "@/components/primitives"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Tab } from "@/App"

type MobileTabSwitcherProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tabs: Tab[]
  activeTabId: string | null
  onSwitchTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
  onRenameTab: (id: string, newName: string) => void
}

export function MobileTabSwitcher({
  open,
  onOpenChange,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  onRenameTab,
}: MobileTabSwitcherProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingTabId) {
      // Delay focus slightly so the input is mounted and visible
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [editingTabId])

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) setEditingTabId(null)
  }, [open])

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="h-full w-[85vw] max-w-sm flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <HStack className="h-14 px-4 justify-between border-b border-border shrink-0">
          <SheetTitle className="text-sm font-medium">
            {tabs.length} {tabs.length === 1 ? "tab" : "tabs"}
          </SheetTitle>
          <HStack gap="gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNewTab}
              title="New tab"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </HStack>
        </HStack>

        {/* Tab list */}
        <Box className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            const isEditing = tab.id === editingTabId
            return (
              <Box key={tab.id} className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    if (!isEditing) onSwitchTab(tab.id)
                  }}
                  className={[
                    "flex items-center w-full px-3 py-2.5 rounded-lg border text-left cursor-pointer transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  ].join(" ")}
                >
                  {tab.dirty && (
                    <Box className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mr-2" />
                  )}
                  <Text
                    as="span"
                    className={[
                      "text-sm truncate flex-1",
                      isActive ? "font-medium" : "",
                    ].join(" ")}
                  >
                    {tab.filename || "Untitled"}
                  </Text>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isEditing) {
                        cancelRename()
                      } else {
                        startRename(tab)
                      }
                    }}
                    className={[
                      "p-1 rounded cursor-pointer shrink-0 ml-1 transition-colors",
                      isEditing
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    ].join(" ")}
                    title="Rename tab"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseTab(tab.id)
                    }}
                    className="p-1 rounded cursor-pointer shrink-0 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Close tab"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </button>

                {/* Rename input row — shown below the tab when editing */}
                {isEditing && (
                  <HStack gap="gap-1.5" className="px-1">
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename()
                        if (e.key === "Escape") cancelRename()
                      }}
                      className="flex-1 min-w-0 text-sm px-2.5 py-1.5 rounded-md border border-primary bg-background outline-none"
                      placeholder="Enter name..."
                    />
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 px-2.5 shrink-0"
                      onClick={commitRename}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Save
                    </Button>
                  </HStack>
                )}
              </Box>
            )
          })}
        </Box>
      </SheetContent>
    </Sheet>
  )
}
