import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const editingApi = {
  newJobId: (): Promise<string> => ipcRenderer.invoke('editing:new-job-id'),
  start: (payload: { jobId: string; content: string }): void => {
    ipcRenderer.send('editing:start', payload)
  },
  run: (content: string): Promise<unknown> => ipcRenderer.invoke('editing:run', content),
  save: (payload: { filename: string; content: string }): Promise<unknown> =>
    ipcRenderer.invoke('editing:save', payload),
  onProgress: (cb: (event: unknown) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, payload: unknown): void => cb(payload)
    ipcRenderer.on('editing:progress', listener)
    return () => ipcRenderer.removeListener('editing:progress', listener)
  },
  onComplete: (cb: (event: unknown) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, payload: unknown): void => cb(payload)
    ipcRenderer.on('editing:complete', listener)
    return () => ipcRenderer.removeListener('editing:complete', listener)
  }
}

const kdpFormatApi = {
  run: (payload: unknown): Promise<unknown> =>
    ipcRenderer.invoke('kdp-format:run', payload),
  reveal: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('kdp-format:reveal', absolutePath)
}

const coverApi = {
  start: (payload: { jobId: string; input: unknown }): void => {
    ipcRenderer.send('cover:start', payload)
  },
  reroll: (payload: {
    jobId: string
    input: unknown
    prompts: string[]
    chosenPromptIndex: number
  }): void => {
    ipcRenderer.send('cover:reroll', payload)
  },
  upload: (payload: { jobId: string; input: unknown; artBase64: string }): void => {
    ipcRenderer.send('cover:upload', payload)
  },
  reveal: (absolutePath: string): Promise<void> =>
    ipcRenderer.invoke('cover:reveal', absolutePath),
  onProgress: (cb: (event: unknown) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, payload: unknown): void => cb(payload)
    ipcRenderer.on('cover:progress', listener)
    return () => ipcRenderer.removeListener('cover:progress', listener)
  },
  onComplete: (cb: (event: unknown) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, payload: unknown): void => cb(payload)
    ipcRenderer.on('cover:complete', listener)
    return () => ipcRenderer.removeListener('cover:complete', listener)
  }
}

const versionsApi = {
  create: (input: unknown): Promise<unknown> =>
    ipcRenderer.invoke('versions:create', input),
  list: (projectId: string, limit?: number): Promise<unknown> =>
    ipcRenderer.invoke('versions:list', projectId, limit),
  get: (id: number): Promise<unknown> => ipcRenderer.invoke('versions:get', id),
  delete: (id: number): Promise<void> =>
    ipcRenderer.invoke('versions:delete', id)
}

const settingsApi = {
  getKeys: (): Promise<unknown> => ipcRenderer.invoke('settings:get-keys'),
  setKeys: (payload: unknown): Promise<unknown> =>
    ipcRenderer.invoke('settings:set-keys', payload)
}

const api = {
  editing: editingApi,
  kdpFormat: kdpFormatApi,
  cover: coverApi,
  versions: versionsApi,
  settings: settingsApi
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type PreloadApi = typeof api
