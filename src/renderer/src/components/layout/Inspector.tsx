import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CaretDown,
  CaretRight,
  CheckCircle,
  Circle,
  ClockCounterClockwise,
  FileText,
  Image as ImageIcon,
  Info,
  MagicWand,
  PencilSimple,
  Warning
} from '@phosphor-icons/react'
import { useAppState } from '@/state/AppContext'
import { EditingPanel } from '@/components/EditingPanel'
import { FormatPanel } from '@/components/FormatPanel'
import { CoverPanel } from '@/components/CoverPanel'
import { HistorySection } from '@/components/HistorySection'
import { computeKdpScore, type KdpCheck } from '@/lib/kdpScore'
import { detectChapterRefs } from '@/lib/chapters'
import { createVersion } from '@/lib/versionsIpc'

type SectionId =
  | 'overview'
  | 'edit'
  | 'format'
  | 'cover'
  | 'blurb'
  | 'history'
  | 'export'

const SECTION_ICON: Record<SectionId, React.ElementType> = {
  overview: Info,
  edit: MagicWand,
  format: FileText,
  cover: ImageIcon,
  blurb: PencilSimple,
  history: ClockCounterClockwise,
  export: BookOpen
}

const SECTION_TITLE: Record<SectionId, string> = {
  overview: 'KDP Readiness',
  edit: 'Editing Pipeline',
  format: 'Interior Format',
  cover: 'Cover Designer',
  blurb: 'Back-Cover Copy',
  history: 'History',
  export: 'Export'
}

export function Inspector({
  openSections,
  toggleSection
}: {
  openSections: Set<SectionId>
  toggleSection: (id: SectionId) => void
}): React.JSX.Element {
  const {
    manuscript,
    currentContent,
    editResult,
    formatMeta,
    formatComplete,
    coverResult,
    blurb,
    projectId,
    setFormatMeta,
    setFormatComplete,
    setCoverResult,
    setEditResult,
    setBlurb,
    bumpHistoryRefresh
  } = useAppState()

  const recordSnapshot = (
    trigger:
      | 'edit-pass'
      | 'cover-generated'
      | 'blurb-saved'
      | 'format-run',
    text: string,
    metadata: Record<string, unknown> = {}
  ): void => {
    if (!manuscript) return
    createVersion({
      projectId,
      trigger,
      manuscriptText: text,
      metadata
    })
      .then(() => bumpHistoryRefresh())
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.warn('Version snapshot failed:', err)
      })
  }

  // Debounced blurb snapshot — fires 3s after the user stops typing.
  useEffect(() => {
    if (!manuscript || !blurb.trim()) return
    const handle = window.setTimeout(() => {
      recordSnapshot('blurb-saved', currentContent, {
        blurbPreview: blurb.slice(0, 120)
      })
    }, 3000)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blurb])

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

  if (!manuscript) {
    return (
      <aside style={inspectorBase}>
        <div
          style={{
            padding: '32px 16px',
            color: 'var(--color-text-3)',
            fontSize: 13,
            textAlign: 'center'
          }}
        >
          <div
            className="divider-label"
            style={{ marginBottom: 16, fontSize: 10 }}
          >
            Inspector
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--color-text-2)'
            }}
          >
            Drop a manuscript to begin.
          </p>
          <p style={{ margin: '16px 0 0', fontSize: 12, lineHeight: 1.6 }}>
            Readiness checks, editing controls, format settings, cover tools,
            blurb, and export all live here.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside style={inspectorBase}>
      <Section
        id="overview"
        open={openSections.has('overview')}
        onToggle={() => toggleSection('overview')}
        badge={`${snapshot.score}/100`}
      >
        <OverviewContent checks={snapshot.checks} />
      </Section>

      <Section
        id="edit"
        open={openSections.has('edit')}
        onToggle={() => toggleSection('edit')}
        badge={editResult ? 'Done' : undefined}
      >
        <EditingPanel
          manuscript={manuscript}
          editResult={editResult}
          onEditComplete={(r) => {
            setEditResult(r)
            recordSnapshot('edit-pass', r.editedContent, {
              totalTokensIn: r.totalTokensIn,
              totalTokensOut: r.totalTokensOut,
              estimatedCostUsd: r.estimatedCostUsd
            })
          }}
        />
      </Section>

      <Section
        id="format"
        open={openSections.has('format')}
        onToggle={() => toggleSection('format')}
        badge={formatComplete ? 'Done' : undefined}
      >
        <FormatPanel
          manuscriptText={editResult?.editedContent ?? currentContent}
          defaultTitle={formatMeta?.title}
          defaultAuthor={formatMeta?.author}
          onComplete={(meta) => {
            setFormatMeta(meta)
            setFormatComplete(true)
            recordSnapshot('format-run', editResult?.editedContent ?? currentContent, {
              title: meta.title,
              author: meta.author,
              trimSize: meta.trimSize
            })
          }}
        />
      </Section>

      <Section
        id="cover"
        open={openSections.has('cover')}
        onToggle={() => toggleSection('cover')}
        badge={coverResult ? 'Done' : undefined}
      >
        <CoverPanel
          defaultTitle={formatMeta?.title}
          defaultAuthor={formatMeta?.author}
          defaultSubtitle={formatMeta?.subtitle}
          defaultTrim={formatMeta?.trimSize}
          defaultBlurb={blurb || undefined}
          onResult={(r) => {
            setCoverResult(r)
            recordSnapshot('cover-generated', editResult?.editedContent ?? currentContent, {
              wrapPdfPath: r.wrapPdfPath,
              frontPdfPath: r.frontPdfPath,
              slug: r.slug
            })
          }}
        />
      </Section>

      <Section
        id="blurb"
        open={openSections.has('blurb')}
        onToggle={() => toggleSection('blurb')}
        badge={blurb.trim() ? 'Written' : undefined}
      >
        <BlurbContent blurb={blurb} setBlurb={setBlurb} />
      </Section>

      <Section
        id="history"
        open={openSections.has('history')}
        onToggle={() => toggleSection('history')}
      >
        <HistorySection />
      </Section>

      <Section
        id="export"
        open={openSections.has('export')}
        onToggle={() => toggleSection('export')}
      >
        <ExportContent />
      </Section>
    </aside>
  )
}

const inspectorBase: React.CSSProperties = {
  width: 320,
  flexShrink: 0,
  backgroundColor: 'var(--color-surface)',
  borderLeft: '1px solid var(--color-border)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column'
}

function Section({
  id,
  open,
  onToggle,
  badge,
  children
}: {
  id: SectionId
  open: boolean
  onToggle: () => void
  badge?: string
  children: React.ReactNode
}): React.JSX.Element {
  const Icon = SECTION_ICON[id]
  return (
    <section
      data-inspector-section={id}
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--color-text-1)',
          textAlign: 'left',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          transition: 'background-color 150ms ease-out'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(200, 169, 110, 0.06)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {open ? (
          <CaretDown size={12} color="var(--color-text-3)" />
        ) : (
          <CaretRight size={12} color="var(--color-text-3)" />
        )}
        <Icon size={14} color="var(--color-text-2)" />
        <span style={{ flex: 1 }}>{SECTION_TITLE[id]}</span>
        {badge && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: '2px 8px',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              color: 'var(--color-gold)'
            }}
          >
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div style={{ padding: '4px 16px 20px' }}>{children}</div>
      )}
    </section>
  )
}

function OverviewContent({ checks }: { checks: KdpCheck[] }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {checks.map((check) => (
        <CheckRow key={check.id} check={check} />
      ))}
    </div>
  )
}

function CheckRow({ check }: { check: KdpCheck }): React.JSX.Element {
  const icon = check.passed ? (
    <CheckCircle size={14} weight="fill" color="var(--color-sage)" />
  ) : check.warn ? (
    <Warning size={14} weight="regular" color="var(--color-terracotta)" />
  ) : (
    <Circle size={14} color="var(--color-text-3)" />
  )
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 0',
        fontSize: 12
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ color: 'var(--color-text-1)', fontWeight: 500 }}>
          {check.label}
        </span>
        <span style={{ color: 'var(--color-text-3)', fontSize: 11 }}>
          {check.detail}
        </span>
      </div>
    </div>
  )
}

function BlurbContent({
  blurb,
  setBlurb
}: {
  blurb: string
  setBlurb: (b: string) => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
        Type or paste your back-cover copy here. It'll be included on the back
        cover of the generated wrap.
      </p>
      <textarea
        className="input-field"
        style={{ minHeight: 180, lineHeight: 1.6 }}
        value={blurb}
        onChange={(e) => setBlurb(e.target.value)}
        placeholder="A young mapmaker discovers…"
      />
      <p
        style={{
          fontSize: 10,
          color: 'var(--color-text-3)',
          fontFamily: "'JetBrains Mono', monospace",
          margin: 0
        }}
      >
        {blurb.trim().length} characters · {blurb.trim().split(/\s+/).filter(Boolean).length} words
      </p>
    </div>
  )
}

function ExportContent(): React.JSX.Element {
  const { editResult, coverResult } = useAppState()
  const hasAny = !!editResult || !!coverResult
  if (!hasAny) {
    return (
      <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0, lineHeight: 1.5 }}>
        Finished files will appear here as you complete each step. Everything
        lands in <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>output/</code>.
      </p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
      {editResult && (
        <ExportRow
          label="Edited manuscript"
          detail={`${editResult.totalTokensOut.toLocaleString()} output tokens · $${editResult.estimatedCostUsd.toFixed(4)}`}
        />
      )}
      {coverResult && (
        <>
          <ExportRow label="Wrap cover PDF" detail={coverResult.wrapPdfPath} mono />
          <ExportRow label="Front-only PDF" detail={coverResult.frontPdfPath} mono />
        </>
      )}
    </div>
  )
}

function ExportRow({
  label,
  detail,
  mono
}: {
  label: string
  detail: string
  mono?: boolean
}): React.JSX.Element {
  return (
    <div
      style={{
        padding: 8,
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        backgroundColor: 'var(--color-bg)'
      }}
    >
      <div style={{ fontWeight: 500, color: 'var(--color-text-1)', fontSize: 12 }}>
        {label}
      </div>
      <div
        title={detail}
        style={{
          fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
          fontSize: 10,
          color: 'var(--color-text-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {detail}
      </div>
    </div>
  )
}

export function useInspectorSections(initial: SectionId[] = ['overview', 'edit']): {
  open: Set<SectionId>
  toggle: (id: SectionId) => void
  openOnly: (id: SectionId) => void
} {
  const [open, setOpen] = useState<Set<SectionId>>(() => new Set(initial))
  const toggle = (id: SectionId): void => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const openOnly = (id: SectionId): void => {
    setOpen(new Set([id]))
  }
  return { open, toggle, openOnly }
}

export type { SectionId }
