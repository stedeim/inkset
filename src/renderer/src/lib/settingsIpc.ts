// Renderer-side typed wrapper for window.api.settings.

export type KeyInfo = { present: boolean; masked: string | null }

export type MaskedKeys = {
  anthropic: KeyInfo
  openai: KeyInfo
  openrouter: KeyInfo
  envPath: string
}

export type SetKeysPayload = {
  ANTHROPIC_API_KEY?: string
  OPENAI_API_KEY?: string
  OPENROUTER_API_KEY?: string
}

type Bridge = {
  getKeys: () => Promise<MaskedKeys>
  setKeys: (payload: SetKeysPayload) => Promise<MaskedKeys>
}

function bridge(): Bridge {
  return window.api.settings as unknown as Bridge
}

export function getKeys(): Promise<MaskedKeys> {
  return bridge().getKeys()
}

export function setKeys(payload: SetKeysPayload): Promise<MaskedKeys> {
  return bridge().setKeys(payload)
}
