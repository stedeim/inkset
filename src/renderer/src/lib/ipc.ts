// Renderer-side typed wrapper around window.api.editing.
// Types mirror src/main/services/editingService.ts and src/main/ipc/editingIpc.ts.

export type PassName = 'grammar' | 'style' | 'clarity'

export type EditProgress = {
  pass: 1 | 2 | 3
  passName: PassName
  tokensUsed: number
  percentComplete: number
  /** Text streamed from Claude since the previous progress event. */
  deltaText?: string
  /** First event for a given pass — UI should emit a pass header. */
  passStart?: boolean
}

export type PassResult = {
  name: PassName
  input: string
  output: string
  tokensIn: number
  tokensOut: number
  durationMs: number
}

export type EditedManuscript = {
  originalContent: string
  editedContent: string
  passes: PassResult[]
  totalTokensIn: number
  totalTokensOut: number
  estimatedCostUsd: number
}

export type EditingProgressEvent = EditProgress & { jobId: string }

export type EditingCompleteEvent =
  | { jobId: string; ok: true; result: EditedManuscript }
  | {
      jobId: string
      ok: false
      error: string
      failedPass: PassName | null
      completedPasses: PassResult[]
    }

export type SaveEditedResult = {
  path: string
  bytesWritten: number
}

function api(): {
  newJobId: () => Promise<string>
  start: (payload: { jobId: string; content: string }) => void
  save: (payload: { filename: string; content: string }) => Promise<SaveEditedResult>
  onProgress: (cb: (e: EditingProgressEvent) => void) => () => void
  onComplete: (cb: (e: EditingCompleteEvent) => void) => () => void
} {
  const bridge = window.api.editing as unknown as {
    newJobId: () => Promise<string>
    start: (payload: { jobId: string; content: string }) => void
    save: (payload: { filename: string; content: string }) => Promise<SaveEditedResult>
    onProgress: (cb: (e: EditingProgressEvent) => void) => () => void
    onComplete: (cb: (e: EditingCompleteEvent) => void) => () => void
  }
  return bridge
}

export async function startEditing(content: string): Promise<string> {
  const jobId = await api().newJobId()
  api().start({ jobId, content })
  return jobId
}

export function subscribeToProgress(
  cb: (e: EditingProgressEvent) => void
): () => void {
  return api().onProgress(cb)
}

export function subscribeToComplete(
  cb: (e: EditingCompleteEvent) => void
): () => void {
  return api().onComplete(cb)
}

export async function saveEdited(
  filename: string,
  content: string
): Promise<SaveEditedResult> {
  return api().save({ filename, content })
}
