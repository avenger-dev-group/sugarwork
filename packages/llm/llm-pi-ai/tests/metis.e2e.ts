/** Credential-gated compatibility checks against the deployed Metis gateway. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, {
  createToolResultMessage,
  createUserMessage,
  ToolCallId,
} from '@deepseek-ai/dsh-llm'
import type { Message, ToolSchema } from '@deepseek-ai/dsh-llm'
import * as LlmPiAi from '@deepseek-ai/dsh-llm-pi-ai'
import { assemble, type AssembledResult } from './assemble.ts'

const API_KEY = process.env.METIS_API_KEY
const BASE_URL = process.env.METIS_BASE_URL
const MODEL = process.env.METIS_MODEL ?? 'metis-coder-max'
const contexts: Context[] = []

const lookupTool: ToolSchema = {
  name: 'lookup_code',
  description: 'Return the word represented by a short code.',
  parameters: {
    type: 'object',
    properties: { code: { type: 'string', description: 'The code to look up.' } },
    required: ['code'],
  },
}

function user(text: string): Message {
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: { kind: 'plugin', plugin: 'metis-e2e' },
  })
}

function textOf(result: AssembledResult): string {
  return result.message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
}

async function harness(): Promise<Context> {
  if (BASE_URL === undefined) throw new Error('METIS_BASE_URL is required for the live compatibility suite')
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(LlmPiAi, {
    providers: {
      metis: {
        displayName: 'Metis',
        apiKeyEnv: 'METIS_API_KEY',
        api: 'openai-completions',
        baseURL: BASE_URL,
        defaultContextWindow: 1_000_000,
        defaultInput: ['text'],
        compat: {
          supportsStore: false,
          supportsDeveloperRole: false,
          supportsReasoningEffort: false,
          supportsUsageInStreaming: false,
          maxTokensField: 'max_tokens',
          supportsStrictMode: false,
          supportsLongCacheRetention: false,
        },
        models: [{
          id: MODEL,
          contextWindow: 1_000_000,
          input: ['text'],
          reasoningEfforts: false,
        }],
      },
    },
  })
  return ctx
}

function requireFinish(result: AssembledResult, kind: 'stop' | 'tool-calls'): void {
  if (result.finish.kind === 'error') {
    throw new Error(`Metis request failed (${result.finish.failure.code}): ${result.finish.failure.message}`)
  }
  expect(result.finish.kind).toBe(kind)
}

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
})

describe.skipIf(API_KEY === undefined || BASE_URL === undefined)('Metis deployed gateway e2e', () => {
  it('streams text and retains multi-turn history', async () => {
    const ctx = await harness()
    const prompt = user('Reply with exactly: turn one')
    const first = await assemble(ctx, {
      provider: 'metis', model: MODEL, messages: [prompt], maxTokens: 64,
    })
    requireFinish(first, 'stop')
    expect(textOf(first).toLowerCase()).toContain('turn one')

    const second = await assemble(ctx, {
      provider: 'metis',
      model: MODEL,
      messages: [prompt, first.message, user('Reply with exactly: turn two')],
      maxTokens: 64,
    })
    requireFinish(second, 'stop')
    expect(textOf(second).toLowerCase()).toContain('turn two')
  })

  it('round-trips one tool call', async () => {
    const ctx = await harness()
    const prompt = user('Call lookup_code with code "blue". Do not answer directly.')
    const first = await assemble(ctx, {
      provider: 'metis', model: MODEL, messages: [prompt], tools: [lookupTool], maxTokens: 512,
    })
    requireFinish(first, 'tool-calls')
    const call = first.message.content.find(block => block.type === 'tool-call')
    if (call?.type !== 'tool-call') throw new Error('Metis returned no lookup_code call')
    expect(call.name).toBe('lookup_code')
    expect(JSON.parse(call.arguments)).toMatchObject({ code: 'blue' })

    const second = await assemble(ctx, {
      provider: 'metis',
      model: MODEL,
      messages: [prompt, first.message, createToolResultMessage({
        callId: ToolCallId(call.id),
        content: [{ type: 'text', text: 'blue means ocean' }],
        isError: false,
      })],
      tools: [lookupTool],
      maxTokens: 256,
    })
    requireFinish(second, 'stop')
    expect(textOf(second).toLowerCase()).toContain('ocean')
  })

  it('continues into a second tool call before answering', async () => {
    const ctx = await harness()
    const prompt = user('First call lookup_code with code "one". After its result, call it again with code "two".')
    const first = await assemble(ctx, {
      provider: 'metis', model: MODEL, messages: [prompt], tools: [lookupTool], maxTokens: 512,
    })
    requireFinish(first, 'tool-calls')
    const firstCall = first.message.content.find(block => block.type === 'tool-call')
    if (firstCall?.type !== 'tool-call') throw new Error('Metis returned no first tool call')
    const history: Message[] = [prompt, first.message, createToolResultMessage({
      callId: ToolCallId(firstCall.id), content: [{ type: 'text', text: 'first result' }], isError: false,
    })]

    const second = await assemble(ctx, {
      provider: 'metis', model: MODEL, messages: history, tools: [lookupTool], maxTokens: 512,
    })
    requireFinish(second, 'tool-calls')
    const secondCall = second.message.content.find(block => block.type === 'tool-call')
    if (secondCall?.type !== 'tool-call') throw new Error('Metis returned no second tool call')
    expect(JSON.parse(secondCall.arguments)).toMatchObject({ code: 'two' })
  })

  it('returns parseable prompt-constrained JSON', async () => {
    const ctx = await harness()
    const result = await assemble(ctx, {
      provider: 'metis',
      model: MODEL,
      messages: [user('Return only this JSON object with no markdown: {"compatible":true}')],
      maxTokens: 128,
    })
    requireFinish(result, 'stop')
    expect(JSON.parse(textOf(result))).toEqual({ compatible: true })
  })
})
