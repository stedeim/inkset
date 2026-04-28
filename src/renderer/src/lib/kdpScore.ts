import type { TrimSize } from '@/lib/formatIpc'

export type KdpCheck = {
  id: string
  label: string
  detail: string
  passed: boolean
  warn?: boolean
  weight: number
}

export type KdpScoreSnapshot = {
  score: number
  checks: KdpCheck[]
}

type Inputs = {
  manuscriptLoaded: boolean
  wordCount: number
  trimSize: TrimSize | null
  chaptersDetected: number
  editComplete: boolean
  formatComplete: boolean
  coverComplete: boolean
  blurbPresent: boolean
}

const TRIM_MIN_WORDS: Record<TrimSize, number> = {
  '5x8': 20000,
  '5.25x8': 22000,
  '5.5x8.5': 22000,
  '6x9': 25000,
  '6.14x9.21': 26000,
  '7x10': 30000
}

export function computeKdpScore(input: Inputs): KdpScoreSnapshot {
  const checks: KdpCheck[] = []

  checks.push({
    id: 'manuscript',
    label: 'Manuscript loaded',
    detail: input.manuscriptLoaded
      ? `${input.wordCount.toLocaleString()} words`
      : 'Drop a file to begin.',
    passed: input.manuscriptLoaded,
    weight: 10
  })

  if (input.manuscriptLoaded) {
    const minWords = input.trimSize ? TRIM_MIN_WORDS[input.trimSize] : 25000
    const passed = input.wordCount >= minWords
    checks.push({
      id: 'word-count',
      label: 'Word count meets trim minimum',
      detail: passed
        ? `${input.wordCount.toLocaleString()} ≥ ${minWords.toLocaleString()}`
        : `${input.wordCount.toLocaleString()} / ${minWords.toLocaleString()} for ${input.trimSize ?? 'the chosen trim'}`,
      passed,
      warn: !passed,
      weight: 15
    })
  }

  checks.push({
    id: 'chapters',
    label: 'Chapter structure detected',
    detail: input.chaptersDetected
      ? `${input.chaptersDetected} chapter${input.chaptersDetected === 1 ? '' : 's'} found`
      : 'No chapter headings matched (Chapter N / # Heading).',
    passed: input.chaptersDetected > 0,
    weight: 15
  })

  checks.push({
    id: 'edit',
    label: 'Editing pipeline complete',
    detail: input.editComplete
      ? 'Grammar, style, and clarity passes finished.'
      : 'Run the three-pass editing pipeline.',
    passed: input.editComplete,
    weight: 20
  })

  checks.push({
    id: 'format',
    label: 'Interior formatted for KDP',
    detail: input.formatComplete
      ? 'Print-ready PDF + EPUB generated.'
      : 'Generate interior PDF + EPUB.',
    passed: input.formatComplete,
    weight: 15
  })

  checks.push({
    id: 'cover',
    label: 'Cover generated',
    detail: input.coverComplete
      ? 'Wrap + front-only PDFs in output/covers.'
      : 'Generate or upload a cover.',
    passed: input.coverComplete,
    weight: 15
  })

  checks.push({
    id: 'blurb',
    label: 'Back-cover copy written',
    detail: input.blurbPresent
      ? 'Blurb text is set.'
      : 'Write the back-cover blurb.',
    passed: input.blurbPresent,
    weight: 10
  })

  const total = checks.reduce((sum, c) => sum + c.weight, 0)
  const earned = checks
    .filter((c) => c.passed)
    .reduce((sum, c) => sum + c.weight, 0)
  const score = Math.round((earned / total) * 100)

  return { score, checks }
}
