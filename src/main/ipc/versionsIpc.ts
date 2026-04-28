import { ipcMain } from 'electron'
import {
  createVersion,
  listVersions,
  getVersion,
  deleteVersion,
  pruneOld,
  type CreateVersionInput,
  type VersionRow,
  type VersionWithContent
} from '../services/versionsService'

export function registerVersionsIpc(): void {
  ipcMain.handle(
    'versions:create',
    async (_evt, input: CreateVersionInput): Promise<VersionRow> => {
      const row = createVersion(input)
      // Cap runaway growth — keep newest 200 per project.
      pruneOld(input.projectId, 200)
      return row
    }
  )

  ipcMain.handle(
    'versions:list',
    async (_evt, projectId: string, limit?: number): Promise<VersionRow[]> => {
      return listVersions(projectId, limit ?? 200)
    }
  )

  ipcMain.handle(
    'versions:get',
    async (_evt, id: number): Promise<VersionWithContent | null> => {
      return getVersion(id)
    }
  )

  ipcMain.handle('versions:delete', async (_evt, id: number): Promise<void> => {
    deleteVersion(id)
  })
}
