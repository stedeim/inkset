// Renderer-side typed wrapper for the cover designer IPC channels.
// Mirrors src/main/services/coverService.ts types.

export type PaperColor = 'white' | 'cream'

export type Trim = { widthIn: number; heightIn: number }

export type CoverInput = {
  title: string
  subtitle?: string
  author: string
  genre?: string
  mood?: string
  trim: Trim
  pageCount: number
  paperColor: PaperColor
  blurb?: string
  authorBio?: string
}

export type CoverProgress =
  | { step: 'concept'; message: string }
  | { step: 'art'; message: string; artDataUrl?: string }
  | { step: 'front'; message: string }
  | { step: 'back'; message: string }
  | { step: 'spine'; message: string }
  | { step: 'wrap'; message: string }
  | { step: 'done'; message: string }

export type CoverProgressEvent = CoverProgress & { jobId: string }

export type RGB = { r: number; g: number; b: number }

export type CoverResult = {
  slug: string
  timestamp: string
  prompts: string[]
  chosenPromptIndex: number
  artPath: string
  frontPngPath: string
  backPngPath: string
  spinePngPath: string
  wrapPdfPath: string
  frontPdfPath: string
  thumbnails: {
    art: string
    front: string
    back: string
    spine: string
  }
  dimensions: {
    trim: Trim
    spine: { widthIn: number }
    wrap: { widthIn: number; heightIn: number; widthPx: number; heightPx: number }
  }
  dominantColor: RGB
  warnings: string[]
}

export type CoverCompleteEvent =
  | { jobId: string; ok: true; result: CoverResult }
  | { jobId: string; ok: false; error: string }

type CoverBridge = {
  start: (payload: { jobId: string; input: CoverInput }) => void
  reroll: (payload: {
    jobId: string
    input: CoverInput
    prompts: string[]
    chosenPromptIndex: number
  }) => void
  upload: (payload: { jobId: string; input: CoverInput; artBase64: string }) => void
  reveal: (path: string) => Promise<void>
  onProgress: (cb: (e: CoverProgressEvent) => void) => () => void
  onComplete: (cb: (e: CoverCompleteEvent) => void) => () => void
}

function bridge(): CoverBridge {
  return window.api.cover as unknown as CoverBridge
}

function newJobId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `job-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function startCover(input: CoverInput): string {
  const jobId = newJobId()
  bridge().start({ jobId, input })
  return jobId
}

export function rerollCover(
  input: CoverInput,
  prompts: string[],
  chosenPromptIndex: number
): string {
  const jobId = newJobId()
  bridge().reroll({ jobId, input, prompts, chosenPromptIndex })
  return jobId
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  // btoa on binary string; chunked to avoid stack overflow on large files.
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export async function uploadCover(
  input: CoverInput,
  file: File
): Promise<string> {
  const artBase64 = await fileToBase64(file)
  const jobId = newJobId()
  bridge().upload({ jobId, input, artBase64 })
  return jobId
}

export function subscribeCoverProgress(
  cb: (e: CoverProgressEvent) => void
): () => void {
  return bridge().onProgress(cb)
}

export function subscribeCoverComplete(
  cb: (e: CoverCompleteEvent) => void
): () => void {
  return bridge().onComplete(cb)
}

export function revealCover(path: string): Promise<void> {
  return bridge().reveal(path)
}
