import * as React from 'react'
import { useMemo } from 'react'
import { BookOpenText, File } from '@phosphor-icons/react'
import { useAppState } from '@/state/AppContext'
import { detectChapterRefs } from '@/lib/chapters'

type SidebarProps = {
  onJumpToChapter: (offset: number, id: string) => void
}

export function Sidebar({ onJumpToChapter }: SidebarProps): React.JSX.Element {
  const { manuscript, currentContent, activeChapterId, setActiveChapterId } =
    useAppState()

  const chapters = useMemo(
    () => detectChapterRefs(currentContent),
    [currentContent]
  )

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '16px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <File size={16} color="var(--color-text-2)" />
        <span
          className="divider-label"
          style={{ flex: 1 }}
          title={manuscript?.filename ?? ''}
        >
          Document
        </span>
      </div>
      <div style={{ padding: '0 16px 16px', fontSize: 13, color: 'var(--color-text-2)' }}>
        {manuscript ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                color: 'var(--color-text-1)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={manuscript.filename}
            >
              {manuscript.filename}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              {manuscript.wordCount.toLocaleString()} words
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-3)' }}>No document loaded.</span>
        )}
      </div>

      <div
        style={{
          padding: '16px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderTop: '1px solid var(--color-border)'
        }}
      >
        <BookOpenText size={16} color="var(--color-text-2)" />
        <span className="divider-label">Chapters</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'var(--color-text-3)'
          }}
        >
          {chapters.length}
        </span>
      </div>

      <nav
        style={{
          flex: 1,
          padding: '0 8px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {chapters.length === 0 ? (
          <div
            style={{
              padding: '8px 8px',
              fontSize: 12,
              color: 'var(--color-text-3)',
              lineHeight: 1.5
            }}
          >
            {manuscript
              ? 'No chapter headings detected. Use "Chapter N" or markdown "# Heading".'
              : 'Chapters will appear here once a manuscript is loaded.'}
          </div>
        ) : (
          chapters.map((ch) => {
            const active = ch.id === activeChapterId
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setActiveChapterId(ch.id)
                  onJumpToChapter(ch.offset, ch.id)
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 8px',
                  borderRadius: 4,
                  background: active ? 'rgba(200, 169, 110, 0.12)' : 'transparent',
                  color: active ? 'var(--color-tobacco)' : 'var(--color-text-2)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 150ms ease-out, color 150ms ease-out',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'baseline'
                }}
                title={ch.title}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: 'var(--color-text-3)',
                    flexShrink: 0,
                    minWidth: 20
                  }}
                >
                  {String(ch.index).padStart(2, '0')}
                </span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {ch.title}
                </span>
              </button>
            )
          })
        )}
      </nav>
    </aside>
  )
}
