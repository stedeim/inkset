import * as React from 'react'
import { useEffect, useMemo } from 'react'
import { Command } from 'cmdk'
import { MagnifyingGlass } from '@phosphor-icons/react'

export type PaletteGroup = 'Manuscript' | 'Navigation' | 'Tools' | 'App'

export type PaletteCommand = {
  id: string
  group: PaletteGroup
  label: string
  hint?: string
  keywords?: string[]
  icon?: React.ReactNode
  disabled?: boolean
  perform: () => void
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  commands: PaletteCommand[]
}

const GROUP_ORDER: PaletteGroup[] = ['Manuscript', 'Navigation', 'Tools', 'App']

export function CommandPalette({ open, onOpenChange, commands }: Props): React.JSX.Element {
  const grouped = useMemo(() => {
    const out: Record<PaletteGroup, PaletteCommand[]> = {
      Manuscript: [],
      Navigation: [],
      Tools: [],
      App: []
    }
    for (const c of commands) out[c.group].push(c)
    return out
  }, [commands])

  useEffect(() => {
    // Lock body scroll while open.
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return undefined
  }, [open])

  return (
    <>
      <style>{paletteStyles}</style>
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Command palette"
        className="ink-cmd"
      >
        <div className="ink-cmd-shell">
          <div className="ink-cmd-search">
            <MagnifyingGlass size={16} weight="regular" />
            <Command.Input
              placeholder="Search for actions, chapters, or settings…"
              autoFocus
            />
            <kbd className="ink-cmd-esc">Esc</kbd>
          </div>
          <Command.List className="ink-cmd-list">
            <Command.Empty className="ink-cmd-empty">
              Nothing matches that.
            </Command.Empty>

            {GROUP_ORDER.map((group) => {
              const items = grouped[group]
              if (!items.length) return null
              return (
                <Command.Group
                  key={group}
                  heading={group}
                  className="ink-cmd-group"
                >
                  {items.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.group} ${cmd.label} ${(cmd.keywords ?? []).join(' ')}`}
                      disabled={cmd.disabled}
                      onSelect={() => {
                        onOpenChange(false)
                        // Run after close so focus doesn't fight.
                        setTimeout(cmd.perform, 0)
                      }}
                      className="ink-cmd-item"
                    >
                      <span className="ink-cmd-icon">{cmd.icon}</span>
                      <span className="ink-cmd-label">{cmd.label}</span>
                      {cmd.hint && <span className="ink-cmd-hint">{cmd.hint}</span>}
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  )
}

const paletteStyles = `
.ink-cmd[cmdk-dialog],
.ink-cmd [cmdk-dialog] {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 120px;
  background-color: rgba(28, 25, 23, 0.42);
  animation: ink-cmd-fade 150ms ease-out;
}
html.dark .ink-cmd[cmdk-dialog],
html.dark .ink-cmd [cmdk-dialog] {
  background-color: rgba(0, 0, 0, 0.6);
}

.ink-cmd [cmdk-root] {
  width: 640px;
  max-width: calc(100vw - 32px);
  background-color: var(--color-bg);
  color: var(--color-text-1);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  animation: ink-cmd-rise 150ms ease-out;
}

.ink-cmd-shell {
  display: flex;
  flex-direction: column;
  max-height: 520px;
}

.ink-cmd-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-2);
}
.ink-cmd-search [cmdk-input] {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: var(--color-text-1);
}
.ink-cmd-search [cmdk-input]::placeholder {
  color: var(--color-text-3);
}
.ink-cmd-esc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  color: var(--color-text-3);
}

.ink-cmd-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: 440px;
}

.ink-cmd-empty {
  padding: 24px 16px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-style: italic;
  text-align: center;
  color: var(--color-text-3);
}

.ink-cmd-group [cmdk-group-heading] {
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-text-3);
  text-transform: uppercase;
  padding: 12px 10px 6px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
}
.ink-cmd-group:first-child [cmdk-group-heading] {
  padding-top: 4px;
}

.ink-cmd-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-2);
  transition: background-color 120ms ease-out, color 120ms ease-out;
  border-left: 2px solid transparent;
}
.ink-cmd-item[data-selected="true"] {
  background-color: rgba(200, 169, 110, 0.1);
  color: var(--color-text-1);
  border-left-color: var(--color-gold);
}
.ink-cmd-item[data-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
}

.ink-cmd-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--color-text-3);
}
.ink-cmd-item[data-selected="true"] .ink-cmd-icon {
  color: var(--color-tobacco);
}
.ink-cmd-label {
  flex: 1;
  color: inherit;
}
.ink-cmd-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--color-text-3);
}

@keyframes ink-cmd-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ink-cmd-rise {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
`
