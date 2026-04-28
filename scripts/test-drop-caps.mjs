// One-shot drop-cap verification that exercises the REAL pipeline:
//   raw text → cleanPreFormat → detectChapters → paragraphsToHtml →
//   interior.html → Puppeteer → PDF.
//
// Produces two PDFs:
//   /tmp/inkset-nondrop.pdf  — user's Page 12 passage (no chapter markers).
//                              Expectation: ZERO drop caps anywhere.
//   /tmp/inkset-dropcap.pdf  — "Chapter 2: The Lock-In" followed by
//                              "Before you can change what you do…".
//                              Expectation: exactly ONE drop cap, on the B.
//
// Run with: node scripts/test-drop-caps.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const templatePath = join(
  __dirname,
  '..',
  'src',
  'main',
  'templates',
  'interior.html'
)
const template = readFileSync(templatePath, 'utf-8')

// ---- duplicated, on purpose, from kdpFormatService.ts so this script can
//      run outside Electron. Keep in sync; this is test-only infrastructure.

function escapeHtml(input) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cleanPreFormat(text) {
  return text.replace(
    /\[[^\]]*?(?:TODO|FIXME|NOTE|patched|seeds)[^\]]*\]\s*/gi,
    ''
  )
}

function isChapterHeadingLine(t, delimiter) {
  const s = t.trim()
  if (!s) return false
  if (delimiter && s === delimiter) return true
  if (/^chapter\s+\d+/i.test(s)) return true
  if (/^chapter\s+[ivxlcdm]+\b/i.test(s)) return true
  if (/^#\s+/.test(s)) return true
  return false
}

function detectChapters(text) {
  const refs = []
  const lines = text.split(/\r?\n/)
  let currentTitle = null
  let currentBody = []
  const preface = []
  const commit = () => {
    if (currentTitle !== null) {
      refs.push({
        title: currentTitle,
        body: currentBody.join('\n').trim(),
        hasHeading: true
      })
    }
  }
  for (const line of lines) {
    if (isChapterHeadingLine(line)) {
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
  if (refs.length === 0) {
    const joined = preface.join('\n').trim()
    if (joined) refs.push({ title: 'Untitled', body: joined, hasHeading: false })
  } else if (preface.join('').trim()) {
    refs.unshift({
      title: 'Prologue',
      body: preface.join('\n').trim(),
      hasHeading: true
    })
  }
  return refs
}

function wrapFirstCharAsDropCap(innerHtml) {
  const match = innerHtml.match(/^(\s*[^\w<]*)(\w)([\s\S]*)$/)
  if (!match) return `<p class="chapter-opener">${innerHtml}</p>`
  const [, prefix, firstChar, rest] = match
  return `<p class="chapter-opener">${prefix}<span class="drop-cap">${firstChar}</span>${rest}</p>`
}

function paragraphsToHtml(body, withDropCap = false) {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  let pending = withDropCap
  return paragraphs
    .map((p) => {
      if (/^[*\-—#]{1,5}$/.test(p)) {
        return `<div class="scene-break">${escapeHtml(p)}</div>`
      }
      const esc = escapeHtml(p).replace(/\n/g, '<br/>')
      if (pending) {
        pending = false
        return wrapFirstCharAsDropCap(esc)
      }
      return `<p>${esc}</p>`
    })
    .join('\n')
}

function fill(tpl, vars) {
  return tpl
    .replace(/{{TITLE}}/g, vars.title)
    .replace(/{{AUTHOR}}/g, vars.author)
    .replace(/{{SUBTITLE}}/g, '')
    .replace(/{{PAGE_WIDTH_IN}}/g, String(vars.widthIn))
    .replace(/{{PAGE_HEIGHT_IN}}/g, String(vars.heightIn))
    .replace(/{{BODY_HTML}}/g, vars.bodyHtml)
}

function buildFullBody(rawText) {
  const cleaned = cleanPreFormat(rawText)
  const chapters = detectChapters(cleaned)
  if (chapters.length === 0) {
    return `<section class="chapter"><p>${escapeHtml(cleaned)}</p></section>`
  }
  return chapters
    .map((ch) => {
      const heading = ch.hasHeading
        ? `<div class="chapter-heading">${escapeHtml(ch.title)}</div>`
        : ''
      return `<section class="chapter">${heading}${paragraphsToHtml(ch.body, ch.hasHeading)}</section>`
    })
    .join('\n')
}

async function render(outPath, title, rawText) {
  const html = fill(template, {
    title,
    author: 'Inkset QA',
    widthIn: 6,
    heightIn: 9,
    bodyHtml: buildFullBody(rawText)
  })
  writeFileSync(outPath.replace(/\.pdf$/, '.html'), html, 'utf-8')
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 576, height: 864, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: outPath,
      width: '6in',
      height: '9in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    })
  } finally {
    await browser.close()
  }
  return outPath
}

// ---- Test fixtures (verbatim from the spec) ---------------------------

const NO_CHAPTER = `EXERCISE: THE SYSTEM AUDIT
Ten minutes. Do this before you turn the page.

Most people get 12 to 15 Ns out of a possible 15.

Look at your number.

That's not a character flaw.

That's a system gap.`

const WITH_CHAPTER = `Chapter 2: The Lock-In

Before you can change what you do, you have to see what you've been doing. [patched — seeds Lock-In] Most of us coast on a loop that was set years ago, and we never notice how tight it's gotten.

Break the loop and the rest follows. Stay in the loop and nothing moves. That's the whole chapter in two sentences, and the rest is proof.`

async function main() {
  const a = await render(
    '/tmp/inkset-nondrop.pdf',
    'No-Chapter Passage',
    NO_CHAPTER
  )
  const b = await render(
    '/tmp/inkset-dropcap.pdf',
    'Chapter Opener Passage',
    WITH_CHAPTER
  )
  console.log(`✔ No-drop-cap PDF: ${a}`)
  console.log(`✔ Single-drop-cap PDF: ${b}`)

  // Sanity: count only real drop-cap spans in the body, not the CSS comment.
  const stripStyle = (s) => s.replace(/<style[\s\S]*?<\/style>/gi, '')
  const noDropHtml = stripStyle(readFileSync('/tmp/inkset-nondrop.html', 'utf-8'))
  const dropHtml = stripStyle(readFileSync('/tmp/inkset-dropcap.html', 'utf-8'))
  const noDropCount = (noDropHtml.match(/class="drop-cap"/g) || []).length
  const dropCount = (dropHtml.match(/class="drop-cap"/g) || []).length
  const annotationLeak = /\[patched/.test(dropHtml)
  console.log(
    `   no-chapter file: ${noDropCount} drop-cap span(s) (want 0)`
  )
  console.log(`   chapter file:    ${dropCount} drop-cap span(s) (want 1)`)
  console.log(
    `   "[patched …]" annotation present in output: ${annotationLeak} (want false)`
  )
  if (noDropCount !== 0 || dropCount !== 1 || annotationLeak) {
    console.error('✖ invariants violated')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
