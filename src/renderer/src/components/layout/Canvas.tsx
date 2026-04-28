import * as React from 'react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useAppState } from '@/state/AppContext'

export type CanvasHandle = {
  scrollToOffset: (offset: number) => void
  focus: () => void
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isSceneBreak(t: string): boolean {
  if (/^[*]{3,}$/.test(t)) return true
  if (/^[-]{3,}$/.test(t)) return true
  if (/^(\*\s*){3,}$/.test(t)) return true
  if (/^(-\s*){3,}$/.test(t)) return true
  return false
}

function isChapterHeadingLine(t: string): boolean {
  if (/^chapter\s+(\d+|[ivxlcdm]+)\b/i.test(t)) return true
  if (/^#\s+/.test(t)) return true
  return false
}

/** Wrap the first alphanumeric character of an already-escaped paragraph
 *  inner HTML in `<span class="drop-cap">`. Leading quotes / punctuation
 *  stay outside the span so the glyph is the real first letter. */
function wrapFirstCharAsDropCap(innerHtml: string): string {
  const match = innerHtml.match(/^(\s*[^\w<]*)(\w)([\s\S]*)$/)
  if (!match) return innerHtml
  const [, prefix, firstChar, rest] = match
  return `${prefix}<span class="drop-cap">${firstChar}</span>${rest}`
}

function textToHtml(
  text: string,
  changedSet: Set<string> | undefined,
  runningHeader: string | null
): string {
  if (!text.trim()) return '<p></p>'
  const paragraphs = text.split(/\n\s*\n/)
  let dropCapPending = false

  return paragraphs
    .map((raw) => {
      const t = raw.trim()
      if (!t) return ''

      if (isSceneBreak(t)) {
        dropCapPending = false
        return '<div class="ms-fleuron" contenteditable="false" aria-hidden="true"></div>'
      }

      const mdHeading = t.match(/^(#{1,3})\s+(.+)$/)
      if (mdHeading) {
        const level = Math.min(mdHeading[1].length + 1, 3) // # → h2
        const heading = `<h${level}>${escapeHtml(mdHeading[2])}</h${level}>`
        dropCapPending = true
        return runningHeader
          ? `<div class="ms-running" contenteditable="false">${escapeHtml(runningHeader)}</div>${heading}`
          : heading
      }
      if (isChapterHeadingLine(t)) {
        const heading = `<h2>${escapeHtml(t)}</h2>`
        dropCapPending = true
        return runningHeader
          ? `<div class="ms-running" contenteditable="false">${escapeHtml(runningHeader)}</div>${heading}`
          : heading
      }

      const changedClass = changedSet?.has(t) ? 'ms-changed' : ''
      const inner = escapeHtml(t).replace(/\n/g, '<br/>')

      if (dropCapPending) {
        dropCapPending = false
        const classes = ['chapter-opener', changedClass].filter(Boolean).join(' ')
        return `<p class="${classes}">${wrapFirstCharAsDropCap(inner)}</p>`
      }
      const attr = changedClass ? ` class="${changedClass}"` : ''
      return `<p${attr}>${inner}</p>`
    })
    .filter(Boolean)
    .join('')
}

/** Returns the set of paragraph-strings in `edited` that differ from
 *  the same-index paragraph in `original`. Paragraph comparison is exact. */
function diffParagraphs(original: string, edited: string): Set<string> {
  const origs = original.split(/\n\s*\n/).map((p) => p.trim())
  const edits = edited.split(/\n\s*\n/).map((p) => p.trim())
  const changed = new Set<string>()
  const max = Math.max(origs.length, edits.length)
  for (let i = 0; i < max; i++) {
    const e = edits[i] ?? ''
    const o = origs[i] ?? ''
    if (e && e !== o) changed.add(e)
  }
  return changed
}

export const Canvas = forwardRef<CanvasHandle, { emptyState?: React.ReactNode }>(
  function Canvas({ emptyState }, ref): React.JSX.Element {
    const {
      currentContent,
      manuscript,
      editResult,
      formatMeta,
      previewSnapshot,
      setPreviewSnapshot,
      restoreSnapshot,
      setCurrentContent
    } = useAppState()
    const scrollerRef = useRef<HTMLDivElement>(null)

    const inPreview = previewSnapshot !== null
    const displayContent = inPreview
      ? previewSnapshot.manuscriptText
      : currentContent

    const changedSet = useMemo(() => {
      if (inPreview || !editResult) return undefined
      return diffParagraphs(editResult.originalContent, editResult.editedContent)
    }, [editResult, inPreview])

    const runningHeader = useMemo(() => {
      if (!formatMeta?.title || !formatMeta?.author) return null
      return `${formatMeta.title} · ${formatMeta.author}`
    }, [formatMeta])

    const initialHtml = useMemo(
      () => textToHtml(displayContent, changedSet, runningHeader),
      // Intentionally only seed the editor when the source changes meaningfully.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [manuscript?.filename, editResult?.editedContent, runningHeader, previewSnapshot?.id]
    )

    const programmaticRef = useRef(false)

    const editor = useEditor({
      extensions: [StarterKit],
      content: initialHtml,
      editable: !inPreview,
      editorProps: {
        attributes: {
          class: 'ProseMirror focus:outline-none'
        }
      },
      onUpdate: ({ editor: ed }) => {
        if (programmaticRef.current) return
        // Sync plain text back to app state so chapter detection stays current.
        const text = ed.getText({ blockSeparator: '\n\n' })
        setCurrentContent(text)
      }
    })

    useEffect(() => {
      if (!editor) return
      programmaticRef.current = true
      editor.commands.setContent(initialHtml)
      programmaticRef.current = false
    }, [editor, initialHtml])

    useEffect(() => {
      if (!editor) return
      editor.setEditable(!inPreview)
    }, [editor, inPreview])

    useImperativeHandle(
      ref,
      () => ({
        scrollToOffset: (offset: number): void => {
          if (!editor) return
          const size = editor.state.doc.content.size
          const pos = Math.min(Math.max(offset, 0), size - 1)
          editor.commands.setTextSelection(pos)
          // Scroll the outer container so the caret is near the top.
          const view = editor.view
          try {
            const coords = view.coordsAtPos(pos)
            const scroller = scrollerRef.current
            if (scroller) {
              const scrollerRect = scroller.getBoundingClientRect()
              const delta = coords.top - scrollerRect.top - 32
              scroller.scrollBy({ top: delta, behavior: 'smooth' })
            }
          } catch {
            /* pos out of range after content change — no-op */
          }
        },
        focus: (): void => {
          editor?.commands.focus()
        }
      }),
      [editor]
    )

    const formatPreviewTimestamp = (ts: number): string =>
      new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })

    return (
      <section
        ref={scrollerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'var(--color-bg)',
          padding: inPreview ? '0 32px 48px' : '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {inPreview && previewSnapshot && (
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              position: 'sticky',
              top: 0,
              zIndex: 2,
              marginBottom: 24,
              backgroundColor: 'rgba(217, 123, 79, 0.1)',
              borderLeft: '3px solid var(--color-terracotta)',
              borderBottom: '1px solid var(--color-border)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: 'var(--color-terracotta)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: 10
                }}
              >
                Snapshot Preview · Editing Disabled
              </div>
              <div style={{ color: 'var(--color-text-2)', fontSize: 12 }}>
                Viewing the version from{' '}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--color-text-1)'
                  }}
                >
                  {formatPreviewTimestamp(previewSnapshot.timestamp)}
                </span>
                .
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm(
                  'Replace the current manuscript with this snapshot?'
                )
                if (ok) restoreSnapshot(previewSnapshot)
              }}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => setPreviewSnapshot(null)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              Exit Preview
            </button>
          </div>
        )}

        <div
          className="ms-canvas"
          style={{
            width: '100%',
            maxWidth: 720,
            minHeight: 'calc(100% - 96px)',
            opacity: inPreview ? 0.95 : 1
          }}
        >
          {manuscript ? (
            <EditorContent editor={editor} />
          ) : (
            <div
              style={{
                minHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 24,
                color: 'var(--color-text-3)'
              }}
            >
              {emptyState}
            </div>
          )}
        </div>
      </section>
    )
  }
)
