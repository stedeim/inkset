import { ipcMain, shell } from 'electron'
import {
  formatManuscript,
  type FormatConfig,
  type FormatOptions,
  type FormatResult
} from '../services/kdpFormatService'

export function registerKdpFormatIpc(): void {
  ipcMain.handle(
    'kdp-format:run',
    async (
      _evt,
      payload: { config: FormatConfig; options?: FormatOptions }
    ): Promise<FormatResult> => {
      return formatManuscript(payload.config, payload.options)
    }
  )

  ipcMain.handle(
    'kdp-format:reveal',
    async (_evt, absolutePath: string): Promise<void> => {
      shell.showItemInFolder(absolutePath)
    }
  )
}
