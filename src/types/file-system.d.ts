interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  readonly name: string
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
  requestPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<"granted" | "denied" | "prompt">
}

interface FilePickerTypeOption {
  description?: string
  accept: Record<string, string[]>
}

interface ShowOpenFilePickerOptions {
  types?: FilePickerTypeOption[]
  multiple?: boolean
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string
  types?: FilePickerTypeOption[]
}

interface Window {
  showOpenFilePicker?: (options?: ShowOpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>
}
