import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

/**
 * In dev, `process.cwd()` is the project root so outputs land inside `output/`
 * (matching existing behavior). In a packaged app, the cwd can be anywhere
 * (often `/`), so we route user-visible artifacts to `~/Documents/Inkset/`
 * and private state to `~/Library/Application Support/Inkset/`.
 */

export function isPackaged(): boolean {
  return app.isPackaged
}

export function devRoot(): string {
  return process.cwd()
}

/** Folder for user-visible output: edited manuscripts, PDFs, covers. */
export function outputRoot(): string {
  const dir = isPackaged()
    ? join(app.getPath('documents'), 'Inkset')
    : join(devRoot(), 'output')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/** Folder for app-private state: SQLite DB, user env. */
export function userDataRoot(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/** Path to the user-level .env — same location the Settings modal writes to. */
export function userEnvPath(): string {
  return join(userDataRoot(), '.env')
}

/** Path candidates for the `prompts/` directory, in priority order. */
export function promptsPathCandidates(): string[] {
  return [
    join(process.resourcesPath ?? '', 'prompts'),
    join(devRoot(), 'prompts'),
    join(app.getAppPath(), 'prompts'),
    join(app.getAppPath(), '..', 'prompts')
  ]
}

/** Path candidates for `src/main/templates/` (interior + cover HTML). */
export function templatesPathCandidates(): string[] {
  return [
    join(process.resourcesPath ?? '', 'templates'),
    join(devRoot(), 'src', 'main', 'templates'),
    join(app.getAppPath(), 'src', 'main', 'templates'),
    join(__dirname, 'templates'),
    join(__dirname, '..', 'templates')
  ]
}

/** Subdir under outputRoot for the editing pipeline. */
export function editedDir(): string {
  return ensureSubdir('edited')
}

export function interiorDir(): string {
  return ensureSubdir('interior-pdfs')
}

export function coversDir(): string {
  return ensureSubdir('covers')
}

/** SQLite database file — private to the app. */
export function dbPath(): string {
  return isPackaged()
    ? join(userDataRoot(), 'inkset.db')
    : join(devRoot(), 'output', 'inkset.db')
}

/**
 * Scratch directory for a single job under the OS temp dir. html-to-epub
 * defaults to creating `./tempDir` inside its own module path, which sits
 * inside the read-only app.asar in packaged builds — this gives it a
 * writable alternative.
 */
export function tempJobDir(label: string): string {
  const dir = join(app.getPath('temp'), 'inkset', label, String(Date.now()))
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function ensureSubdir(name: string): string {
  const dir = join(outputRoot(), name)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}
