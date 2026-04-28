import { readFileSync, existsSync } from 'fs'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import sharp from 'sharp'
import puppeteer, { Browser } from 'puppeteer'
import { coversDir, templatesPathCandidates } from '../util/paths'

const CONCEPT_MODEL = 'claude-sonnet-4-6'
const DALLE_MODEL = 'dall-e-3'
const DALLE_SIZE = '1024x1792' as const

export type PaperColor = 'white' | 'cream'

export type Trim = { widthIn: number; heightIn: number }

export type CoverInput = {
  title: string
  subtitle?: string
  author: string
  genre?: string // Required only for AI-generated covers.
  mood?: string // Required only for AI-generated covers.
  trim: Trim
  pageCount: number
  paperColor: PaperColor
  blurb?: string
  authorBio?: string
}

export type CoverProgress =
  | { step: 'concept'; message: string }
  | { step: 'art'; message: string; artDataUrl?: string }
  | { step: 'front'; message: string }
  | { step: 'back'; message: string }
  | { step: 'spine'; message: string }
  | { step: 'wrap'; message: string }
  | { step: 'done'; message: string }

export type RGB = { r: number; g: number; b: number }

export type CoverResult = {
  slug: string
  timestamp: string
  prompts: string[]
  chosenPromptIndex: number
  artPath: string
  frontPngPath: string
  backPngPath: string
  spinePngPath: string
  wrapPdfPath: string
  frontPdfPath: string
  thumbnails: {
    art: string
    front: string
    back: string
    spine: string
  }
  dimensions: {
    trim: Trim
    spine: { widthIn: number }
    wrap: { widthIn: number; heightIn: number; widthPx: number; heightPx: number }
  }
  dominantColor: RGB
  warnings: string[]
}

function assertAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  if (!key) throw new Error('ANTHROPIC_API_KEY is missing. Add it to .env.')
  if (!key.startsWith('sk-ant-')) {
    throw new Error('ANTHROPIC_API_KEY appears malformed (expected sk-ant-…).')
  }
  return key
}

function assertOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) throw new Error('OPENAI_API_KEY is missing. Add it to .env.')
  if (!key.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY appears malformed (expected sk-… prefix).')
  }
  return key
}

function resolveTemplatesDir(): string {
  const candidates = templatesPathCandidates()
  for (const c of candidates) if (c && existsSync(c)) return c
  throw new Error(`Could not locate templates dir. Looked in: ${candidates.join(', ')}`)
}

const templateCache: Record<string, string> = {}
function loadTemplate(name: string): string {
  if (templateCache[name]) return templateCache[name]
  const path = join(resolveTemplatesDir(), name)
  if (!existsSync(path)) throw new Error(`Missing template: ${path}`)
  templateCache[name] = readFileSync(path, 'utf-8')
  return templateCache[name]
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

async function ensureOutputDir(): Promise<string> {
  return coversDir()
}

export function calculateSpineWidth(pageCount: number, paperColor: PaperColor): number {
  const perPage = paperColor === 'white' ? 0.002252 : 0.0025
  return Number((pageCount * perPage).toFixed(4))
}

export function calculateWrapDimensions(trim: Trim, spineWidthIn: number) {
  const widthIn = Number((2 * trim.widthIn + spineWidthIn + 0.25).toFixed(4))
  const heightIn = Number((trim.heightIn + 0.25).toFixed(4))
  return {
    widthIn,
    heightIn,
    widthPx: Math.round(widthIn * 300),
    heightPx: Math.round(heightIn * 300)
  }
}

// ---- Step 1: Prompt candidates via Claude ----

function parsePromptsFromClaude(text: string): string[] {
  const stripped = text
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  const raw = match ? match[0] : stripped
  try {
    const parsed = JSON.parse(raw) as { prompts?: unknown }
    if (Array.isArray(parsed.prompts)) {
      const prompts = parsed.prompts
        .filter((p): p is string => typeof p === 'string')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
      if (prompts.length >= 1) return prompts.slice(0, 3)
    }
  } catch {
    /* fall through */
  }
  // Fallback: split on numbered list
  const lines = stripped
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|-)\s*/, '').trim())
    .filter((l) => l.length > 20)
  return lines.slice(0, 3)
}

async function generatePromptCandidates(input: CoverInput): Promise<string[]> {
  if (!input.genre?.trim() || !input.mood?.trim()) {
    throw new Error('Genre and mood are required to generate AI cover art.')
  }
  const client = new Anthropic({ apiKey: assertAnthropicKey() })
  const userMsg = `You are designing a book cover. Produce 3 distinct DALL-E 3 prompts that describe only the IMAGE — no text, no typography, no logos, no watermarks, no symbols that spell words. The cover typography (title, author) will be overlaid afterward, so the composition should leave natural quiet space (often lower third) where text can live.

Book: ${input.title}${input.subtitle ? ` — ${input.subtitle}` : ''}
Author: ${input.author}
Genre: ${input.genre}
Mood: ${input.mood}

For each prompt:
- 2–4 vivid sentences
- Describe subject, composition, palette, lighting, and any texture or medium (photograph, oil painting, etc.)
- Appropriate for a professional book cover (avoid cliché stock-art framing)
- End with: "No text, no logos, no watermarks. Cinematic lighting. Book cover composition."

Make the 3 prompts distinct from each other in approach (e.g. photographic vs illustrated vs symbolic).

Return a strict JSON object with no preamble and no code fences, shape: {"prompts":["…","…","…"]}`

  const resp = await client.messages.create({
    model: CONCEPT_MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: userMsg }]
  })
  const text = resp.content
    .filter((c): c is Anthropic.Messages.TextBlock => c.type === 'text')
    .map((c) => c.text)
    .join('\n')
  const prompts = parsePromptsFromClaude(text)
  if (prompts.length === 0) {
    throw new Error('Claude returned no usable prompt candidates.')
  }
  return prompts
}

// ---- Step 2: DALL-E 3 image generation ----

function isContentPolicyError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes('content_policy') ||
    msg.includes('content policy') ||
    msg.includes('safety system') ||
    msg.includes('rejected')
  )
}

async function downloadToBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Image download failed: ${resp.status} ${resp.statusText}`)
  const arr = await resp.arrayBuffer()
  return Buffer.from(arr)
}

async function generateDalleImage(
  prompts: string[],
  startIndex: number
): Promise<{ buffer: Buffer; promptIndex: number; rejectedIndices: number[] }> {
  const client = new OpenAI({ apiKey: assertOpenAiKey() })
  const rejected: number[] = []
  for (let i = startIndex; i < prompts.length; i++) {
    try {
      const resp = await client.images.generate({
        model: DALLE_MODEL,
        prompt: prompts[i],
        size: DALLE_SIZE,
        quality: 'standard',
        n: 1,
        response_format: 'url'
      })
      const url = resp.data?.[0]?.url
      if (!url) throw new Error('DALL-E returned no image URL.')
      const buffer = await downloadToBuffer(url)
      return { buffer, promptIndex: i, rejectedIndices: rejected }
    } catch (err) {
      if (isContentPolicyError(err)) {
        rejected.push(i)
        continue
      }
      throw err
    }
  }
  throw new Error(
    `All ${prompts.length - startIndex} candidate prompts were rejected by DALL-E's content policy. Try a different mood or genre.`
  )
}

// ---- Step 3: Dominant color via sharp ----

async function sampleDominantColor(imagePath: string): Promise<RGB> {
  const { dominant } = await sharp(imagePath).stats()
  return { r: dominant.r, g: dominant.g, b: dominant.b }
}

function pickContrastingText(bg: RGB): string {
  // Standard luminance formula for WCAG.
  const lum = (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255
  return lum > 0.55 ? '#1a1a1a' : '#ffffff'
}

// ---- Step 5-7: Panel PNG rendering via Puppeteer ----

async function launchBrowser(): Promise<Browser> {
  try {
    return await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to launch Puppeteer's bundled Chromium: ${msg}\n` +
        `If Chromium is missing, run: npx puppeteer browsers install chrome`
    )
  }
}

async function renderHtmlToPng(
  browser: Browser,
  html: string,
  widthIn: number,
  heightIn: number,
  outPath: string
): Promise<void> {
  const page = await browser.newPage()
  try {
    const widthPx = Math.round(widthIn * 96)
    const heightPx = Math.round(heightIn * 96)
    await page.setViewport({
      width: widthPx,
      height: heightPx,
      deviceScaleFactor: 300 / 96
    })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.screenshot({ path: outPath as `${string}.png`, type: 'png', fullPage: false })
  } finally {
    await page.close()
  }
}

async function renderHtmlToPdf(
  browser: Browser,
  html: string,
  widthIn: number,
  heightIn: number,
  outPath: string
): Promise<void> {
  const page = await browser.newPage()
  try {
    await page.setViewport({
      width: Math.round(widthIn * 96),
      height: Math.round(heightIn * 96),
      deviceScaleFactor: 1
    })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: outPath,
      width: `${widthIn}in`,
      height: `${heightIn}in`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false
    })
  } finally {
    await page.close()
  }
}

function renderFrontHtml(input: CoverInput, artDataUrl: string): string {
  const subtitleBlock = input.subtitle
    ? `<div class="subtitle">${escapeHtml(input.subtitle)}</div>`
    : ''
  return loadTemplate('frontCover.html')
    .replace(/{{TRIM_W}}/g, String(input.trim.widthIn))
    .replace(/{{TRIM_H}}/g, String(input.trim.heightIn))
    .replace(/{{ART_DATA_URL}}/g, artDataUrl)
    .replace(/{{AUTHOR}}/g, escapeHtml(input.author))
    .replace(/{{TITLE}}/g, escapeHtml(input.title))
    .replace(/{{SUBTITLE_BLOCK}}/g, subtitleBlock)
}

function blurbToHtml(blurb?: string): string {
  if (!blurb || !blurb.trim()) {
    return '<div class="placeholder">[ Back cover copy will appear here. ]</div>'
  }
  return blurb
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join('')
}

function bioToHtml(bio?: string): string {
  if (!bio || !bio.trim()) return ''
  return `<div class="bio-label">About the Author</div><div>${escapeHtml(bio.trim())}</div>`
}

function renderBackHtml(input: CoverInput, bg: RGB, textColor: string): string {
  return loadTemplate('backCover.html')
    .replace(/{{TRIM_W}}/g, String(input.trim.widthIn))
    .replace(/{{TRIM_H}}/g, String(input.trim.heightIn))
    .replace(/{{BG_R}}/g, String(bg.r))
    .replace(/{{BG_G}}/g, String(bg.g))
    .replace(/{{BG_B}}/g, String(bg.b))
    .replace(/{{TEXT_COLOR}}/g, textColor)
    .replace(/{{BLURB_HTML}}/g, blurbToHtml(input.blurb))
    .replace(/{{BIO_HTML}}/g, bioToHtml(input.authorBio))
}

function renderSpineHtml(
  input: CoverInput,
  spineWidthIn: number,
  bg: RGB,
  textColor: string,
  showText: boolean
): string {
  return loadTemplate('spine.html')
    .replace(/{{SPINE_W}}/g, String(spineWidthIn))
    .replace(/{{SPINE_H}}/g, String(input.trim.heightIn))
    .replace(/{{BG_R}}/g, String(bg.r))
    .replace(/{{BG_G}}/g, String(bg.g))
    .replace(/{{BG_B}}/g, String(bg.b))
    .replace(/{{TEXT_COLOR}}/g, textColor)
    .replace(/{{TITLE}}/g, escapeHtml(input.title))
    .replace(/{{AUTHOR}}/g, escapeHtml(input.author))
    .replace(/{{SHOW_TEXT}}/g, showText ? 'inline-block' : 'none')
}

function renderWrapHtml(
  input: CoverInput,
  spineWidthIn: number,
  wrap: { widthIn: number; heightIn: number },
  bg: RGB,
  backDataUrl: string,
  spineDataUrl: string,
  frontDataUrl: string
): string {
  return loadTemplate('wrap.html')
    .replace(/{{WRAP_W}}/g, String(wrap.widthIn))
    .replace(/{{WRAP_H}}/g, String(wrap.heightIn))
    .replace(/{{TRIM_W}}/g, String(input.trim.widthIn))
    .replace(/{{SPINE_W}}/g, String(spineWidthIn))
    .replace(/{{BG_R}}/g, String(bg.r))
    .replace(/{{BG_G}}/g, String(bg.g))
    .replace(/{{BG_B}}/g, String(bg.b))
    .replace(/{{BACK_DATA_URL}}/g, backDataUrl)
    .replace(/{{SPINE_DATA_URL}}/g, spineDataUrl)
    .replace(/{{FRONT_DATA_URL}}/g, frontDataUrl)
}

async function fileToDataUrl(path: string, mime = 'image/png'): Promise<string> {
  const buf = await readFile(path)
  return `data:${mime};base64,${buf.toString('base64')}`
}

async function fileToThumbnailDataUrl(
  path: string,
  maxWidth = 400
): Promise<string> {
  const buf = await sharp(path).resize({ width: maxWidth, withoutEnlargement: true }).png().toBuffer()
  return `data:image/png;base64,${buf.toString('base64')}`
}

// ---- Orchestration ----

async function normalizeArtToPng(buffer: Buffer): Promise<Buffer> {
  // Ensure art is PNG regardless of source format so downstream code is uniform.
  return sharp(buffer).png().toBuffer()
}

async function composeFromArtBuffer(
  input: CoverInput,
  artBuffer: Buffer,
  prompts: string[],
  chosenPromptIndex: number,
  initialWarnings: string[],
  onProgress: (p: CoverProgress) => void
): Promise<CoverResult> {
  const warnings = [...initialWarnings]
  const slug = slugify(input.title)
  const stamp = timestamp()
  const dir = await ensureOutputDir()
  const paths = {
    art: join(dir, `${slug}-${stamp}-art.png`),
    front: join(dir, `${slug}-${stamp}-front.png`),
    back: join(dir, `${slug}-${stamp}-back.png`),
    spine: join(dir, `${slug}-${stamp}-spine.png`),
    wrap: join(dir, `${slug}-${stamp}-wrap.pdf`),
    frontPdf: join(dir, `${slug}-${stamp}-front.pdf`)
  }

  const pngBuffer = await normalizeArtToPng(artBuffer)
  await writeFile(paths.art, pngBuffer)

  const artDataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`
  onProgress({ step: 'art', message: 'Cover art ready.', artDataUrl })

  // Aspect-ratio sanity check
  try {
    const meta = await sharp(pngBuffer).metadata()
    if (meta.width && meta.height) {
      const artRatio = meta.width / meta.height
      const trimRatio = input.trim.widthIn / input.trim.heightIn
      const ratioDelta = Math.abs(artRatio - trimRatio) / trimRatio
      if (ratioDelta > 0.1) {
        warnings.push(
          `Art aspect ratio (${artRatio.toFixed(3)}) differs from trim ratio (${trimRatio.toFixed(3)}) by ${(ratioDelta * 100).toFixed(0)}%; the front cover will crop via object-fit: cover.`
        )
      }
    }
  } catch {
    /* non-fatal */
  }

  // Dimensions
  const spineWidthIn = calculateSpineWidth(input.pageCount, input.paperColor)
  const wrap = calculateWrapDimensions(input.trim, spineWidthIn)

  if (input.pageCount < 79) {
    warnings.push(
      `Page count ${input.pageCount} is below KDP's 79-page minimum for spine text; spine will render as a blank color bar.`
    )
  }

  // Step 3/4: dominant color
  const dominant = await sampleDominantColor(paths.art)
  const textColor = pickContrastingText(dominant)

  // Step 5: front
  onProgress({ step: 'front', message: 'Composing front cover…' })
  const browser = await launchBrowser()
  try {
    const frontHtml = renderFrontHtml(input, artDataUrl)
    await renderHtmlToPng(
      browser,
      frontHtml,
      input.trim.widthIn,
      input.trim.heightIn,
      paths.front
    )

    // Step 7: back
    onProgress({ step: 'back', message: 'Composing back cover…' })
    const backHtml = renderBackHtml(input, dominant, textColor)
    await renderHtmlToPng(
      browser,
      backHtml,
      input.trim.widthIn,
      input.trim.heightIn,
      paths.back
    )

    // Step 6: spine
    onProgress({ step: 'spine', message: 'Composing spine…' })
    const showSpineText = input.pageCount >= 79
    const spineHtml = renderSpineHtml(
      input,
      spineWidthIn,
      dominant,
      textColor,
      showSpineText
    )
    await renderHtmlToPng(
      browser,
      spineHtml,
      Math.max(spineWidthIn, 0.1),
      input.trim.heightIn,
      paths.spine
    )

    // Step 8: wrap + front-only PDFs
    onProgress({ step: 'wrap', message: 'Assembling wrap…' })
    const [backDataUrl, spineDataUrl, frontDataUrl] = await Promise.all([
      fileToDataUrl(paths.back),
      fileToDataUrl(paths.spine),
      fileToDataUrl(paths.front)
    ])
    const wrapHtml = renderWrapHtml(
      input,
      spineWidthIn,
      wrap,
      dominant,
      backDataUrl,
      spineDataUrl,
      frontDataUrl
    )
    await renderHtmlToPdf(browser, wrapHtml, wrap.widthIn, wrap.heightIn, paths.wrap)

    // Front-only PDF (at trim size, no bleed)
    await renderHtmlToPdf(
      browser,
      renderFrontHtml(input, artDataUrl),
      input.trim.widthIn,
      input.trim.heightIn,
      paths.frontPdf
    )
  } finally {
    await browser.close()
  }

  const [artThumb, frontThumb, backThumb, spineThumb] = await Promise.all([
    fileToThumbnailDataUrl(paths.art),
    fileToThumbnailDataUrl(paths.front),
    fileToThumbnailDataUrl(paths.back),
    fileToThumbnailDataUrl(paths.spine, 200)
  ])

  onProgress({ step: 'done', message: 'Cover package ready.' })

  return {
    slug,
    timestamp: stamp,
    prompts,
    chosenPromptIndex,
    artPath: paths.art,
    frontPngPath: paths.front,
    backPngPath: paths.back,
    spinePngPath: paths.spine,
    wrapPdfPath: paths.wrap,
    frontPdfPath: paths.frontPdf,
    thumbnails: {
      art: artThumb,
      front: frontThumb,
      back: backThumb,
      spine: spineThumb
    },
    dimensions: {
      trim: input.trim,
      spine: { widthIn: spineWidthIn },
      wrap
    },
    dominantColor: dominant,
    warnings
  }
}

function validateBaseInput(input: CoverInput): void {
  if (!input.title?.trim()) throw new Error('Title is required.')
  if (!input.author?.trim()) throw new Error('Author is required.')
  if (!input.trim || input.trim.widthIn <= 0 || input.trim.heightIn <= 0) {
    throw new Error('Trim size must be positive.')
  }
  if (!Number.isFinite(input.pageCount) || input.pageCount < 1) {
    throw new Error('Page count must be a positive integer.')
  }
}

function validateAiInput(input: CoverInput): void {
  validateBaseInput(input)
  if (!input.genre?.trim()) throw new Error('Genre is required for AI-generated covers.')
  if (!input.mood?.trim()) throw new Error('Mood is required for AI-generated covers.')
}

async function runAiPipeline(
  input: CoverInput,
  prompts: string[],
  startPromptIndex: number,
  onProgress: (p: CoverProgress) => void
): Promise<CoverResult> {
  onProgress({ step: 'art', message: 'Creating cover art with DALL-E 3…' })
  const art = await generateDalleImage(prompts, startPromptIndex)
  const warnings: string[] = art.rejectedIndices.map(
    (rejIdx) =>
      `Prompt candidate #${rejIdx + 1} was rejected by DALL-E's content policy; fell back to #${art.promptIndex + 1}.`
  )
  return composeFromArtBuffer(
    input,
    art.buffer,
    prompts,
    art.promptIndex,
    warnings,
    onProgress
  )
}

export async function generateCover(
  input: CoverInput,
  onProgress: (p: CoverProgress) => void
): Promise<CoverResult> {
  validateAiInput(input)
  onProgress({ step: 'concept', message: 'Generating concept prompts with Claude…' })
  const prompts = await generatePromptCandidates(input)
  return runAiPipeline(input, prompts, 0, onProgress)
}

export async function regenerateCoverArt(
  input: CoverInput,
  prompts: string[],
  chosenPromptIndex: number,
  onProgress: (p: CoverProgress) => void
): Promise<CoverResult> {
  validateAiInput(input)
  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error('No existing prompt candidates supplied for re-roll.')
  }
  const safeIndex = Math.max(0, Math.min(chosenPromptIndex, prompts.length - 1))
  return runAiPipeline(input, prompts, safeIndex, onProgress)
}

/** Skip Claude + DALL-E; user supplies their own cover art. */
export async function generateCoverFromUpload(
  input: CoverInput,
  artBuffer: Buffer,
  onProgress: (p: CoverProgress) => void
): Promise<CoverResult> {
  validateBaseInput(input)
  if (!artBuffer || artBuffer.length === 0) {
    throw new Error('Uploaded cover art is empty.')
  }
  onProgress({ step: 'art', message: 'Reading uploaded cover art…' })
  return composeFromArtBuffer(input, artBuffer, [], -1, [], onProgress)
}
