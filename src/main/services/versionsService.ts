import { gzipSync, gunzipSync } from 'zlib'
import Database from 'better-sqlite3'
import type { Database as SqliteDb } from 'better-sqlite3'
import { dbPath as resolveDbPath } from '../util/paths'

export type VersionTrigger =
  | 'manual'
  | 'edit-pass'
  | 'cover-generated'
  | 'blurb-saved'
  | 'format-run'
  | 'import'

export type VersionRow = {
  id: number
  projectId: string
  timestamp: number
  trigger: VersionTrigger
  metadata: Record<string, unknown>
  userNote: string | null
  bytes: number
}

export type VersionWithContent = VersionRow & {
  manuscriptText: string
}

export type CreateVersionInput = {
  projectId: string
  trigger: VersionTrigger
  manuscriptText: string
  metadata?: Record<string, unknown>
  userNote?: string | null
}

let cached: SqliteDb | null = null

function getDb(): SqliteDb {
  if (cached) return cached
  const db = new Database(resolveDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      trigger TEXT NOT NULL,
      content BLOB NOT NULL,
      bytes INTEGER NOT NULL,
      metadata TEXT,
      user_note TEXT
    );
    CREATE INDEX IF NOT EXISTS versions_project_time
      ON versions(project_id, timestamp DESC);
  `)
  cached = db
  return db
}

function rowToVersion(row: Record<string, unknown>): VersionRow {
  return {
    id: row.id as number,
    projectId: row.project_id as string,
    timestamp: row.timestamp as number,
    trigger: row.trigger as VersionTrigger,
    metadata: row.metadata
      ? (JSON.parse(row.metadata as string) as Record<string, unknown>)
      : {},
    userNote: (row.user_note as string | null) ?? null,
    bytes: row.bytes as number
  }
}

export function createVersion(input: CreateVersionInput): VersionRow {
  const db = getDb()
  const compressed = gzipSync(Buffer.from(input.manuscriptText, 'utf-8'))
  const ts = Date.now()
  const meta = input.metadata ? JSON.stringify(input.metadata) : null
  const note = input.userNote ?? null
  const stmt = db.prepare(
    `INSERT INTO versions (project_id, timestamp, trigger, content, bytes, metadata, user_note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const info = stmt.run(
    input.projectId,
    ts,
    input.trigger,
    compressed,
    compressed.length,
    meta,
    note
  )
  return {
    id: Number(info.lastInsertRowid),
    projectId: input.projectId,
    timestamp: ts,
    trigger: input.trigger,
    metadata: input.metadata ?? {},
    userNote: note,
    bytes: compressed.length
  }
}

export function listVersions(projectId: string, limit = 200): VersionRow[] {
  const db = getDb()
  const stmt = db.prepare(
    `SELECT id, project_id, timestamp, trigger, bytes, metadata, user_note
     FROM versions
     WHERE project_id = ?
     ORDER BY timestamp DESC
     LIMIT ?`
  )
  const rows = stmt.all(projectId, limit) as Record<string, unknown>[]
  return rows.map(rowToVersion)
}

export function getVersion(id: number): VersionWithContent | null {
  const db = getDb()
  const stmt = db.prepare(
    `SELECT id, project_id, timestamp, trigger, content, bytes, metadata, user_note
     FROM versions
     WHERE id = ?`
  )
  const row = stmt.get(id) as Record<string, unknown> | undefined
  if (!row) return null
  const buf = row.content as Buffer
  const decompressed = gunzipSync(buf).toString('utf-8')
  return {
    ...rowToVersion(row),
    manuscriptText: decompressed
  }
}

export function deleteVersion(id: number): void {
  const db = getDb()
  db.prepare('DELETE FROM versions WHERE id = ?').run(id)
}

export function pruneOld(projectId: string, keep = 200): number {
  const db = getDb()
  const stmt = db.prepare(
    `DELETE FROM versions WHERE project_id = ? AND id NOT IN (
      SELECT id FROM versions WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?
    )`
  )
  const info = stmt.run(projectId, projectId, keep)
  return Number(info.changes)
}
