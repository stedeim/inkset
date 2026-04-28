import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { promptsPathCandidates } from '../util/paths'

export const DEFAULT_MODEL = 'claude-sonnet-4-6'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENROUTER_MODEL = 'anthropic/claude-sonnet-4.6'

// Sonnet 4.x public pricing as of April 2026 (per million tokens).
const INPUT_PRICE_PER_MTOK_USD = 3.0
const OUTPUT_PRICE_PER_MTOK_USD = 15.0

const MAX_OUTPUT_TOKENS = 32000
export const LONG_MANUSCRIPT_WORD_THRESHOLD = 150_000

export type PassName = 'grammar' | 'style' | 'clarity'

const PASSES: readonly PassName[] = ['grammar', 'style', 'clarity'] as const

export type EditProgress = {
  pass: 1 | 2 | 3
  passName: PassName
  tokensUsed: number
  percentComplete: number
  /** Text streamed from Claude since the previous progress event. */
  deltaText?: string
  /** True on the first event for a given pass (marks a pass boundary in the feed). */
  passStart?: boolean
}

export type PassResult = {
  name: PassName
  input: string
  output: string
  tokensIn: number
  tokensOut: number
  durationMs: number
}

export type EditedManuscript = {
  originalContent: string
  editedContent: string
  passes: PassResult[]
  totalTokensIn: number
  totalTokensOut: number
  estimatedCostUsd: number
}

export class EditingError extends Error {
  constructor(
    message: string,
    readonly pass: PassName | null,
    readonly completedPasses: PassResult[]
  ) {
    super(message)
    this.name = 'EditingError'
  }
}

function resolvePromptsDir(): string {
  const candidates = promptsPathCandidates()
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate
  }
  throw new Error(
    `Could not locate prompts directory. Looked in: ${candidates.join(', ')}`
  )
}

let promptCache: Record<PassName, string> | null = null

function loadPrompts(): Record<PassName, string> {
  if (promptCache) return promptCache
  const dir = resolvePromptsDir()
  const loaded: Partial<Record<PassName, string>> = {}
  for (const pass of PASSES) {
    const file = join(dir, `${pass}.md`)
    if (!existsSync(file)) {
      throw new Error(`Missing prompt template: ${file}`)
    }
    loaded[pass] = readFileSync(file, 'utf-8')
  }
  promptCache = loaded as Record<PassName, string>
  return promptCache
}

function fillPrompt(template: string, manuscript: string): string {
  return template.replace('{{manuscript}}', manuscript)
}

type EditingProvider =
  | { kind: 'anthropic'; key: string }
  | { kind: 'openrouter'; key: string }

function resolveProvider(): EditingProvider {
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim()
  const openrouter = process.env.OPENROUTER_API_KEY?.trim()

  // Prefer Anthropic direct when present (simpler, native streaming).
  if (anthropic) {
    if (!anthropic.startsWith('sk-ant-')) {
      throw new Error(
        'ANTHROPIC_API_KEY appears malformed (expected sk-ant-… prefix). Fix in Settings.'
      )
    }
    return { kind: 'anthropic', key: anthropic }
  }

  if (openrouter) {
    if (!openrouter.startsWith('sk-or-')) {
      throw new Error(
        'OPENROUTER_API_KEY appears malformed (expected sk-or-… prefix). Fix in Settings.'
      )
    }
    return { kind: 'openrouter', key: openrouter }
  }

  throw new Error(
    'No editing provider configured. Add ANTHROPIC_API_KEY or OPENROUTER_API_KEY in Settings.'
  )
}

export function calculateCostUsd(tokensIn: number, tokensOut: number): number {
  const input = (tokensIn * INPUT_PRICE_PER_MTOK_USD) / 1_000_000
  const output = (tokensOut * OUTPUT_PRICE_PER_MTOK_USD) / 1_000_000
  return Number((input + output).toFixed(4))
}

function estimatePercentForPass(
  passIndex: number,
  outputSoFar: number,
  estimatedOutputTotal: number
): number {
  const passWeight = 1 / PASSES.length
  const completedBase = passIndex * passWeight
  const within = estimatedOutputTotal > 0
    ? Math.min(outputSoFar / estimatedOutputTotal, 1)
    : 0
  return Math.min(Math.round((completedBase + within * passWeight) * 100), 99)
}

type StreamOutcome = { output: string; tokensIn: number; tokensOut: number }

async function streamAnthropic(
  client: Anthropic,
  prompt: string,
  onDelta: (chunk: string) => void
): Promise<StreamOutcome> {
  const stream = client.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [{ role: 'user', content: prompt }]
  })
  let output = ''
  stream.on('text', (delta: string) => {
    output += delta
    onDelta(delta)
  })
  const finalMessage = await stream.finalMessage()
  return {
    output,
    tokensIn: finalMessage.usage.input_tokens,
    tokensOut: finalMessage.usage.output_tokens
  }
}

async function streamOpenRouter(
  client: OpenAI,
  prompt: string,
  onDelta: (chunk: string) => void
): Promise<StreamOutcome> {
  const stream = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: true,
    stream_options: { include_usage: true }
  })
  let output = ''
  let tokensIn = 0
  let tokensOut = 0
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content
    if (typeof delta === 'string' && delta.length > 0) {
      output += delta
      onDelta(delta)
    }
    if (chunk.usage) {
      tokensIn = chunk.usage.prompt_tokens ?? tokensIn
      tokensOut = chunk.usage.completion_tokens ?? tokensOut
    }
  }
  // Fallback estimates if OpenRouter didn't return usage.
  if (!tokensIn) tokensIn = Math.ceil(prompt.length / 4)
  if (!tokensOut) tokensOut = Math.ceil(output.length / 4)
  return { output, tokensIn, tokensOut }
}

async function runPass(
  clients: { anthropic: Anthropic | null; openrouter: OpenAI | null },
  provider: EditingProvider,
  passIndex: number,
  pass: PassName,
  input: string,
  template: string,
  onProgress: (update: EditProgress) => void,
  tokensUsedSoFar: number
): Promise<PassResult> {
  const start = Date.now()
  const prompt = fillPrompt(template, input)

  // Rough estimate: ~4 chars per token; pass output tends to be ~input length.
  const estimatedOutputTokens = Math.max(Math.ceil(input.length / 4), 500)

  let streamedOutputTokens = 0
  // Coalesce deltas so we emit roughly every 50ms (or every 200 chars) instead
  // of once per token — keeps IPC and the renderer responsive on large docs.
  let pendingDelta = ''
  let lastEmit = Date.now()
  const FLUSH_INTERVAL_MS = 50
  const FLUSH_CHAR_THRESHOLD = 200

  const flush = (force: boolean): void => {
    if (!pendingDelta) return
    const now = Date.now()
    if (
      !force &&
      now - lastEmit < FLUSH_INTERVAL_MS &&
      pendingDelta.length < FLUSH_CHAR_THRESHOLD
    ) {
      return
    }
    const deltaText = pendingDelta
    pendingDelta = ''
    lastEmit = now
    onProgress({
      pass: (passIndex + 1) as 1 | 2 | 3,
      passName: pass,
      tokensUsed: tokensUsedSoFar + streamedOutputTokens,
      percentComplete: estimatePercentForPass(
        passIndex,
        streamedOutputTokens,
        estimatedOutputTokens
      ),
      deltaText
    })
  }

  const onDelta = (delta: string): void => {
    pendingDelta += delta
    streamedOutputTokens += Math.max(1, Math.ceil(delta.length / 4))
    flush(false)
  }

  let outcome: StreamOutcome
  if (provider.kind === 'anthropic') {
    outcome = await streamAnthropic(clients.anthropic!, prompt, onDelta)
  } else {
    outcome = await streamOpenRouter(clients.openrouter!, prompt, onDelta)
  }
  flush(true)

  return {
    name: pass,
    input,
    output: outcome.output.trim(),
    tokensIn: outcome.tokensIn,
    tokensOut: outcome.tokensOut,
    durationMs: Date.now() - start
  }
}

export async function editManuscript(
  content: string,
  onProgress: (update: EditProgress) => void
): Promise<EditedManuscript> {
  const provider = resolveProvider()
  const prompts = loadPrompts()

  const clients = {
    anthropic:
      provider.kind === 'anthropic' ? new Anthropic({ apiKey: provider.key }) : null,
    openrouter:
      provider.kind === 'openrouter'
        ? new OpenAI({
            apiKey: provider.key,
            baseURL: OPENROUTER_BASE_URL,
            defaultHeaders: {
              'HTTP-Referer': 'https://inkset.app',
              'X-Title': 'Inkset'
            }
          })
        : null
  }

  const completed: PassResult[] = []
  let currentInput = content
  let runningTokens = 0

  for (let i = 0; i < PASSES.length; i++) {
    const pass = PASSES[i]
    onProgress({
      pass: (i + 1) as 1 | 2 | 3,
      passName: pass,
      tokensUsed: runningTokens,
      percentComplete: Math.round((i / PASSES.length) * 100),
      passStart: true
    })

    try {
      const result = await runPass(
        clients,
        provider,
        i,
        pass,
        currentInput,
        prompts[pass],
        onProgress,
        runningTokens
      )
      completed.push(result)
      runningTokens += result.tokensIn + result.tokensOut
      currentInput = result.output
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new EditingError(
        `Pass ${i + 1} (${pass}) failed: ${message}`,
        pass,
        completed
      )
    }
  }

  const totalTokensIn = completed.reduce((sum, p) => sum + p.tokensIn, 0)
  const totalTokensOut = completed.reduce((sum, p) => sum + p.tokensOut, 0)

  onProgress({
    pass: 3,
    passName: 'clarity',
    tokensUsed: totalTokensIn + totalTokensOut,
    percentComplete: 100
  })

  return {
    originalContent: content,
    editedContent: completed[completed.length - 1]!.output,
    passes: completed,
    totalTokensIn,
    totalTokensOut,
    estimatedCostUsd: calculateCostUsd(totalTokensIn, totalTokensOut)
  }
}
