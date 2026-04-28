import { ElectronAPI } from '@electron-toolkit/preload'

export type PreloadEditingApi = {
  newJobId: () => Promise<string>
  start: (payload: { jobId: string; content: string }) => void
  run: (content: string) => Promise<unknown>
  save: (payload: { filename: string; content: string }) => Promise<unknown>
  onProgress: (cb: (event: unknown) => void) => () => void
  onComplete: (cb: (event: unknown) => void) => () => void
}

export type PreloadKdpFormatApi = {
  run: (payload: unknown) => Promise<unknown>
  reveal: (absolutePath: string) => Promise<void>
}

export type PreloadCoverApi = {
  start: (payload: { jobId: string; input: unknown }) => void
  reroll: (payload: {
    jobId: string
    input: unknown
    prompts: string[]
    chosenPromptIndex: number
  }) => void
  upload: (payload: { jobId: string; input: unknown; artBase64: string }) => void
  reveal: (absolutePath: string) => Promise<void>
  onProgress: (cb: (event: unknown) => void) => () => void
  onComplete: (cb: (event: unknown) => void) => () => void
}

export type PreloadVersionsApi = {
  create: (input: unknown) => Promise<unknown>
  list: (projectId: string, limit?: number) => Promise<unknown>
  get: (id: number) => Promise<unknown>
  delete: (id: number) => Promise<void>
}

export type PreloadSettingsApi = {
  getKeys: () => Promise<unknown>
  setKeys: (payload: unknown) => Promise<unknown>
}

export type PreloadApi = {
  editing: PreloadEditingApi
  kdpFormat: PreloadKdpFormatApi
  cover: PreloadCoverApi
  versions: PreloadVersionsApi
  settings: PreloadSettingsApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PreloadApi
  }
}
