// Env-loading + settings-persistence for Inkset.
//
// Search order for `.env`:
//   1. `~/Library/Application Support/Inkset/.env` (user-level — writable, the
//      Settings modal writes here).
//   2. existing `process.env` (already populated by the shell).
//   3. bundled `.env` next to `process.cwd()` (dev only, never shipped).

import { existsSync, readFileSync, writeFileSync, chmodSync } from 'fs'
import { join } from 'path'
import { userEnvPath, devRoot, isPackaged } from '../util/paths'

const MANAGED_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY'
] as const
type ManagedKey = (typeof MANAGED_KEYS)[number]

function parseEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx < 0) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}

function applyToProcessEnv(map: Record<string, string>): void {
  for (const key of Object.keys(map)) {
    // Don't overwrite if already set (shell takes precedence over bundled).
    if (!process.env[key]) process.env[key] = map[key]
  }
}

function loadFromPath(path: string): Record<string, string> {
  if (!existsSync(path)) return {}
  try {
    return parseEnvFile(readFileSync(path, 'utf-8'))
  } catch {
    return {}
  }
}

/** Load in priority order: user env → shell env → bundled dev env. */
export function loadAllEnv(): void {
  // 1. User-level env (highest priority among files).
  const userMap = loadFromPath(userEnvPath())
  // Overwrite process.env with user-file values so the user-entered key wins
  // over whatever the dev shell happened to export.
  for (const key of Object.keys(userMap)) {
    process.env[key] = userMap[key]
  }

  // 2. Bundled/dev .env (only fills gaps).
  if (!isPackaged()) {
    const devPath = join(devRoot(), '.env')
    applyToProcessEnv(loadFromPath(devPath))
  }
}

export type MaskedKeys = {
  anthropic: { present: boolean; masked: string | null }
  openai: { present: boolean; masked: string | null }
  openrouter: { present: boolean; masked: string | null }
  envPath: string
}

function mask(value: string | undefined): string | null {
  if (!value) return null
  if (value.length < 12) return value.slice(0, 2) + '••••'
  let prefix: string
  if (value.startsWith('sk-or-v1-')) prefix = 'sk-or-v1-'
  else if (value.startsWith('sk-or-')) prefix = 'sk-or-'
  else if (value.startsWith('sk-ant-')) prefix = 'sk-ant-'
  else if (value.startsWith('sk-')) prefix = 'sk-'
  else prefix = value.slice(0, 3)
  const suffix = value.slice(-4)
  return `${prefix}••••${suffix}`
}

export function readMaskedKeys(): MaskedKeys {
  return {
    anthropic: {
      present: !!process.env.ANTHROPIC_API_KEY,
      masked: mask(process.env.ANTHROPIC_API_KEY)
    },
    openai: {
      present: !!process.env.OPENAI_API_KEY,
      masked: mask(process.env.OPENAI_API_KEY)
    },
    openrouter: {
      present: !!process.env.OPENROUTER_API_KEY,
      masked: mask(process.env.OPENROUTER_API_KEY)
    },
    envPath: userEnvPath()
  }
}

/**
 * Merge user-supplied keys into `~/Library/Application Support/Inkset/.env`
 * (preserving any other lines already there) and push them into `process.env`
 * so already-loaded services pick them up on their next call.
 *
 * Passing an empty string clears a key. Passing `undefined` leaves it alone.
 */
export function writeUserKeys(input: Partial<Record<ManagedKey, string>>): MaskedKeys {
  const path = userEnvPath()
  const existing = loadFromPath(path)

  for (const key of MANAGED_KEYS) {
    if (input[key] === undefined) continue
    const value = input[key] ?? ''
    if (value) existing[key] = value
    else delete existing[key]
  }

  const body =
    '# Inkset user-level API keys. Edit via the in-app Settings modal.\n' +
    Object.entries(existing)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') +
    '\n'
  writeFileSync(path, body, 'utf-8')
  try {
    // 0600 — owner read/write only. Keys are sensitive.
    chmodSync(path, 0o600)
  } catch {
    /* non-fatal on filesystems that don't honor unix modes */
  }

  // Push updates into the current process too.
  for (const key of MANAGED_KEYS) {
    if (input[key] !== undefined) {
      if (input[key]) process.env[key] = input[key]
      else delete process.env[key]
    }
  }

  return readMaskedKeys()
}
