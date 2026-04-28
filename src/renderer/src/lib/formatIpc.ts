// Renderer-side typed wrapper for the KDP formatter IPC channels.
// Types mirror src/main/services/kdpFormatService.ts.

export type TrimSize =
  | '5x8'
  | '5.25x8'
  | '5.5x8.5'
  | '6x9'
  | '6.14x9.21'
  | '7x10'

export const TRIM_SIZES: { value: TrimSize; label: string }[] = [
  { value: '5x8', label: '5" × 8"' },
  { value: '5.25x8', label: '5.25" × 8"' },
  { value: '5.5x8.5', label: '5.5" × 8.5"' },
  { value: '6x9', label: '6" × 9" (default)' },
  { value: '6.14x9.21', label: '6.14" × 9.21"' },
  { value: '7x10', label: '7" × 10"' }
]

export const TRIM_DIMS_IN: Record<TrimSize, { widthIn: number; heightIn: number }> = {
  '5x8': { widthIn: 5, heightIn: 8 },
  '5.25x8': { widthIn: 5.25, heightIn: 8 },
  '5.5x8.5': { widthIn: 5.5, heightIn: 8.5 },
  '6x9': { widthIn: 6, heightIn: 9 },
  '6.14x9.21': { widthIn: 6.14, heightIn: 9.21 },
  '7x10': { widthIn: 7, heightIn: 10 }
}

export type FormatConfig = {
  title: string
  author: string
  subtitle?: string
  dedication?: string
  trimSize: TrimSize
  manuscriptText: string
  chapterDelimiter?: string
}

export type FormatOptions = {
  pdf?: boolean
  epub?: boolean
}

export type FormatResult = {
  pdfPath: string | null
  epubPath: string | null
  chapterCount: number
  pageCount: number | null
  warnings: string[]
}

type KdpFormatBridge = {
  run: (payload: { config: FormatConfig; options?: FormatOptions }) => Promise<FormatResult>
  reveal: (absolutePath: string) => Promise<void>
}

function bridge(): KdpFormatBridge {
  return window.api.kdpFormat as unknown as KdpFormatBridge
}

export async function runFormat(
  config: FormatConfig,
  options: FormatOptions
): Promise<FormatResult> {
  return bridge().run({ config, options })
}

export async function revealInFinder(path: string): Promise<void> {
  return bridge().reveal(path)
}
