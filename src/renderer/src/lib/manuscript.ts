import mammoth from 'mammoth'
import { countWords } from './utils'

export type ManuscriptFormat = 'docx' | 'md' | 'txt'

export type Manuscript = {
  filename: string
  size: number
  wordCount: number
  content: string
  format: ManuscriptFormat
}

const EXTENSION_MAP: Record<string, ManuscriptFormat> = {
  docx: 'docx',
  md: 'md',
  markdown: 'md',
  txt: 'txt'
}

export const ACCEPTED_EXTENSIONS = ['.docx', '.md', '.markdown', '.txt'] as const

export const ACCEPTED_MIME_TYPES: Record<string, string[]> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/markdown': ['.md', '.markdown'],
  'text/plain': ['.txt', '.md']
}

function getFormat(filename: string): ManuscriptFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_MAP[ext] ?? null
}

export async function parseManuscript(file: File): Promise<Manuscript> {
  const format = getFormat(file.name)
  if (!format) {
    throw new Error(`Unsupported file type: ${file.name}. Accepts .docx, .md, .txt.`)
  }

  let content: string
  if (format === 'docx') {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    content = result.value
  } else {
    content = await file.text()
  }

  return {
    filename: file.name,
    size: file.size,
    wordCount: countWords(content),
    content,
    format
  }
}
