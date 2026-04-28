import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  CheckCircle,
  Eye,
  EyeSlash,
  Gear,
  WarningCircle
} from '@phosphor-icons/react'
import {
  getKeys,
  setKeys,
  type MaskedKeys
} from '@/lib/settingsIpc'

type Props = {
  open: boolean
  onClose: () => void
}

type Field = 'ANTHROPIC_API_KEY' | 'OPENAI_API_KEY' | 'OPENROUTER_API_KEY'

export function SettingsModal({ open, onClose }: Props): React.JSX.Element | null {
  const [state, setState] = useState<MaskedKeys | null>(null)
  const [anthropic, setAnthropic] = useState('')
  const [openai, setOpenai] = useState('')
  const [openrouter, setOpenrouter] = useState('')
  const [reveal, setReveal] = useState<Record<Field, boolean>>({
    ANTHROPIC_API_KEY: false,
    OPENAI_API_KEY: false,
    OPENROUTER_API_KEY: false
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getKeys()
      .then((k) => {
        if (!cancelled) {
          setState(k)
          setAnthropic('')
          setOpenai('')
          setOpenrouter('')
          setError(null)
          setSaveOk(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    setSaveOk(false)
    try {
      const payload: {
        ANTHROPIC_API_KEY?: string
        OPENAI_API_KEY?: string
        OPENROUTER_API_KEY?: string
      } = {}
      if (anthropic.trim()) payload.ANTHROPIC_API_KEY = anthropic.trim()
      if (openai.trim()) payload.OPENAI_API_KEY = openai.trim()
      if (openrouter.trim()) payload.OPENROUTER_API_KEY = openrouter.trim()
      const next = await setKeys(payload)
      setState(next)
      setAnthropic('')
      setOpenai('')
      setOpenrouter('')
      setSaveOk(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const canSave =
    !saving && (anthropic.trim() || openai.trim() || openrouter.trim())

  return (
    <div
      role="dialog"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 96,
        backgroundColor: 'rgba(28, 25, 23, 0.42)',
        animation: 'ink-cmd-fade 150ms ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
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
            fontSize: 28,
            fontWeight: 600,
            margin: '0 0 8px',
            color: 'var(--color-text-1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Gear size={20} weight="regular" color="var(--color-gold)" />
          Settings
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-2)',
            margin: '0 0 20px',
            lineHeight: 1.5
          }}
        >
          Paste your API keys. They're stored locally at{' '}
          <code
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: 'var(--color-text-1)'
            }}
          >
            {state?.envPath ?? '—'}
          </code>
          . Inkset never transmits them anywhere except directly to Anthropic or OpenAI.
        </p>

        <KeyField
          label="Anthropic API Key"
          helper="Used for editing passes and back-cover copy. Starts with sk-ant-…"
          existing={state?.anthropic}
          reveal={reveal.ANTHROPIC_API_KEY}
          onReveal={() =>
            setReveal((r) => ({ ...r, ANTHROPIC_API_KEY: !r.ANTHROPIC_API_KEY }))
          }
          value={anthropic}
          onChange={setAnthropic}
          disabled={saving}
        />
        <div style={{ height: 16 }} />
        <KeyField
          label="OpenAI API Key"
          helper="Used for DALL-E 3 cover art. Starts with sk-…"
          existing={state?.openai}
          reveal={reveal.OPENAI_API_KEY}
          onReveal={() =>
            setReveal((r) => ({ ...r, OPENAI_API_KEY: !r.OPENAI_API_KEY }))
          }
          value={openai}
          onChange={setOpenai}
          disabled={saving}
        />
        <div style={{ height: 16 }} />
        <KeyField
          label="OpenRouter API Key (optional)"
          helper="Unified gateway to many models. If set and Anthropic is not, editing passes route through OpenRouter automatically. Starts with sk-or-…"
          existing={state?.openrouter}
          reveal={reveal.OPENROUTER_API_KEY}
          onReveal={() =>
            setReveal((r) => ({
              ...r,
              OPENROUTER_API_KEY: !r.OPENROUTER_API_KEY
            }))
          }
          value={openrouter}
          onChange={setOpenrouter}
          disabled={saving}
        />

        {error && (
          <div
            style={{
              marginTop: 16,
              borderLeft: '3px solid var(--color-terracotta)',
              paddingLeft: 12,
              color: 'var(--color-terracotta)',
              fontSize: 12
            }}
          >
            <WarningCircle
              size={12}
              style={{ verticalAlign: 'middle', marginRight: 4 }}
            />
            {error}
          </div>
        )}
        {saveOk && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--color-sage)',
              fontSize: 12
            }}
          >
            <CheckCircle size={14} weight="fill" /> Saved. Services will pick up
            the new keys on their next call.
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>
            Leave a field empty to keep the existing key.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn btn-ghost">
              Close
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={!canSave}
            >
              {saving ? 'Saving…' : 'Save Keys'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KeyField({
  label,
  helper,
  existing,
  reveal,
  onReveal,
  value,
  onChange,
  disabled
}: {
  label: string
  helper: string
  existing: { present: boolean; masked: string | null } | undefined
  reveal: boolean
  onReveal: () => void
  value: string
  onChange: (v: string) => void
  disabled: boolean
}): React.JSX.Element {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6
        }}
      >
        <span
          className="divider-label"
          style={{ fontSize: 10 }}
        >
          {label}
        </span>
        {existing?.present ? (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: 'var(--color-sage)'
            }}
          >
            {existing.masked}
          </span>
        ) : (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: 'var(--color-text-3)'
            }}
          >
            not set
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={reveal ? 'text' : 'password'}
          className="input-field"
          value={value}
          placeholder="Paste new key to replace"
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{ paddingRight: 40, fontFamily: "'JetBrains Mono', monospace" }}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onReveal}
          aria-label={reveal ? 'Hide' : 'Reveal'}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-3)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {reveal ? <EyeSlash size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <p
        style={{
          fontSize: 11,
          color: 'var(--color-text-3)',
          margin: '6px 0 0',
          lineHeight: 1.5
        }}
      >
        {helper}
      </p>
    </div>
  )
}
