export type ChapterRef = {
  id: string
  title: string
  /** Character offset into the plain-text representation. */
  offset: number
  /** 1-based chapter number for display. */
  index: number
}

function slug(s: string, i: number): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || `chapter-${i}`
  )
}

function isHeadingLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  if (/^chapter\s+\d+/i.test(t)) return true
  if (/^chapter\s+[ivxlcdm]+\b/i.test(t)) return true
  if (/^#\s+/.test(t)) return true
  return false
}

export function detectChapterRefs(text: string): ChapterRef[] {
  const refs: ChapterRef[] = []
  if (!text) return refs
  const lines = text.split(/\r?\n/)
  let offset = 0
  let i = 0
  for (const line of lines) {
    if (isHeadingLine(line)) {
      const title = line.trim().replace(/^#\s+/, '')
      i += 1
      refs.push({
        id: slug(title, i),
        title,
        offset,
        index: i
      })
    }
    offset += line.length + 1 // +1 for the newline we split on
  }
  return refs
}
