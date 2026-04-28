import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  ArrowCounterClockwise,
  BookmarkSimple,
  ClockCounterClockwise,
  Eye,
  Trash,
  WarningCircle
} from '@phosphor-icons/react'
import { useAppState } from '@/state/AppContext'
import {
  deleteVersion,
  getVersion,
  listVersions,
  triggerLabel,
  type VersionRow
} from '@/lib/versionsIpc'

function formatRelative(ts: number): string {
  const delta = Date.now() - ts
  const s = Math.floor(delta / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 14) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

function formatExact(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function triggerAccent(trigger: VersionRow['trigger']): string {
  switch (trigger) {
    case 'manual':
      return 'var(--color-gold)'
    case 'edit-pass':
      return 'var(--color-tobacco)'
    case 'cover-generated':
      return 'var(--color-sage)'
    case 'blurb-saved':
      return 'var(--color-text-2)'
    case 'format-run':
      return 'var(--color-terracotta)'
    case 'import':
    default:
      return 'var(--color-text-3)'
  }
}

export function HistorySection(): React.JSX.Element {
  const {
    projectId,
    historyRefreshKey,
    previewSnapshot,
    setPreviewSnapshot,
    restoreSnapshot,
    bumpHistoryRefresh
  } = useAppState()
  const [versions, setVersions] = useState<VersionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (projectId === 'no-project') {
      setVersions([])
      return
    }
    setLoading(true)
    listVersions(projectId)
      .then((rows) => {
        if (!cancelled) {
          setVersions(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, historyRefreshKey])

  const handlePreview = async (id: number): Promise<void> => {
    try {
      const snap = await getVersion(id)
      if (snap) setPreviewSnapshot(snap)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleRestore = async (id: number): Promise<void> => {
    const ok = window.confirm(
      'Replace the current manuscript with this snapshot?\nA new snapshot will be created from your current text first, so nothing is lost.'
    )
    if (!ok) return
    try {
      const snap = await getVersion(id)
      if (snap) restoreSnapshot(snap)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    const ok = window.confirm('Delete this snapshot permanently?')
    if (!ok) return
    try {
      await deleteVersion(id)
      bumpHistoryRefresh()
      if (previewSnapshot?.id === id) setPreviewSnapshot(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (projectId === 'no-project') {
    return (
      <p
        style={{
          fontSize: 12,
          color: 'var(--color-text-3)',
          margin: 0,
          lineHeight: 1.5
        }}
      >
        History starts tracking once a manuscript is loaded. Every AI pass,
        cover generation, and manual save creates a snapshot you can preview
        or restore.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          color: 'var(--color-text-3)'
        }}
      >
        <ClockCounterClockwise size={12} />
        <span>
          {versions.length} snapshot{versions.length === 1 ? '' : 's'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>
          <kbd
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              padding: '1px 6px',
              border: '1px solid var(--color-border)',
              borderRadius: 3
            }}
          >
            ⌘⇧S
          </kbd>{' '}
          save version
        </span>
      </div>

      {loading && versions.length === 0 && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-3)',
            padding: '16px 0',
            textAlign: 'center'
          }}
        >
          Loading…
        </div>
      )}

      {!loading && versions.length === 0 && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-3)',
            padding: '16px 0',
            lineHeight: 1.5
          }}
        >
          No snapshots yet. Run an edit pass or press ⌘⇧S to save one.
        </div>
      )}

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            color: 'var(--color-terracotta)',
            fontSize: 11
          }}
        >
          <WarningCircle size={12} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {versions.map((v) => {
          const active = previewSnapshot?.id === v.id
          return (
            <div
              key={v.id}
              style={{
                borderLeft: `3px solid ${triggerAccent(v.trigger)}`,
                padding: '8px 10px',
                backgroundColor: active
                  ? 'rgba(200, 169, 110, 0.08)'
                  : 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderLeftWidth: 3,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'background-color 150ms ease-out'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  fontSize: 11
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    color: triggerAccent(v.trigger),
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: 10
                  }}
                >
                  {triggerLabel(v.trigger)}
                </span>
                <span
                  title={formatExact(v.timestamp)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    marginLeft: 'auto'
                  }}
                >
                  {formatRelative(v.timestamp)}
                </span>
              </div>
              {v.userNote && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-1)',
                    fontStyle: 'italic',
                    fontFamily: "'Cormorant Garamond', serif"
                  }}
                >
                  “{v.userNote}”
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  fontSize: 11
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePreview(v.id)}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleRestore(v.id)}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                >
                  <ArrowCounterClockwise size={12} /> Restore
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(v.id)}
                  className="btn btn-ghost"
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    marginLeft: 'auto',
                    color: 'var(--color-text-3)'
                  }}
                  title="Delete snapshot"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SaveVersionModal({
  open,
  onClose,
  onSave
}: {
  open: boolean
  onClose: () => void
  onSave: (note: string) => void
}): React.JSX.Element | null {
  const [note, setNote] = useState('')
  useEffect(() => {
    if (open) setNote('')
  }, [open])
  if (!open) return null
  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 120,
        backgroundColor: 'rgba(28, 25, 23, 0.42)',
        animation: 'ink-cmd-fade 150ms ease-out'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          padding: 24,
          fontFamily: "'DM Sans', sans-serif",
          animation: 'ink-cmd-rise 150ms ease-out'
        }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 8px',
            color: 'var(--color-text-1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <BookmarkSimple size={18} weight="regular" color="var(--color-gold)" />
          Save a version
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-2)',
            margin: '0 0 16px',
            lineHeight: 1.5
          }}
        >
          A snapshot of the current manuscript will be stored. Add a short note
          to help you find it again.
        </p>
        <textarea
          className="input-field"
          autoFocus
          placeholder="e.g. Before rewriting Chapter 3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ minHeight: 80, marginBottom: 16 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              onSave(note.trim())
            }
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            onClick={() => onSave(note.trim())}
            className="btn btn-primary"
          >
            Save Version
          </button>
        </div>
      </div>
    </div>
  )
}
