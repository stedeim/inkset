import * as React from 'react'
import { Books, Moon, Sun, MagnifyingGlass } from '@phosphor-icons/react'
import { useAppState } from '@/state/AppContext'

type TopNavProps = {
  onReset: () => void
  onOpenPalette: () => void
}

export function TopNav({ onReset, onOpenPalette }: TopNavProps): React.JSX.Element {
  const { theme, toggleTheme } = useAppState()

  return (
    <header
      style={{
        height: 48,
        backgroundColor: 'var(--color-ink)',
        color: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Books size={20} weight="regular" color="var(--color-gold)" />
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}
        >
          Inkset
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onOpenPalette}
          title="Search commands (⌘K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px 6px 8px',
            backgroundColor: 'rgba(250, 250, 249, 0.06)',
            border: '1px solid rgba(250, 250, 249, 0.12)',
            borderRadius: 6,
            color: '#D6D3D1',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            cursor: 'pointer',
            transition: 'background-color 150ms ease-out, border-color 150ms ease-out'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(250, 250, 249, 0.12)'
            e.currentTarget.style.borderColor = 'rgba(200, 169, 110, 0.4)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(250, 250, 249, 0.06)'
            e.currentTarget.style.borderColor = 'rgba(250, 250, 249, 0.12)'
          }}
        >
          <MagnifyingGlass size={14} />
          <span>Search</span>
          <kbd
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: '1px 6px',
              border: '1px solid rgba(250,250,249,0.2)',
              borderRadius: 3,
              color: '#A8A29E'
            }}
          >
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 6,
            color: 'var(--color-gold)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="btn btn-ghost"
          style={{ color: '#D6D3D1', padding: '4px 12px', fontSize: 13 }}
        >
          New Project
        </button>
      </div>
    </header>
  )
}
