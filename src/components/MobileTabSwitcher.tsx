import { Plus, X } from "lucide-react"
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
}

export function MobileTabSwitcher({
  open,
  onOpenChange,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
}: MobileTabSwitcherProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] flex flex-col p-0"
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

        {/* Card grid */}
        <Box className="flex-1 overflow-y-auto p-4">
          <Box className="grid grid-cols-2 gap-3">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId
              const preview = tab.markdown?.slice(0, 120) || ""
              return (
                <Box
                  key={tab.id}
                  as="button"
                  onClick={() => onSwitchTab(tab.id)}
                  className={[
                    "relative rounded-xl border-2 bg-card p-3 text-left cursor-pointer transition-colors aspect-[3/4] flex flex-col overflow-hidden",
                    isActive
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground/30",
                  ].join(" ")}
                >
                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseTab(tab.id)
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full cursor-pointer bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Close tab"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {/* Tab name */}
                  <HStack gap="gap-1" className="mb-2 pr-6">
                    {tab.dirty && (
                      <Box className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <Text
                      as="span"
                      className="text-sm font-medium text-foreground truncate"
                    >
                      {tab.filename || "Untitled"}
                    </Text>
                  </HStack>

                  {/* Preview snippet */}
                  <Text className="text-xs text-muted-foreground line-clamp-6 flex-1">
                    {preview || "Empty"}
                  </Text>

                  {/* Edit mode indicator */}
                  {tab.editing && (
                    <Text className="text-[10px] text-primary font-medium mt-1">
                      Editing
                    </Text>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      </SheetContent>
    </Sheet>
  )
}
