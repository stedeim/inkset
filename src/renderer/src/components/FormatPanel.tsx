import * as React from 'react'
import { useState } from 'react'
import {
  BookOpen,
  CheckCircle,
  CircleNotch,
  FileText,
  FolderOpen,
  WarningCircle
} from '@phosphor-icons/react'
import {
  runFormat,
  revealInFinder,
  TRIM_SIZES,
  type FormatResult,
  type TrimSize
} from '@/lib/formatIpc'

type FormatPanelProps = {
  manuscriptText: string
  defaultTitle?: string
  defaultAuthor?: string
  onComplete?: (meta: {
    title: string
    author: string
    subtitle?: string
    trimSize: TrimSize
  }) => void
}

type Status = 'idle' | 'running' | 'done' | 'error'

export function FormatPanel({
  manuscriptText,
  defaultTitle,
  defaultAuthor,
  onComplete
}: FormatPanelProps): React.JSX.Element {
  const [title, setTitle] = useState(defaultTitle ?? '')
  const [subtitle, setSubtitle] = useState('')
  const [author, setAuthor] = useState(defaultAuthor ?? '')
  const [dedication, setDedication] = useState('')
  const [trimSize, setTrimSize] = useState<TrimSize>('6x9')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<FormatResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canRun = status !== 'running' && !!title.trim() && !!author.trim()

  const run = async (pdf: boolean, epub: boolean): Promise<void> => {
    setStatus('running')
    setError(null)
    setResult(null)
    try {
      const res = await runFormat(
        {
          title: title.trim(),
          author: author.trim(),
          subtitle: subtitle.trim() || undefined,
          dedication: dedication.trim() || undefined,
          trimSize,
          manuscriptText
        },
        { pdf, epub }
      )
      setResult(res)
      setStatus('done')
      onComplete?.({
        title: title.trim(),
        author: author.trim(),
        subtitle: subtitle.trim() || undefined,
        trimSize
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Book title" required>
        <input
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={status === 'running'}
        />
      </Field>
      <Field label="Author">
        <input
          className="input-field"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={status === 'running'}
        />
      </Field>
      <Field label="Subtitle">
        <input
          className="input-field"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          disabled={status === 'running'}
        />
      </Field>
      <Field label="Trim size">
        <select
          className="input-field"
          value={trimSize}
          onChange={(e) => setTrimSize(e.target.value as TrimSize)}
          disabled={status === 'running'}
        >
          {TRIM_SIZES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Dedication">
        <textarea
          className="input-field"
          style={{ minHeight: 56 }}
          value={dedication}
          onChange={(e) => setDedication(e.target.value)}
          disabled={status === 'running'}
        />
      </Field>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => run(true, true)}
          disabled={!canRun}
        >
          {status === 'running' ? (
            <CircleNotch size={16} className="phosphor-spin" />
          ) : (
            <FileText size={16} />
          )}
          Generate PDF + EPUB
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => run(true, false)}
            disabled={!canRun}
          >
            PDF only
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => run(false, true)}
            disabled={!canRun}
          >
            EPUB only
          </button>
        </div>
      </div>

      {status === 'running' && (
        <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>
          Rendering… Puppeteer startup can take 20–60 seconds for large manuscripts.
        </p>
      )}
      {status === 'error' && error && (
        <div
          style={{
            borderLeft: '3px solid var(--color-terracotta)',
            paddingLeft: 12,
            fontSize: 12,
            color: 'var(--color-text-2)'
          }}
        >
          <div style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}>
            Formatting failed
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      )}
      {status === 'done' && result && <ResultView result={result} />}
      <style>{`
        @keyframes phosphor-spin { to { transform: rotate(360deg); } }
        .phosphor-spin { animation: phosphor-spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

function ResultView({ result }: { result: FormatResult }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13
        }}
      >
        <CheckCircle size={16} weight="fill" color="var(--color-sage)" />
        <span style={{ fontWeight: 500 }}>
          {result.chapterCount} chapter{result.chapterCount === 1 ? '' : 's'} rendered
        </span>
      </div>
      {result.pdfPath && <FileRow icon={<FileText size={14} />} label="Interior PDF" path={result.pdfPath} />}
      {result.epubPath && <FileRow icon={<BookOpen size={14} />} label="EPUB" path={result.epubPath} />}
      {result.warnings.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {result.warnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <WarningCircle
                size={12}
                color="var(--color-terracotta)"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FileRow({
  icon,
  label,
  path
}: {
  icon: React.ReactNode
  label: string
  path: string
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        backgroundColor: 'var(--color-bg)',
        fontSize: 12
      }}
    >
      <span style={{ color: 'var(--color-text-3)' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, color: 'var(--color-text-1)' }}>{label}</div>
        <div
          title={path}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'var(--color-text-3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {path}
        </div>
      </div>
      <button
        type="button"
        onClick={() => revealInFinder(path)}
        className="btn btn-ghost"
        style={{ padding: '4px 8px', fontSize: 11 }}
      >
        <FolderOpen size={12} /> Open
      </button>
    </div>
  )
}

function Field({
  label,
  required,
  children
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        className="divider-label"
        style={{ fontSize: 10 }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-terracotta)' }}> *</span>}
      </span>
      {children}
    </label>
  )
}
