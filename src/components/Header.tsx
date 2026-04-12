import { useState } from "react"
import {
  Sun, Moon, Monitor, FileText, FileDown, FolderOpen, Palette, EllipsisVertical,
  Heart, Copyright, ExternalLink, Pencil, Eye, Clock, Trash2, ClipboardPaste,
  Save, Home, Download, Paintbrush,
} from "lucide-react"
import { Box, HStack, Text } from "@/components/primitives"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/hooks/useTheme"
import { useAccentColor } from "@/hooks/useAccentColor"
import type { RecentFile } from "@/hooks/useRecentFiles"

const SHIKI_THEMES = [
  { value: "github-dark", label: "GitHub Dark" },
  { value: "github-light", label: "GitHub Light" },
  { value: "one-dark-pro", label: "One Dark Pro" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "vitesse-dark", label: "Vitesse Dark" },
  { value: "vitesse-light", label: "Vitesse Light" },
  { value: "tokyo-night", label: "Tokyo Night" },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { value: "min-light", label: "Min Light" },
] as const

type HeaderProps = {
  filename: string | null
  shikiTheme: string
  editing: boolean
  hasFileHandle: boolean
  recentFiles: RecentFile[]
  onShikiThemeChange: (theme: string) => void
  onOpenFile: () => void
  onToggleEdit: () => void
  onOpenRecent: (name: string) => void
  onRemoveRecent: (name: string) => void
  onExportPdf: () => void
  onExportText: () => void
  onPaste: () => void
  onSave: () => void
  onSaveAs: () => void
  onGoHome: () => void
}

export function Header({
  filename,
  shikiTheme,
  editing,
  hasFileHandle,
  recentFiles,
  onShikiThemeChange,
  onOpenFile,
  onToggleEdit,
  onOpenRecent,
  onRemoveRecent,
  onExportPdf,
  onExportText,
  onPaste,
  onSave,
  onSaveAs,
  onGoHome,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { accentName, setAccent, accents } = useAccentColor()

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <Box
      as="header"
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm"
    >
      <HStack className="h-14 px-4 justify-between">
        {/* Left: Logo/Home + name + actions */}
        <HStack gap="gap-1.5">
          {filename ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onGoHome}
              className="active:scale-[0.97]"
              title="Home"
            >
              <Home className="h-4.5 w-4.5" />
              <span className="sr-only">Home</span>
            </Button>
          ) : (
            <>
              <Logo size={24} className="text-primary" />
              <Text as="span" className="font-semibold text-sm text-foreground mr-1">
                MD View
              </Text>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenFile}
            className="active:scale-[0.97]"
            title="Open file"
          >
            <FolderOpen className="h-4.5 w-4.5" />
            <span className="sr-only">Open file</span>
          </Button>
          {filename && (
            <Button
              variant={editing ? "default" : "ghost"}
              size="icon"
              onClick={onToggleEdit}
              className="active:scale-[0.97]"
              title={editing ? "Preview" : "Edit"}
            >
              {editing ? <Eye className="h-4.5 w-4.5" /> : <Pencil className="h-4.5 w-4.5" />}
              <span className="sr-only">{editing ? "Preview" : "Edit"}</span>
            </Button>
          )}
        </HStack>

        {/* Center: filename */}
        {filename && (
          <Text
            as="span"
            className="absolute left-1/2 -translate-x-1/2 max-w-[40%] truncate text-sm text-muted-foreground hidden sm:block"
          >
            {filename}
          </Text>
        )}

        {/* Right: save + theme toggle + 3-dot menu */}
        <HStack gap="gap-1">
          {editing && filename && (
            <Button
              variant="ghost"
              size="icon"
              onClick={hasFileHandle ? onSave : onSaveAs}
              className="active:scale-[0.97]"
              title={hasFileHandle ? "Save (Ctrl+S)" : "Save As (Ctrl+S)"}
            >
              <Save className="h-4.5 w-4.5" />
              <span className="sr-only">{hasFileHandle ? "Save" : "Save As"}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            className="active:scale-[0.97]"
            title={`Theme: ${theme}`}
          >
            {theme === "light" && <Sun className="h-4.5 w-4.5" />}
            {theme === "dark" && <Moon className="h-4.5 w-4.5" />}
            {theme === "system" && <Monitor className="h-4.5 w-4.5" />}
            <span className="sr-only">Toggle theme ({theme})</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="active:scale-[0.97]" />}>
                <EllipsisVertical className="h-4.5 w-4.5" />
                <span className="sr-only">More options</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onOpenFile}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Open File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPaste}>
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Paste Markdown
              </DropdownMenuItem>
              {filename && hasFileHandle && (
                <DropdownMenuItem onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </DropdownMenuItem>
              )}
              {filename && (
                <DropdownMenuItem onClick={onSaveAs}>
                  <Download className="h-4 w-4 mr-2" />
                  Save As
                </DropdownMenuItem>
              )}
              {recentFiles.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Files
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-60">
                    {recentFiles.map((f) => (
                      <RecentFileItem
                        key={`${f.name}-${f.openedAt}`}
                        file={f}
                        onOpen={() => onOpenRecent(f.name)}
                        onRemove={() => onRemoveRecent(f.name)}
                      />
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExportPdf} disabled={!filename}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportText} disabled={!filename}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4 mr-2" />
                  Syntax Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  {SHIKI_THEMES.map((t) => (
                    <DropdownMenuItem
                      key={t.value}
                      onClick={() => onShikiThemeChange(t.value)}
                    >
                      {shikiTheme === t.value && (
                        <Box className="w-1.5 h-1.5 rounded-full bg-primary mr-2 shrink-0" />
                      )}
                      <Text
                        as="span"
                        className={shikiTheme === t.value ? "font-medium" : "ml-[calc(0.375rem+0.5rem)]"}
                      >
                        {t.label}
                      </Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Paintbrush className="h-4 w-4 mr-2" />
                  Accent Color
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {accents.map((c) => (
                    <DropdownMenuItem
                      key={c.name}
                      onClick={() => setAccent(c.name)}
                    >
                      <Box
                        className="w-3.5 h-3.5 rounded-full mr-2 shrink-0 border border-border"
                        style={{ backgroundColor: c.light }}
                      />
                      <Text
                        as="span"
                        className={accentName === c.name ? "font-medium" : ""}
                      >
                        {c.name}
                      </Text>
                      {accentName === c.name && (
                        <Box className="w-1.5 h-1.5 rounded-full bg-primary ml-auto shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.open("https://github.com/TriptoAfsin/md-viewer-pwa", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                GitHub
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open("https://github.com/TriptoAfsin/md-viewer-pwa/issues", "_blank")}
              >
                <Heart className="h-4 w-4 mr-2" />
                Contribute / Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Box className="px-2 py-1.5">
                <Text as="span" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Copyright className="h-3 w-3" />
                  {new Date().getFullYear()} MD View &middot; MIT License
                </Text>
              </Box>
            </DropdownMenuContent>
          </DropdownMenu>
        </HStack>
      </HStack>
    </Box>
  )
}

function RecentFileItem({
  file,
  onOpen,
  onRemove,
}: {
  file: RecentFile
  onOpen: () => void
  onRemove: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <Box className="flex items-center gap-1 px-1.5 py-1">
        <Text as="span" className="text-xs text-muted-foreground flex-1">Remove?</Text>
        <Button
          variant="destructive"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            setConfirming(false)
          }}
        >
          No
        </Button>
      </Box>
    )
  }

  return (
    <Box className="flex items-center group">
      <DropdownMenuItem className="flex-1" onClick={onOpen}>
        <FileText className="h-4 w-4 mr-2 shrink-0" />
        <Text as="span" className="truncate">{file.name}</Text>
      </DropdownMenuItem>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          setConfirming(true)
        }}
      >
        <Trash2 className="h-3 w-3 text-muted-foreground" />
      </Button>
    </Box>
  )
}
