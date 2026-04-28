import { ipcMain, BrowserWindow, shell } from 'electron'
import {
  generateCover,
  regenerateCoverArt,
  generateCoverFromUpload,
  type CoverInput,
  type CoverProgress,
  type CoverResult
} from '../services/coverService'

export type CoverStartPayload = {
  jobId: string
  input: CoverInput
}

export type CoverRerollPayload = {
  jobId: string
  input: CoverInput
  prompts: string[]
  chosenPromptIndex: number
}

export type CoverUploadPayload = {
  jobId: string
  input: CoverInput
  artBase64: string
}

export type CoverProgressEvent = CoverProgress & { jobId: string }

export type CoverCompleteEvent =
  | { jobId: string; ok: true; result: CoverResult }
  | { jobId: string; ok: false; error: string }

function emitProgress(
  window: BrowserWindow | null,
  jobId: string,
  progress: CoverProgress
): void {
  if (!window || window.isDestroyed()) return
  const event: CoverProgressEvent = { jobId, ...progress }
  window.webContents.send('cover:progress', event)
}

function emitComplete(
  window: BrowserWindow | null,
  event: CoverCompleteEvent
): void {
  if (!window || window.isDestroyed()) return
  window.webContents.send('cover:complete', event)
}

export function registerCoverIpc(): void {
  ipcMain.on('cover:start', (event, payload: CoverStartPayload) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    generateCover(payload.input, (p) => emitProgress(window, payload.jobId, p))
      .then((result) => emitComplete(window, { jobId: payload.jobId, ok: true, result }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        emitComplete(window, { jobId: payload.jobId, ok: false, error: message })
      })
  })

  ipcMain.on('cover:reroll', (event, payload: CoverRerollPayload) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    regenerateCoverArt(
      payload.input,
      payload.prompts,
      payload.chosenPromptIndex,
      (p) => emitProgress(window, payload.jobId, p)
    )
      .then((result) => emitComplete(window, { jobId: payload.jobId, ok: true, result }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        emitComplete(window, { jobId: payload.jobId, ok: false, error: message })
      })
  })

  ipcMain.on('cover:upload', (event, payload: CoverUploadPayload) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    let buffer: Buffer
    try {
      buffer = Buffer.from(payload.artBase64, 'base64')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      emitComplete(window, {
        jobId: payload.jobId,
        ok: false,
        error: `Failed to decode uploaded art: ${message}`
      })
      return
    }
    generateCoverFromUpload(payload.input, buffer, (p) =>
      emitProgress(window, payload.jobId, p)
    )
      .then((result) => emitComplete(window, { jobId: payload.jobId, ok: true, result }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        emitComplete(window, { jobId: payload.jobId, ok: false, error: message })
      })
  })

  ipcMain.handle('cover:reveal', async (_e, path: string): Promise<void> => {
    shell.showItemInFolder(path)
  })
}
