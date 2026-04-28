import { ipcMain } from 'electron'
import {
  readMaskedKeys,
  writeUserKeys,
  type MaskedKeys
} from '../services/envService'

export type SetKeysPayload = {
  ANTHROPIC_API_KEY?: string
  OPENAI_API_KEY?: string
  OPENROUTER_API_KEY?: string
}

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get-keys', async (): Promise<MaskedKeys> => {
    return readMaskedKeys()
  })
  ipcMain.handle(
    'settings:set-keys',
    async (_evt, payload: SetKeysPayload): Promise<MaskedKeys> => {
      return writeUserKeys(payload)
    }
  )
}
