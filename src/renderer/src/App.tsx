import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookmarkSimple,
  BookOpenText,
  Export,
  FileText,
  Gear,
  Image as ImageIcon,
  Keyboard,
  MagicWand,
  Moon,
  PencilSimple,
  Sun
} from '@phosphor-icons/react'
import { AppStateProvider, useAppState } from '@/state/AppContext'
import { TopNav } from '@/components/layout/TopNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Canvas, type CanvasHandle } from '@/components/layout/Canvas'
import {
  Inspector,
  useInspectorSections,
  type SectionId
} from '@/components/layout/Inspector'
import { StatusBar } from '@/components/layout/StatusBar'
import { DropZone } from '@/components/DropZone'
import {
  CommandPalette,
  type PaletteCommand
} from '@/components/CommandPalette'
import { SaveVersionModal } from '@/components/HistorySection'
import { SettingsModal } from '@/components/SettingsModal'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { computeKdpScore } from '@/lib/kdpScore'
import { detectChapterRefs } from '@/lib/chapters'
import { createVersion } from '@/lib/versionsIpc'
import { getKeys } from '@/lib/settingsIpc'

function Shell(): React.JSX.Element {
  const {
    manuscript,
    currentContent,
    editResult,
    formatMeta,
    formatComplete,
    coverResult,
    blurb,
    theme,
    projectId,
    toggleTheme,
    bumpHistoryRefresh,
    reset
  } = useAppState()

  const canvasRef = useRef<CanvasHandle>(null)
  const { open, toggle, openOnly } = useInspectorSections(['overview', 'edit'])
  const palette = useCommandPalette()
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // First-launch check: if neither API key is set, nudge the user into settings.
  useEffect(() => {
    let cancelled = false
    getKeys()
      .then((k) => {
        if (cancelled) return
        if (!k.anthropic.present && !k.openai.present) {
          setSettingsOpen(true)
        }
      })
      .catch(() => {
        /* main may not be ready yet on very first paint — ignore */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const openSaveVersion = (): void => {
    if (!manuscript) return
    setSaveModalOpen(true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // ⌘⇧S — save a manual version snapshot.
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        openSaveVersion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript])

  const handleSaveVersion = async (note: string): Promise<void> => {
    if (!manuscript) return
    try {
      await createVersion({
        projectId,
        trigger: 'manual',
        manuscriptText: currentContent,
        userNote: note || null
      })
      bumpHistoryRefresh()
      openOnly('history')
    } finally {
      setSaveModalOpen(false)
    }
  }

  const chapters = useMemo(
    () => detectChapterRefs(currentContent),
    [currentContent]
  )

  const snapshot = useMemo(
    () =>
      computeKdpScore({
        manuscriptLoaded: !!manuscript,
        wordCount: manuscript?.wordCount ?? 0,
        trimSize: formatMeta?.trimSize ?? null,
        chaptersDetected: chapters.length,
        editComplete: !!editResult,
        formatComplete,
        coverComplete: !!coverResult,
        blurbPresent: blurb.trim().length > 0
      }),
    [
      manuscript,
      chapters.length,
      formatMeta,
      editResult,
      formatComplete,
      coverResult,
      blurb
    ]
  )

  const wordCount = useMemo(() => {
    if (!currentContent.trim()) return 0
    return currentContent.trim().split(/\s+/).length
  }, [currentContent])

  const focusSection = (id: SectionId): void => {
    openOnly(id)
    // Give the inspector a tick to mount the content before scrolling.
    setTimeout(() => {
      const el = document.querySelector(`[data-inspector-section="${id}"]`)
      if (el && 'scrollIntoView' in el) {
        ;(el as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 50)
  }

  const commands: PaletteCommand[] = useMemo(() => {
    const list: PaletteCommand[] = []

    // Manuscript
    list.push({
      id: 'manuscript-new',
      group: 'Manuscript',
      label: 'New Project',
      hint: 'Clear and start over',
      icon: <PencilSimple size={14} />,
      keywords: ['reset', 'clear', 'restart'],
      perform: reset
    })
    list.push({
      id: 'manuscript-save-version',
      group: 'Manuscript',
      label: 'Save a Version',
      hint: '⌘⇧S',
      icon: <BookmarkSimple size={14} />,
      keywords: ['version', 'snapshot', 'save', 'commit'],
      disabled: !manuscript,
      perform: openSaveVersion
    })

    // Navigation — one entry per detected chapter
    chapters.forEach((ch) => {
      list.push({
        id: `nav-chapter-${ch.id}`,
        group: 'Navigation',
        label: `Jump to ${ch.title}`,
        hint: `Chapter ${ch.index}`,
        icon: <BookOpenText size={14} />,
        keywords: ['chapter', 'goto', String(ch.index), ch.title.toLowerCase()],
        perform: () => canvasRef.current?.scrollToOffset(ch.offset)
      })
    })

    // Tools — open respective inspector section
    const toolEntries: Array<[
      SectionId,
      string,
      string,
      React.ReactNode,
      string[]
    ]> = [
      ['edit', 'Open Editing Pipeline', 'Grammar / style / clarity', <MagicWand size={14} />, ['edit', 'claude', 'polish']],
      ['format', 'Open Interior Formatter', 'PDF + EPUB for KDP', <FileText size={14} />, ['pdf', 'epub', 'kdp', 'print']],
      ['cover', 'Open Cover Designer', 'AI art or upload your own', <ImageIcon size={14} />, ['cover', 'dalle', 'art']],
      ['blurb', 'Open Back-Cover Copy', 'Blurb and author bio', <PencilSimple size={14} />, ['blurb', 'copy', 'back']],
      ['history', 'Open Version History', 'Snapshots and restore', <BookmarkSimple size={14} />, ['history', 'version', 'snapshot', 'timeline']],
      ['export', 'Open Export', 'Generated artifacts', <Export size={14} />, ['export', 'save', 'output']]
    ]
    for (const [id, label, hint, icon, keywords] of toolEntries) {
      list.push({
        id: `tool-${id}`,
        group: 'Tools',
        label,
        hint,
        icon,
        disabled: !manuscript && id !== 'edit',
        keywords,
        perform: () => focusSection(id)
      })
    }

    // App
    list.push({
      id: 'app-settings',
      group: 'App',
      label: 'Open Settings',
      hint: 'API keys',
      icon: <Gear size={14} />,
      keywords: ['settings', 'api', 'keys', 'preferences', 'config'],
      perform: () => setSettingsOpen(true)
    })
    list.push({
      id: 'app-toggle-theme',
      group: 'App',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      hint: theme === 'dark' ? 'Off-white paper' : 'Ink-black paper',
      icon: theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />,
      keywords: ['theme', 'dark', 'light', 'mode'],
      perform: toggleTheme
    })
    list.push({
      id: 'app-shortcuts',
      group: 'App',
      label: 'Keyboard Shortcuts',
      hint: 'Show a cheat sheet',
      icon: <Keyboard size={14} />,
      keywords: ['keys', 'hotkey', 'shortcut', 'help'],
      perform: () => {
        alert(
          [
            '⌘K   Open command palette',
            '⌘N   Toggle dark mode (from palette)',
            'Esc  Close palette',
            '↑/↓  Move selection',
            '↵    Run selected command'
          ].join('\n')
        )
      }
    })

    return list
  }, [chapters, manuscript, theme, toggleTheme, reset])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-1)'
      }}
    >
      <TopNav onReset={reset} onOpenPalette={palette.toggle} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          onJumpToChapter={(offset) => canvasRef.current?.scrollToOffset(offset)}
        />
        <Canvas
          ref={canvasRef}
          emptyState={<CanvasDropZone />}
        />
        <Inspector openSections={open} toggleSection={toggle} />
      </div>
      <StatusBar
        wordCount={wordCount}
        chapterCount={chapters.length}
        snapshot={snapshot}
        onShowChecklist={() => openOnly('overview')}
      />
      <CommandPalette
        open={palette.open}
        onOpenChange={palette.setOpen}
        commands={commands}
      />
      <SaveVersionModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveVersion}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

function CanvasDropZone(): React.JSX.Element {
  const { setManuscript } = useAppState()
  return <DropZone onManuscript={setManuscript} />
}

function App(): React.JSX.Element {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  )
}

export default App
