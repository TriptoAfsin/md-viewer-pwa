import {
  Sun, Moon, Monitor, FileText, FileDown, FolderOpen, Palette, EllipsisVertical,
  Heart, Copyright, ExternalLink,
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
  onShikiThemeChange: (theme: string) => void
  onOpenFile: () => void
  onExportPdf: () => void
  onExportText: () => void
}

export function Header({
  filename,
  shikiTheme,
  onShikiThemeChange,
  onOpenFile,
  onExportPdf,
  onExportText,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()

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
        {/* Left: Logo + name + open file */}
        <HStack gap="gap-1.5">
          <Logo size={24} className="text-primary" />
          <Text as="span" className="font-semibold text-sm text-foreground mr-1">
            MD View
          </Text>
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

        {/* Right: theme toggle + 3-dot menu */}
        <HStack gap="gap-1">
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
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="active:scale-[0.97]">
                <EllipsisVertical className="h-4.5 w-4.5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onOpenFile}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Open File
              </DropdownMenuItem>
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
