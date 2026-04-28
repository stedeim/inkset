// Renderer-side typed wrappers around window.api.versions.
// Mirrors src/main/services/versionsService.ts.

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

type Bridge = {
  create: (input: CreateVersionInput) => Promise<VersionRow>
  list: (projectId: string, limit?: number) => Promise<VersionRow[]>
  get: (id: number) => Promise<VersionWithContent | null>
  delete: (id: number) => Promise<void>
}

function bridge(): Bridge {
  return window.api.versions as unknown as Bridge
}

export function createVersion(input: CreateVersionInput): Promise<VersionRow> {
  return bridge().create(input)
}

export function listVersions(
  projectId: string,
  limit?: number
): Promise<VersionRow[]> {
  return bridge().list(projectId, limit)
}

export function getVersion(id: number): Promise<VersionWithContent | null> {
  return bridge().get(id)
}

export function deleteVersion(id: number): Promise<void> {
  return bridge().delete(id)
}

const TRIGGER_LABEL: Record<VersionTrigger, string> = {
  manual: 'Manual Save',
  'edit-pass': 'AI Edit Pass',
  'cover-generated': 'Cover Generated',
  'blurb-saved': 'Blurb Saved',
  'format-run': 'Format Run',
  import: 'Imported'
}

export function triggerLabel(t: VersionTrigger): string {
  return TRIGGER_LABEL[t]
}
