import * as React from 'react'
import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { FileArrowUp, WarningCircle } from '@phosphor-icons/react'
import {
  ACCEPTED_MIME_TYPES,
  parseManuscript,
  type Manuscript
} from '@/lib/manuscript'

type DropZoneProps = {
  onManuscript: (manuscript: Manuscript) => void
}

export function DropZone({ onManuscript }: DropZoneProps): React.JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      setError(null)
      if (rejected.length > 0) {
        setError('Unsupported file type. Accepts .docx, .md, .txt.')
        return
      }
      const file = accepted[0]
      if (!file) return
      try {
        setLoading(true)
        const manuscript = await parseManuscript(file)
        onManuscript(manuscript)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file.')
      } finally {
        setLoading(false)
      }
    },
    [onManuscript]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    multiple: false
  })

  const border = isDragReject
    ? 'var(--color-terracotta)'
    : isDragActive
      ? 'var(--color-gold)'
      : 'var(--color-border)'

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}>
      <div
        {...getRootProps()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
          borderRadius: 4,
          border: `1.5px dashed ${border}`,
          backgroundColor: isDragActive ? 'rgba(200, 169, 110, 0.06)' : 'transparent',
          cursor: 'pointer',
          transition: 'border-color 150ms ease-out, background-color 150ms ease-out',
          userSelect: 'none'
        }}
      >
        <input {...getInputProps()} />
        <FileArrowUp
          size={40}
          weight="regular"
          color={isDragActive ? 'var(--color-gold)' : 'var(--color-text-3)'}
        />
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30,
            fontWeight: 500,
            color: 'var(--color-text-1)',
            margin: '24px 0 8px'
          }}
        >
          {loading
            ? 'Parsing manuscript…'
            : isDragActive
              ? 'Drop to parse'
              : 'Drop a manuscript to begin'}
        </p>
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-2)',
            margin: 0
          }}
        >
          Accepts .docx, .md, .txt.
        </p>
      </div>
      {error && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--color-terracotta)',
            fontSize: 13
          }}
        >
          <WarningCircle size={16} weight="regular" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
