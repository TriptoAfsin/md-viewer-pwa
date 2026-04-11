interface FileSystemFileHandle {
  getFile(): Promise<File>
  requestPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<"granted" | "denied" | "prompt">
}

interface ShowOpenFilePickerOptions {
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  multiple?: boolean
}

interface Window {
  showOpenFilePicker?: (options?: ShowOpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
}
