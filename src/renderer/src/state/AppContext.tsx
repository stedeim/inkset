import * as React from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Manuscript } from '@/lib/manuscript'
import type { EditedManuscript } from '@/lib/ipc'
import type { TrimSize } from '@/lib/formatIpc'
import type { CoverResult } from '@/lib/coverIpc'
import type { VersionWithContent } from '@/lib/versionsIpc'

type InspectorSection =
  | 'overview'
  | 'edit'
  | 'format'
  | 'cover'
  | 'blurb'
  | 'history'
  | 'export'
type Theme = 'light' | 'dark'

export type AppState = {
  manuscript: Manuscript | null
  currentContent: string
  editResult: EditedManuscript | null
  formatMeta: { title: string; author: string; subtitle?: string; trimSize: TrimSize } | null
  formatComplete: boolean
  coverResult: CoverResult | null
  blurb: string
  activeChapterId: string | null
  inspectorSection: InspectorSection
  theme: Theme
  previewSnapshot: VersionWithContent | null
  historyRefreshKey: number
}

type AppActions = {
  setManuscript: (m: Manuscript | null) => void
  setCurrentContent: (c: string) => void
  setEditResult: (r: EditedManuscript | null) => void
  setFormatMeta: (m: AppState['formatMeta']) => void
  setFormatComplete: (b: boolean) => void
  setCoverResult: (r: CoverResult | null) => void
  setBlurb: (b: string) => void
  setActiveChapterId: (id: string | null) => void
  setInspectorSection: (s: InspectorSection) => void
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setPreviewSnapshot: (s: VersionWithContent | null) => void
  restoreSnapshot: (s: VersionWithContent) => void
  bumpHistoryRefresh: () => void
  projectId: string
  reset: () => void
}

const AppStateContext = createContext<(AppState & AppActions) | null>(null)

const INITIAL: AppState = {
  manuscript: null,
  currentContent: '',
  editResult: null,
  formatMeta: null,
  formatComplete: false,
  coverResult: null,
  blurb: '',
  activeChapterId: null,
  inspectorSection: 'overview',
  theme: resolveInitialTheme(),
  previewSnapshot: null,
  historyRefreshKey: 0
}

function slugifyFilename(filename: string): string {
  return (
    filename
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled'
  )
}

function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem('inkset:theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* no-op */
  }
  return 'light'
}

export function AppStateProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, setState] = useState<AppState>(INITIAL)

  const setManuscript = useCallback((m: Manuscript | null) => {
    setState((s) => ({
      ...s,
      manuscript: m,
      currentContent: m?.content ?? ''
    }))
  }, [])

  const setCurrentContent = useCallback((c: string) => {
    setState((s) => ({ ...s, currentContent: c }))
  }, [])

  const setEditResult = useCallback((r: EditedManuscript | null) => {
    setState((s) => ({
      ...s,
      editResult: r,
      currentContent: r ? r.editedContent : s.currentContent
    }))
  }, [])

  const setFormatMeta = useCallback((m: AppState['formatMeta']) => {
    setState((s) => ({ ...s, formatMeta: m }))
  }, [])

  const setFormatComplete = useCallback((b: boolean) => {
    setState((s) => ({ ...s, formatComplete: b }))
  }, [])

  const setCoverResult = useCallback((r: CoverResult | null) => {
    setState((s) => ({ ...s, coverResult: r }))
  }, [])

  const setBlurb = useCallback((b: string) => {
    setState((s) => ({ ...s, blurb: b }))
  }, [])

  const setActiveChapterId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, activeChapterId: id }))
  }, [])

  const setInspectorSection = useCallback((section: InspectorSection) => {
    setState((s) => ({ ...s, inspectorSection: section }))
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setState((s) => ({ ...s, theme: t }))
  }, [])

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      window.localStorage.setItem('inkset:theme', state.theme)
    } catch {
      /* no-op */
    }
  }, [state.theme])

  const setPreviewSnapshot = useCallback((snap: VersionWithContent | null) => {
    setState((s) => ({ ...s, previewSnapshot: snap }))
  }, [])

  const restoreSnapshot = useCallback((snap: VersionWithContent) => {
    setState((s) => ({
      ...s,
      currentContent: snap.manuscriptText,
      previewSnapshot: null
    }))
  }, [])

  const bumpHistoryRefresh = useCallback(() => {
    setState((s) => ({ ...s, historyRefreshKey: s.historyRefreshKey + 1 }))
  }, [])

  const reset = useCallback(() => {
    setState((s) => ({ ...INITIAL, theme: s.theme }))
  }, [])

  const projectId = state.manuscript
    ? slugifyFilename(state.manuscript.filename)
    : 'no-project'

  const value = useMemo(
    () => ({
      ...state,
      projectId,
      setManuscript,
      setCurrentContent,
      setEditResult,
      setFormatMeta,
      setFormatComplete,
      setCoverResult,
      setBlurb,
      setActiveChapterId,
      setInspectorSection,
      setTheme,
      toggleTheme,
      setPreviewSnapshot,
      restoreSnapshot,
      bumpHistoryRefresh,
      reset
    }),
    [
      state,
      projectId,
      setManuscript,
      setCurrentContent,
      setEditResult,
      setFormatMeta,
      setFormatComplete,
      setCoverResult,
      setBlurb,
      setActiveChapterId,
      setInspectorSection,
      setTheme,
      toggleTheme,
      setPreviewSnapshot,
      restoreSnapshot,
      bumpHistoryRefresh,
      reset
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppState & AppActions {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}

export type { InspectorSection }
