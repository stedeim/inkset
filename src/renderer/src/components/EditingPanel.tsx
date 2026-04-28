import * as React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  CheckCircle,
  CircleNotch,
  FloppyDisk,
  MagicWand,
  WarningCircle
} from '@phosphor-icons/react'
import { formatFileSize } from '@/lib/utils'
import type { Manuscript } from '@/lib/manuscript'
import {
  startEditing,
  subscribeToComplete,
  subscribeToProgress,
  saveEdited,
  type EditedManuscript,
  type EditingProgressEvent,
  type PassName,
  type PassResult
} from '@/lib/ipc'

const LONG_MANUSCRIPT_THRESHOLD = 150_000
const TAIL_MAX_CHARS = 3500

const PASS_LABELS: Record<PassName, string> = {
  grammar: 'Pass 1 — Grammar',
  style: 'Pass 2 — Style',
  clarity: 'Pass 3 — Clarity'
}

type Status = 'idle' | 'running' | 'done' | 'error'

type Props = {
  manuscript: Manuscript
  editResult: EditedManuscript | null
  onEditComplete: (r: EditedManuscript) => void
}

export function EditingPanel({
  manuscript,
  editResult,
  onEditComplete
}: Props): React.JSX.Element {
  const [status, setStatus] = useState<Status>(editResult ? 'done' : 'idle')
  const [progress, setProgress] = useState<EditingProgressEvent | null>(null)
  const [tail, setTail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [failedPass, setFailedPass] = useState<PassName | null>(null)
  const [partialPasses, setPartialPasses] = useState<PassResult[]>([])
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const jobIdRef = useRef<string | null>(null)

  useEffect(() => {
    const unsubP = subscribeToProgress((evt) => {
      if (evt.jobId !== jobIdRef.current) return
      setProgress(evt)
      if (evt.passStart || evt.deltaText) {
        setTail((prev) => {
          let next = prev
          if (evt.passStart) {
            const header = `\n\n━━━ ${PASS_LABELS[evt.passName]} ━━━\n\n`
            next = next ? next + header : header.trimStart()
          }
          if (evt.deltaText) next += evt.deltaText
          if (next.length > TAIL_MAX_CHARS) {
            next = '…' + next.slice(next.length - TAIL_MAX_CHARS)
          }
          return next
        })
      }
    })
    const unsubC = subscribeToComplete((evt) => {
      if (evt.jobId !== jobIdRef.current) return
      if (evt.ok) {
        setStatus('done')
        setProgress(null)
        setError(null)
        setFailedPass(null)
        setPartialPasses([])
        onEditComplete(evt.result)
      } else {
        setStatus('error')
        setError(evt.error)
        setFailedPass(evt.failedPass)
        setPartialPasses(evt.completedPasses)
      }
    })
    return () => {
      unsubP()
      unsubC()
    }
  }, [onEditComplete])

  const handleStart = async (): Promise<void> => {
    setStatus('running')
    setError(null)
    setProgress(null)
    setTail('')
    setSaveStatus(null)
    const jobId = await startEditing(manuscript.content)
    jobIdRef.current = jobId
  }

  const handleSave = async (): Promise<void> => {
    if (!editResult) return
    try {
      setSaveStatus('Saving…')
      const result = await saveEdited(manuscript.filename, editResult.editedContent)
      setSaveStatus(
        `Saved: ${result.path} (${formatFileSize(result.bytesWritten)})`
      )
    } catch (err) {
      setSaveStatus(err instanceof Error ? `Save failed: ${err.message}` : 'Save failed.')
    }
  }

  const isLong = manuscript.wordCount > LONG_MANUSCRIPT_THRESHOLD

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isLong && status === 'idle' && (
        <WarnBanner>
          {manuscript.wordCount.toLocaleString()} words is above 150,000. Editing
          will take several minutes and cost proportionally more.
        </WarnBanner>
      )}

      {status === 'idle' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5, margin: 0 }}>
            Three sequential passes: <strong>grammar → style → clarity</strong>.
            Each pass reads the previous output. Voice and intentional
            stylistic choices are preserved.
          </p>
          <button className="btn btn-primary" onClick={handleStart}>
            <MagicWand size={16} weight="regular" />
            Run Editing Pipeline
          </button>
        </>
      )}

      {status === 'running' && progress && (
        <RunningView progress={progress} tail={tail} />
      )}
      {status === 'running' && !progress && (
        <RunningView progress={null} tail={tail} />
      )}

      {status === 'error' && error && (
        <ErrorView
          error={error}
          failedPass={failedPass}
          partialPasses={partialPasses}
          onRetry={handleStart}
        />
      )}

      {status === 'done' && editResult && (
        <DoneView
          editResult={editResult}
          saveStatus={saveStatus}
          onSave={handleSave}
          onRerun={handleStart}
        />
      )}
    </div>
  )
}

function RunningView({
  progress,
  tail
}: {
  progress: EditingProgressEvent | null
  tail: string
}): React.JSX.Element {
  const percent = progress?.percentComplete ?? 0
  const tokens = progress?.tokensUsed ?? 0
  const label = progress ? PASS_LABELS[progress.passName] : 'Starting…'
  const roughCost = (tokens * 9) / 1_000_000

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <CircleNotch size={14} className="phosphor-spin" color="var(--color-gold)" />
        <span style={{ fontWeight: 500 }}>{label}</span>
      </div>
      <div
        style={{
          height: 4,
          width: '100%',
          backgroundColor: 'var(--color-border)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            backgroundColor: 'var(--color-gold)',
            transition: 'width 150ms ease-out'
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--color-text-3)',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        <span>{percent}%</span>
        <span>
          {tokens.toLocaleString()} tok · ~${roughCost.toFixed(3)}
        </span>
      </div>
      <LiveTail tail={tail} />
      <style>{`
        @keyframes phosphor-spin { to { transform: rotate(360deg); } }
        .phosphor-spin { animation: phosphor-spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

function LiveTail({ tail }: { tail: string }): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [tail])
  return (
    <div
      ref={scrollRef}
      style={{
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        maxHeight: 220,
        overflowY: 'auto',
        padding: 12,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: 'var(--color-text-2)'
      }}
    >
      {tail || 'Waiting for Claude…'}
      <span
        style={{
          display: 'inline-block',
          width: '0.5em',
          height: '1em',
          verticalAlign: '-0.15em',
          backgroundColor: 'var(--color-gold)',
          opacity: 0.85,
          marginLeft: 1,
          animation: 'caret-blink 1s steps(2) infinite'
        }}
      />
      <style>{`@keyframes caret-blink { 50% { opacity: 0; } }`}</style>
    </div>
  )
}

function ErrorView({
  error,
  failedPass,
  partialPasses,
  onRetry
}: {
  error: string | null
  failedPass: PassName | null
  partialPasses: PassResult[]
  onRetry: () => void
}): React.JSX.Element {
  const showKeyHelp = error?.toLowerCase().includes('anthropic_api_key') ?? false
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          borderLeft: '3px solid var(--color-terracotta)',
          paddingLeft: 12,
          fontSize: 13
        }}
      >
        <div style={{ fontWeight: 500, color: 'var(--color-terracotta)' }}>
          {failedPass ? `${PASS_LABELS[failedPass]} failed` : 'Editing failed'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 4 }}>
          {error}
        </div>
        {showKeyHelp && (
          <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 8 }}>
            Add the key to <code>.env</code>, then restart the app.
          </div>
        )}
        {partialPasses.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 8 }}>
            Completed: {partialPasses.map((p) => PASS_LABELS[p.name]).join(', ')}.
          </div>
        )}
      </div>
      <button className="btn btn-secondary" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function DoneView({
  editResult,
  saveStatus,
  onSave,
  onRerun
}: {
  editResult: EditedManuscript
  saveStatus: string | null
  onSave: () => void
  onRerun: () => void
}): React.JSX.Element {
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
        <span style={{ fontWeight: 500 }}>Editing complete</span>
      </div>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          gap: '4px 16px',
          margin: 0,
          fontSize: 12,
          color: 'var(--color-text-2)'
        }}
      >
        <dt>Input tokens</dt>
        <dd
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-1)',
            margin: 0
          }}
        >
          {editResult.totalTokensIn.toLocaleString()}
        </dd>
        <dt>Output tokens</dt>
        <dd
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-1)',
            margin: 0
          }}
        >
          {editResult.totalTokensOut.toLocaleString()}
        </dd>
        <dt>Estimated cost</dt>
        <dd
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-gold)',
            margin: 0
          }}
        >
          ${editResult.estimatedCostUsd.toFixed(4)}
        </dd>
      </dl>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={onSave}>
          <FloppyDisk size={16} />
          Save to file
        </button>
        <button className="btn btn-secondary" onClick={onRerun}>
          Run again
        </button>
      </div>
      {saveStatus && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-3)',
            margin: 0,
            wordBreak: 'break-all'
          }}
        >
          {saveStatus}
        </p>
      )}
    </div>
  )
}

function WarnBanner({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div
      style={{
        borderLeft: '3px solid var(--color-terracotta)',
        paddingLeft: 12,
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--color-text-2)',
        display: 'flex',
        gap: 8
      }}
    >
      <WarningCircle
        size={14}
        weight="regular"
        color="var(--color-terracotta)"
        style={{ flexShrink: 0, marginTop: 2 }}
      />
      <span>{children}</span>
    </div>
  )
}
