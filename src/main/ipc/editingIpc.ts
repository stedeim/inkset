import { ipcMain, BrowserWindow } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import {
  editManuscript,
  type EditedManuscript,
  type EditProgress,
  EditingError
} from '../services/editingService'
import { editedDir } from '../util/paths'

export type StartEditingPayload = {
  jobId: string
  content: string
}

export type EditingProgressEvent = EditProgress & { jobId: string }

export type EditingCompleteEvent =
  | { jobId: string; ok: true; result: EditedManuscript }
  | {
      jobId: string
      ok: false
      error: string
      failedPass: string | null
      completedPasses: EditedManuscript['passes']
    }

export type SaveEditedPayload = {
  filename: string
  content: string
}

export type SaveEditedResult = {
  path: string
  bytesWritten: number
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\.[^.]+$/, '')
}

async function handleSave(payload: SaveEditedPayload): Promise<SaveEditedResult> {
  const dir = editedDir()
  const base = sanitizeFilename(payload.filename) || 'manuscript'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outPath = join(dir, `${base}-edited-${timestamp}.txt`)
  await writeFile(outPath, payload.content, 'utf-8')
  return { path: outPath, bytesWritten: Buffer.byteLength(payload.content, 'utf-8') }
}

export function registerEditingIpc(): void {
  // Invoke-style run (returns full result).
  ipcMain.handle(
    'editing:run',
    async (_evt, content: string): Promise<EditedManuscript> => {
      return editManuscript(content, () => {
        /* no-op: caller using invoke; use editing:start for streamed progress */
      })
    }
  )

  // Fire-and-forget streaming run.
  ipcMain.on('editing:start', (event, payload: StartEditingPayload) => {
    const { jobId, content } = payload
    const sender = BrowserWindow.fromWebContents(event.sender)
    if (!sender) return

    const onProgress = (update: EditProgress): void => {
      if (sender.isDestroyed()) return
      const progressEvent: EditingProgressEvent = { jobId, ...update }
      sender.webContents.send('editing:progress', progressEvent)
    }

    editManuscript(content, onProgress)
      .then((result) => {
        if (sender.isDestroyed()) return
        const done: EditingCompleteEvent = { jobId, ok: true, result }
        sender.webContents.send('editing:complete', done)
      })
      .catch((err: unknown) => {
        if (sender.isDestroyed()) return
        const message = err instanceof Error ? err.message : String(err)
        const done: EditingCompleteEvent = {
          jobId,
          ok: false,
          error: message,
          failedPass: err instanceof EditingError ? err.pass : null,
          completedPasses: err instanceof EditingError ? err.completedPasses : []
        }
        sender.webContents.send('editing:complete', done)
      })
  })

  // Save the edited manuscript to output/edited/.
  ipcMain.handle(
    'editing:save',
    async (_evt, payload: SaveEditedPayload): Promise<SaveEditedResult> => {
      return handleSave(payload)
    }
  )

  // Utility: generate a job id in main (so renderer doesn't need uuid dep).
  ipcMain.handle('editing:new-job-id', (): string => uuidv4())
}
