import { readFileSync, existsSync } from 'fs'
import { writeFile, rm } from 'fs/promises'
import { join } from 'path'
import puppeteer from 'puppeteer'
import { EPub } from '@lesjoursfr/html-to-epub'
import { marked } from 'marked'
import {
  interiorDir,
  tempJobDir,
  templatesPathCandidates
} from '../util/paths'

export type TrimSize =
  | '5x8'
  | '5.25x8'
  | '5.5x8.5'
  | '6x9'
  | '6.14x9.21'
  | '7x10'

type TrimDims = { widthInches: number; heightInches: number }

export const TRIM_DIMENSIONS: Record<TrimSize, TrimDims> = {
  '5x8': { widthInches: 5, heightInches: 8 },
  '5.25x8': { widthInches: 5.25, heightInches: 8 },
  '5.5x8.5': { widthInches: 5.5, heightInches: 8.5 },
  '6x9': { widthInches: 6, heightInches: 9 },
  '6.14x9.21': { widthInches: 6.14, heightInches: 9.21 },
  '7x10': { widthInches: 7, heightInches: 10 }
}

export type FormatConfig = {
  title: string
  author: string
  subtitle?: string
  dedication?: string
  trimSize: TrimSize
  manuscriptText: string
  chapterDelimiter?: string
}

export type FormatOptions = {
  pdf?: boolean
  epub?: boolean
}

export type FormatResult = {
  pdfPath: string | null
  epubPath: string | null
  chapterCount: number
  pageCount: number | null
  warnings: string[]
}

type Chapter = {
  title: string
  body: string
  /** True when this chapter came from a detected heading line. False when
   *  it's the synthetic single-chapter fallback we build for manuscripts
   *  with no chapter structure — in that case we do NOT drop-cap, because
   *  there's no chapter opening to mark. */
  hasHeading: boolean
}

function resolveTemplatePath(): string {
  const dirs = templatesPathCandidates()
  for (const dir of dirs) {
    const path = join(dir, 'interior.html')
    if (existsSync(path)) return path
  }
  throw new Error(
    `Could not locate interior.html template. Looked in: ${dirs.join(', ')}`
  )
}

let templateCache: string | null = null
function loadTemplate(): string {
  if (templateCache) return templateCache
  templateCache = readFileSync(resolveTemplatePath(), 'utf-8')
  return templateCache
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled'
  )
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function outputDir(): string {
  return interiorDir()
}

function isChapterHeadingLine(line: string, delimiter?: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (delimiter && trimmed === delimiter) return true
  if (/^chapter\s+\d+/i.test(trimmed)) return true
  if (/^chapter\s+[ivxlcdm]+\b/i.test(trimmed)) return true
  if (/^#\s+/.test(trimmed)) return true
  return false
}

export function detectChapters(text: string, delimiter?: string): Chapter[] {
  const lines = text.split(/\r?\n/)
  const chapters: Chapter[] = []
  let currentTitle: string | null = null
  let currentBody: string[] = []
  const preface: string[] = []

  const commit = (): void => {
    if (currentTitle !== null) {
      chapters.push({
        title: currentTitle,
        body: currentBody.join('\n').trim(),
        hasHeading: true
      })
    }
  }

  for (const line of lines) {
    if (isChapterHeadingLine(line, delimiter)) {
      commit()
      currentTitle = line.trim().replace(/^#\s+/, '')
      currentBody = []
    } else if (currentTitle !== null) {
      currentBody.push(line)
    } else {
      preface.push(line)
    }
  }
  commit()

  if (chapters.length === 0) {
    const joined = [...preface].join('\n').trim()
    if (joined) {
      // Synthetic single chapter — no drop cap because there was no heading.
      chapters.push({ title: 'Untitled', body: joined, hasHeading: false })
    }
  } else if (preface.join('').trim()) {
    chapters.unshift({
      title: 'Prologue',
      body: preface.join('\n').trim(),
      hasHeading: true
    })
  }

  return chapters
}

function looksLikeMarkdown(text: string): boolean {
  return /(^|\n)#\s+/.test(text) || /(^|\n)\*\s+/.test(text) || /\*\*[^*]+\*\*/.test(text)
}

/**
 * Strip inline editor-style draft annotations before text reaches the
 * renderer. Pattern: `[...text...]` where the bracketed body contains one
 * of these markers (case-insensitive): TODO, FIXME, NOTE, patched, seeds.
 * Bracketed text without one of those markers is preserved (could be a
 * real citation or bracketed phrase).
 */
export function cleanPreFormat(text: string): string {
  return text.replace(
    /\[[^\]]*?(?:TODO|FIXME|NOTE|patched|seeds)[^\]]*\]\s*/gi,
    ''
  )
}

/**
 * Render a chapter body into HTML.
 *
 * When `withDropCap` is true, the first non-whitespace alphanumeric character
 * of the first prose paragraph is wrapped in `<span class="drop-cap">` and
 * that paragraph carries a `chapter-opener` class for the column padding.
 * All other paragraphs render as plain `<p>` — no `::first-letter` tricks.
 */
function paragraphsToHtml(body: string, withDropCap = false): string {
  if (looksLikeMarkdown(body)) {
    const html = marked.parse(body, { async: false }) as string
    return withDropCap ? injectDropCapIntoMarkdown(html) : html
  }
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  let dropCapPending = withDropCap
  return paragraphs
    .map((p) => {
      if (/^[*\-—#]{1,5}$/.test(p)) {
        return `<div class="scene-break">${escapeHtml(p)}</div>`
      }
      const escaped = escapeHtml(p).replace(/\n/g, '<br/>')
      if (dropCapPending) {
        dropCapPending = false
        return wrapFirstCharAsDropCap(escaped)
      }
      return `<p>${escaped}</p>`
    })
    .join('\n')
}

/**
 * Take already-escaped paragraph inner HTML, return a `<p class="chapter-opener">`
 * with the first alphanumeric character wrapped in `<span class="drop-cap">`.
 * Any leading punctuation (opening quotes, brackets) stays outside the span
 * so the drop cap glyph is the actual first letter, not a quote.
 */
function wrapFirstCharAsDropCap(innerHtml: string): string {
  const match = innerHtml.match(/^(\s*[^\w<]*)(\w)([\s\S]*)$/)
  if (!match) return `<p class="chapter-opener">${innerHtml}</p>`
  const [, prefix, firstChar, rest] = match
  return `<p class="chapter-opener">${prefix}<span class="drop-cap">${firstChar}</span>${rest}</p>`
}

/**
 * Fallback for markdown-rendered output: find the first `<p>…` and drop-cap
 * the first letter of its content. marked escapes HTML, so we can safely
 * regex on the serialized output.
 */
function injectDropCapIntoMarkdown(html: string): string {
  return html.replace(
    /<p>(\s*[^\w<]*)(\w)([\s\S]*?)<\/p>/,
    (_, prefix, firstChar, rest) =>
      `<p class="chapter-opener">${prefix}<span class="drop-cap">${firstChar}</span>${rest}</p>`
  )
}

function renderChapterLabel(index: number): string {
  return `Chapter ${index + 1}`
}

function buildFrontMatter(config: FormatConfig, chapters: Chapter[]): string {
  const titleBlock = `
    <section class="title-page">
      <h1>${escapeHtml(config.title)}</h1>
      ${config.subtitle ? `<div class="subtitle">${escapeHtml(config.subtitle)}</div>` : ''}
      <div class="author">${escapeHtml(config.author)}</div>
    </section>
  `

  const copyrightBlock = `
    <section class="copyright-page">
      <p>Copyright © ${new Date().getFullYear()} ${escapeHtml(config.author)}</p>
      <p>All rights reserved.</p>
      <p>No part of this book may be reproduced in any form or by any<br/>
      electronic or mechanical means without written permission<br/>
      from the author, except for brief quotations in a review.</p>
    </section>
  `

  const dedicationBlock = config.dedication
    ? `<section class="dedication-page"><p>${escapeHtml(config.dedication)}</p></section>`
    : ''

  const tocItems = chapters
    .map((c, i) => `<li>${escapeHtml(c.title || renderChapterLabel(i))}</li>`)
    .join('')
  const tocBlock =
    chapters.length > 0
      ? `<section class="toc-page"><h2>Contents</h2><ol class="toc-list">${tocItems}</ol></section>`
      : ''

  return titleBlock + copyrightBlock + dedicationBlock + tocBlock
}

function buildChaptersHtml(chapters: Chapter[]): string {
  return chapters
    .map((chapter, i) => {
      const label = renderChapterLabel(i)
      // Only emit a visible chapter-heading block when we actually detected
      // a heading — the synthetic single-chapter fallback has no opener.
      const heading = chapter.hasHeading
        ? chapter.title && chapter.title.toLowerCase() !== label.toLowerCase()
          ? `<div class="chapter-heading"><span class="chapter-label">${escapeHtml(label)}</span>${escapeHtml(chapter.title)}</div>`
          : `<div class="chapter-heading">${escapeHtml(label)}</div>`
        : ''
      return `<section class="chapter">${heading}${paragraphsToHtml(chapter.body, chapter.hasHeading)}</section>`
    })
    .join('\n')
}

function renderInteriorHtml(config: FormatConfig, chapters: Chapter[]): string {
  const dims = TRIM_DIMENSIONS[config.trimSize]
  const template = loadTemplate()
  const bodyHtml = buildFrontMatter(config, chapters) + buildChaptersHtml(chapters)
  return template
    .replace(/{{TITLE}}/g, escapeHtml(config.title))
    .replace(/{{AUTHOR}}/g, escapeHtml(config.author))
    .replace(/{{SUBTITLE}}/g, escapeHtml(config.subtitle ?? ''))
    .replace(/{{PAGE_WIDTH_IN}}/g, String(dims.widthInches))
    .replace(/{{PAGE_HEIGHT_IN}}/g, String(dims.heightInches))
    .replace(/{{BODY_HTML}}/g, bodyHtml)
}

async function generatePdf(
  config: FormatConfig,
  chapters: Chapter[],
  outPath: string
): Promise<{ pageCount: number | null }> {
  const dims = TRIM_DIMENSIONS[config.trimSize]
  const html = renderInteriorHtml(config, chapters)

  let browser: import('puppeteer').Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to launch Puppeteer's bundled Chromium: ${msg}\n` +
        `If Chromium is missing, run: npx puppeteer browsers install chrome`
    )
  }

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const headerTemplate = `
      <style>
        .hdr { font-family: Georgia, serif; font-size: 8pt; color: #555;
               width: 100%; padding: 0 0.5in; text-align: center; }
      </style>
      <div class="hdr">${escapeHtml(config.title)} · ${escapeHtml(config.author)}</div>
    `
    const footerTemplate = `
      <style>
        .ftr { font-family: Georgia, serif; font-size: 9pt; color: #333;
               width: 100%; padding: 0 0.5in; text-align: center; }
      </style>
      <div class="ftr"><span class="pageNumber"></span></div>
    `
    await page.pdf({
      path: outPath,
      printBackground: true,
      width: `${dims.widthInches}in`,
      height: `${dims.heightInches}in`,
      margin: {
        top: '0.75in',
        right: '0.5in',
        bottom: '0.75in',
        left: '0.75in'
      },
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      preferCSSPageSize: false
    })

    // Rough page count by counting form-feed chunks or via metrics — puppeteer
    // doesn't return page count directly; leave null for now.
    return { pageCount: null }
  } finally {
    await browser.close()
  }
}

async function generateEpub(
  config: FormatConfig,
  chapters: Chapter[],
  outPath: string
): Promise<void> {
  const epubChapters = chapters.map((c, i) => ({
    title: c.title || renderChapterLabel(i),
    data: paragraphsToHtml(c.body)
  }))

  // html-to-epub writes scratch files to a `tempDir`; its default is relative
  // to the library's own module path, which lives inside the read-only
  // app.asar in packaged builds. Always hand it a writable dir under the OS
  // temp root, and clean up after the render.
  const tempDir = tempJobDir('epub')
  try {
    const epub = new EPub(
      {
        title: config.title,
        author: config.author,
        description: config.subtitle ?? config.title,
        content: epubChapters,
        tocTitle: 'Contents',
        appendChapterTitles: true,
        lang: 'en',
        tempDir
      },
      outPath
    )
    await epub.render()
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {
      /* non-fatal */
    })
  }
}

export async function formatManuscript(
  config: FormatConfig,
  options: FormatOptions = { pdf: true, epub: true }
): Promise<FormatResult> {
  if (!config.title.trim()) {
    throw new Error('Book title is required.')
  }
  if (!config.author.trim()) {
    throw new Error('Author name is required.')
  }
  if (!config.manuscriptText.trim()) {
    throw new Error('Manuscript text is empty.')
  }

  // Strip inline editor-style annotations (e.g. "[patched — seeds Lock-In]")
  // before anything downstream sees the text. Manuscript text the user
  // edits in the canvas is untouched; this pass is format-only.
  const cleanedText = cleanPreFormat(config.manuscriptText)

  const chapters = detectChapters(cleanedText, config.chapterDelimiter)
  const warnings: string[] = []

  if (chapters.length === 0) {
    warnings.push('No chapters detected; manuscript was formatted as one unit.')
    chapters.push({
      title: config.title,
      body: cleanedText,
      hasHeading: false
    })
  } else if (chapters.length === 1 && chapters[0].title === 'Untitled') {
    warnings.push(
      'No chapter headings detected (looked for "Chapter N", "Chapter IV", or "# Heading").'
    )
  }

  const dir = outputDir()

  const slug = slugify(config.title)
  const stamp = timestamp()
  const pdfPath = join(dir, `${slug}-${stamp}.pdf`)
  const epubPath = join(dir, `${slug}-${stamp}.epub`)

  let finalPdfPath: string | null = null
  let finalEpubPath: string | null = null
  let pageCount: number | null = null

  if (options.pdf !== false) {
    const result = await generatePdf(config, chapters, pdfPath)
    finalPdfPath = pdfPath
    pageCount = result.pageCount
  }

  if (options.epub !== false) {
    try {
      await generateEpub(config, chapters, epubPath)
      finalEpubPath = epubPath
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      warnings.push(`EPUB generation failed: ${msg}`)
    }
  }

  return {
    pdfPath: finalPdfPath,
    epubPath: finalEpubPath,
    chapterCount: chapters.length,
    pageCount,
    warnings
  }
}

export async function writeTemporaryForDebug(html: string): Promise<string> {
  const debugPath = join(outputDir(), `debug-${timestamp()}.html`)
  await writeFile(debugPath, html, 'utf-8')
  return debugPath
}
