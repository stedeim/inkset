import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  FolderOpen,
  Image as ImageIcon,
  Sparkle,
  Upload,
  WarningCircle
} from '@phosphor-icons/react'
import { Book3DMockup } from '@/components/Book3DMockup'
import { TRIM_SIZES, TRIM_DIMS_IN, type TrimSize } from '@/lib/formatIpc'
import {
  startCover,
  rerollCover,
  uploadCover,
  revealCover,
  subscribeCoverComplete,
  subscribeCoverProgress,
  type CoverInput,
  type CoverProgress,
  type CoverResult,
  type PaperColor
} from '@/lib/coverIpc'

type Status = 'idle' | 'running' | 'done' | 'error'
type Source = 'ai' | 'upload'

const GENRES = [
  'Non-fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Sci-fi',
  'Fantasy',
  'Literary Fiction',
  'Memoir',
  'Self-help',
  'Business',
  'Other'
]

const STEP_LABELS: Record<CoverProgress['step'], string> = {
  concept: 'Generating concept prompts…',
  art: 'Creating cover art…',
  front: 'Composing front cover…',
  back: 'Composing back cover…',
  spine: 'Composing spine…',
  wrap: 'Assembling wrap…',
  done: 'Done.'
}

type Props = {
  defaultTitle?: string
  defaultAuthor?: string
  defaultSubtitle?: string
  defaultTrim?: TrimSize
  defaultBlurb?: string
  onResult?: (r: CoverResult) => void
}

export function CoverPanel({
  defaultTitle,
  defaultAuthor,
  defaultSubtitle,
  defaultTrim,
  defaultBlurb,
  onResult
}: Props): React.JSX.Element {
  const [source, setSource] = useState<Source>('ai')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [title, setTitle] = useState(defaultTitle ?? '')
  const [subtitle, setSubtitle] = useState(defaultSubtitle ?? '')
  const [author, setAuthor] = useState(defaultAuthor ?? '')
  const [genre, setGenre] = useState('Non-fiction')
  const [mood, setMood] = useState('')
  const [trim, setTrim] = useState<TrimSize>(defaultTrim ?? '6x9')
  const [pageCount, setPageCount] = useState<string>('')
  const [paperColor, setPaperColor] = useState<PaperColor>('white')
  const blurb = defaultBlurb ?? ''
  const [authorBio, setAuthorBio] = useState('')

  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<CoverProgress | null>(null)
  const [artPreview, setArtPreview] = useState<string | null>(null)
  const [result, setResult] = useState<CoverResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const jobIdRef = useRef<string | null>(null)

  useEffect(() => {
    const unsubP = subscribeCoverProgress((e) => {
      if (e.jobId !== jobIdRef.current) return
      setProgress(e)
      if (e.step === 'art' && e.artDataUrl) setArtPreview(e.artDataUrl)
    })
    const unsubC = subscribeCoverComplete((e) => {
      if (e.jobId !== jobIdRef.current) return
      if (e.ok) {
        setResult(e.result)
        setArtPreview(e.result.thumbnails.art)
        setStatus('done')
        setProgress({ step: 'done', message: 'Done.' })
        onResult?.(e.result)
      } else {
        setError(e.error)
        setStatus('error')
      }
    })
    return () => {
      unsubP()
      unsubC()
    }
  }, [onResult])

  const baseValid =
    title.trim() && author.trim() && Number(pageCount) > 0
  const canRun =
    status !== 'running' &&
    baseValid &&
    (source === 'ai' ? !!genre.trim() && !!mood.trim() : !!uploadFile)

  const buildInput = (): CoverInput => ({
    title: title.trim(),
    subtitle: subtitle.trim() || undefined,
    author: author.trim(),
    genre: source === 'ai' ? genre.trim() : undefined,
    mood: source === 'ai' ? mood.trim() : undefined,
    trim: TRIM_DIMS_IN[trim],
    pageCount: Number(pageCount),
    paperColor,
    blurb: blurb.trim() || undefined,
    authorBio: authorBio.trim() || undefined
  })

  const handleRun = async (): Promise<void> => {
    setStatus('running')
    setError(null)
    setArtPreview(null)
    setResult(null)
    if (source === 'ai') {
      setProgress({ step: 'concept', message: STEP_LABELS.concept })
      jobIdRef.current = startCover(buildInput())
    } else if (uploadFile) {
      setProgress({ step: 'art', message: 'Reading uploaded art…' })
      jobIdRef.current = await uploadCover(buildInput(), uploadFile)
    }
  }

  const handleReroll = (nextIndex: number): void => {
    if (!result) return
    setStatus('running')
    setError(null)
    setArtPreview(null)
    setProgress({ step: 'concept', message: STEP_LABELS.art })
    jobIdRef.current = rerollCover(buildInput(), result.prompts, nextIndex)
  }

  const primaryLabel =
    source === 'ai'
      ? result ? 'Generate New Cover' : 'Generate Cover'
      : result ? 'Re-compose from Upload' : 'Compose Cover'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'inline-flex',
          padding: 2,
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          fontSize: 12
        }}
      >
        {(['ai', 'upload'] as const).map((s) => (
          <button
            key={s}
            type="button"
            disabled={status === 'running'}
            onClick={() => setSource(s)}
            style={{
              flex: 1,
              padding: '6px 12px',
              border: 'none',
              borderRadius: 3,
              background:
                source === s ? 'var(--color-surface)' : 'transparent',
              color:
                source === s ? 'var(--color-text-1)' : 'var(--color-text-2)',
              fontWeight: source === s ? 600 : 400,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center'
            }}
          >
            {s === 'ai' ? <Sparkle size={13} /> : <Upload size={13} />}
            {s === 'ai' ? 'AI art' : 'Upload'}
          </button>
        ))}
      </div>

      <Field label="Title" required>
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

      {source === 'ai' && (
        <>
          <Field label="Genre" required>
            <select
              className="input-field"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={status === 'running'}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mood / tone" required>
            <input
              className="input-field"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g. warm and inviting"
              disabled={status === 'running'}
            />
          </Field>
        </>
      )}

      {source === 'upload' && (
        <Field label="Cover art file" required>
          <UploadControl
            file={uploadFile}
            onChange={setUploadFile}
            disabled={status === 'running'}
          />
        </Field>
      )}

      <Field label="Trim size">
        <select
          className="input-field"
          value={trim}
          onChange={(e) => setTrim(e.target.value as TrimSize)}
          disabled={status === 'running'}
        >
          {TRIM_SIZES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Page count" required>
        <input
          type="number"
          min={1}
          className="input-field"
          value={pageCount}
          onChange={(e) => setPageCount(e.target.value)}
          placeholder="e.g. 240"
          disabled={status === 'running'}
        />
      </Field>
      <Field label="Paper color">
        <div
          style={{
            display: 'flex',
            padding: 2,
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 4
          }}
        >
          {(['white', 'cream'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setPaperColor(c)}
              disabled={status === 'running'}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: 'none',
                borderRadius: 3,
                background:
                  paperColor === c ? 'var(--color-surface)' : 'transparent',
                color:
                  paperColor === c ? 'var(--color-text-1)' : 'var(--color-text-2)',
                cursor: 'pointer',
                fontSize: 12,
                textTransform: 'capitalize',
                fontWeight: paperColor === c ? 600 : 400
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Bio (optional)">
        <textarea
          className="input-field"
          style={{ minHeight: 56 }}
          value={authorBio}
          onChange={(e) => setAuthorBio(e.target.value)}
          disabled={status === 'running'}
        />
      </Field>

      <button className="btn btn-primary" onClick={handleRun} disabled={!canRun}>
        {status === 'running' ? (
          <CircleNotch size={16} className="phosphor-spin" />
        ) : source === 'ai' ? (
          <Sparkle size={16} />
        ) : (
          <Upload size={16} />
        )}
        {primaryLabel}
      </button>

      {status === 'running' && progress && (
        <RunningView progress={progress} artPreview={artPreview} />
      )}
      {status === 'error' && error && <ErrorView error={error} />}
      {status === 'done' && result && (
        <ResultView
          result={result}
          canReroll={source === 'ai'}
          onReroll={handleReroll}
        />
      )}
      <style>{`
        @keyframes phosphor-spin { to { transform: rotate(360deg); } }
        .phosphor-spin { animation: phosphor-spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

function UploadControl({
  file,
  onChange,
  disabled
}: {
  file: File | null
  onChange: (f: File | null) => void
  disabled: boolean
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn btn-secondary"
        disabled={disabled}
        style={{ padding: '6px 12px', fontSize: 12 }}
      >
        <ImageIcon size={14} />
        {file ? 'Change' : 'Choose'}
      </button>
      {file && previewUrl ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <img
            src={previewUrl}
            alt="preview"
            style={{
              height: 40,
              width: 30,
              objectFit: 'cover',
              border: '1px solid var(--color-border)'
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-text-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={file.name}
          >
            {file.name}
          </span>
        </div>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
          PNG / JPG / WebP
        </span>
      )}
    </div>
  )
}

function RunningView({
  progress,
  artPreview
}: {
  progress: CoverProgress
  artPreview: string | null
}): React.JSX.Element {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <CircleNotch size={14} className="phosphor-spin" color="var(--color-gold)" />
        <span>{STEP_LABELS[progress.step]}</span>
      </div>
      {artPreview && (
        <img
          src={artPreview}
          alt="cover art"
          style={{
            width: '100%',
            borderRadius: 2,
            border: '1px solid var(--color-border)'
          }}
        />
      )}
    </div>
  )
}

function ErrorView({ error }: { error: string }): React.JSX.Element {
  const isKey = /api_key/i.test(error)
  return (
    <div
      style={{
        borderLeft: '3px solid var(--color-terracotta)',
        paddingLeft: 12,
        fontSize: 12,
        color: 'var(--color-text-2)'
      }}
    >
      <div style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}>
        Cover generation failed
      </div>
      <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{error}</div>
      {isKey && (
        <div style={{ marginTop: 8 }}>
          Add the key to <code>.env</code> and restart the app.
        </div>
      )}
    </div>
  )
}

function ResultView({
  result,
  canReroll,
  onReroll
}: {
  result: CoverResult
  canReroll: boolean
  onReroll: (idx: number) => void
}): React.JSX.Element {
  const alternatives = canReroll
    ? result.prompts.map((_, i) => i).filter((i) => i !== result.chosenPromptIndex)
    : []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <CheckCircle size={16} weight="fill" color="var(--color-sage)" />
        <span style={{ fontWeight: 500 }}>Cover ready</span>
      </div>

      <div
        style={{
          padding: 12,
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          backgroundColor: 'var(--color-bg)'
        }}
      >
        <Book3DMockup
          frontDataUrl={result.thumbnails.front}
          spineDataUrl={result.thumbnails.spine}
          trim={result.dimensions.trim}
          spineWidthIn={result.dimensions.spine.widthIn}
          heightPx={220}
        />
        <p
          style={{
            textAlign: 'center',
            margin: 0,
            fontSize: 10,
            color: 'var(--color-text-3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}
        >
          Hover to rotate
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto auto',
          gap: 4,
          justifyContent: 'center'
        }}
      >
        {(['back', 'spine', 'front'] as const).map((k) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <img
              src={result.thumbnails[k]}
              alt={k}
              style={{
                maxHeight: 100,
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)'
              }}
            />
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-3)'
              }}
            >
              {k}
            </span>
          </div>
        ))}
      </div>

      <dl
        style={{
          margin: 0,
          fontSize: 11,
          color: 'var(--color-text-2)',
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          gap: '4px 16px'
        }}
      >
        <dt>Wrap</dt>
        <dd style={{ fontFamily: "'JetBrains Mono', monospace", margin: 0, color: 'var(--color-text-1)' }}>
          {result.dimensions.wrap.widthIn.toFixed(3)}" × {result.dimensions.wrap.heightIn.toFixed(3)}"
        </dd>
        <dt>Spine</dt>
        <dd style={{ fontFamily: "'JetBrains Mono', monospace", margin: 0, color: 'var(--color-text-1)' }}>
          {result.dimensions.spine.widthIn.toFixed(3)}"
        </dd>
      </dl>

      <FileRow label="Full wrap PDF" path={result.wrapPdfPath} />
      <FileRow label="Front-only PDF" path={result.frontPdfPath} />

      {alternatives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="divider-label" style={{ fontSize: 10 }}>
            Re-roll with
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {alternatives.map((i) => (
              <button
                key={i}
                onClick={() => onReroll(i)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: 11 }}
                title={result.prompts[i]}
              >
                <ArrowsClockwise size={12} />
                Prompt #{i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--color-text-2)' }}>
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

function FileRow({ label, path }: { label: string; path: string }): React.JSX.Element {
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
        fontSize: 11
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, color: 'var(--color-text-1)', fontSize: 12 }}>{label}</div>
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
        onClick={() => revealCover(path)}
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
      <span className="divider-label" style={{ fontSize: 10 }}>
        {label}
        {required && <span style={{ color: 'var(--color-terracotta)' }}> *</span>}
      </span>
      {children}
    </label>
  )
}
