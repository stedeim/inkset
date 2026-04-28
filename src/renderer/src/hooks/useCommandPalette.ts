import { useEffect, useState } from 'react'

export function useCommandPalette(): {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
} {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // ⌘K / Ctrl+K toggles
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return {
    open,
    setOpen,
    toggle: () => setOpen((v) => !v)
  }
}
