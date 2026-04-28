import * as React from 'react'
import { CheckCircle, Warning, WarningOctagon } from '@phosphor-icons/react'
import type { KdpScoreSnapshot } from '@/lib/kdpScore'

type StatusBarProps = {
  wordCount: number
  chapterCount: number
  snapshot: KdpScoreSnapshot
  onShowChecklist: () => void
}

export function StatusBar({
  wordCount,
  chapterCount,
  snapshot,
  onShowChecklist
}: StatusBarProps): React.JSX.Element {
  const score = snapshot.score
  const rank =
    score >= 90 ? 'KDP-ready' : score >= 60 ? 'Nearly ready' : 'Draft'
  const icon =
    score >= 90 ? (
      <CheckCircle size={14} color="var(--color-sage)" weight="fill" />
    ) : score >= 60 ? (
      <Warning size={14} color="var(--color-gold)" weight="regular" />
    ) : (
      <WarningOctagon size={14} color="var(--color-terracotta)" weight="regular" />
    )
  return (
    <footer
      style={{
        height: 32,
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-2)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 24,
        fontSize: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="divider-label" style={{ fontSize: 10 }}>
          Words
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-1)'
          }}
        >
          {wordCount.toLocaleString()}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="divider-label" style={{ fontSize: 10 }}>
          Chapters
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-1)'
          }}
        >
          {chapterCount}
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={onShowChecklist}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '2px 10px',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          background: 'var(--color-bg)',
          color: 'var(--color-text-1)',
          cursor: 'pointer',
          transition: 'border-color 150ms ease-out'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-gold)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }}
      >
        {icon}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: 'var(--color-text-2)'
          }}
        >
          KDP Ready
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-gold)',
            fontWeight: 500
          }}
        >
          {score}/100
        </span>
        <span style={{ color: 'var(--color-text-3)' }}>· {rank}</span>
      </button>
    </footer>
  )
}
