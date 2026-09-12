/** Protocol-level compatibility contract for the shipped Metis route. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, {
  createSystemMessage,
  createToolResultMessage,
  createUserMessage,
  ToolCallId,
} from '@deepseek-ai/dsh-llm'
import type { Message, ToolSchema } from '@deepseek-ai/dsh-llm'
import * as LlmPiAi from '@deepseek-ai/dsh-llm-pi-ai'
import { assemble, type AssembledResult } from './assemble.ts'
import { closeMockServers, mockServer, textEvents } from './mock-server.ts'

const MODEL = 'metis-coder-max'
const contexts: Context[] = []

const lookupTool: ToolSchema = {
  name: 'lookup_code',
  description: 'Look up a short code.',
  parameters: {
    type: 'object',
    properties: { code: { type: 'string' } },
    required: ['code'],
  },
}

function toolCallEvents(id: string, code: string) {
  return [
    '{"choices":[{"delta":{"role":"assistant","content":""},"index":0,"finish_reason":null}]}',
    JSON.stringify({ choices: [{ delta: { tool_calls: [{
      index: 0,
      id,
      type: 'function',
      function: { name: 'lookup_code', arguments: JSON.stringify({ code }) },
    }] }, index: 0, finish_reason: null }] }),
    '{"choices":[{"delta":{},"index":0,"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":8,"completion_tokens":4}}',
    '[DONE]',
  ]
}

function jsonEvents(value: unknown) {
  return [
    '{"choices":[{"delta":{"role":"assistant","content":""},"index":0,"finish_reason":null}]}',
    JSON.stringify({ choices: [{ delta: { content: JSON.stringify(value) }, index: 0, finish_reason: null }] }),
    '{"choices":[{"delta":{},"index":0,"finish_reason":"stop"}],"usage":{"prompt_tokens":5,"completion_tokens":3}}',
    '[DONE]',
  ]
}

async function harness(baseURL: string, streamIdleTimeoutMs = 300_000): Promise<Context> {
  vi.stubEnv('METIS_API_KEY', 'test-token')
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(LlmPiAi, {
    providers: {
      metis: {
        displayName: 'Metis',
        apiKeyEnv: 'METIS_API_KEY',
        api: 'openai-completions',
        baseURL,
        defaultContextWindow: 1_000_000,
        defaultInput: ['text'],
        streamIdleTimeoutMs,
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
          name: 'Metis Coder Max',
          contextWindow: 1_000_000,
          input: ['text'],
          reasoningEfforts: false,
        }],
      },
    },
  })
  return ctx
}

function user(text: string): Message {
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: { kind: 'plugin', plugin: 'test' },
  })
}

function textOf(result: AssembledResult): string {
  return result.message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
}

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  vi.unstubAllEnvs()
  await closeMockServers()
})

describe('Metis OpenAI Chat Completions compatibility', () => {
  it('streams a normal system-and-user conversation with the conservative request fields', async () => {
    const server = await mockServer([{ events: textEvents }])
    const ctx = await harness(server.url)

    const result = await assemble(ctx, {
      provider: 'metis',
      model: MODEL,
      messages: [createSystemMessage('Be concise.', 'test'), user('hello')],
      maxTokens: 64,
    })

    expect(result.finish).toEqual({ kind: 'stop' })
    expect(textOf(result)).toBe('hello')
    expect(server.paths).toEqual(['/chat/completions'])
    expect(server.headers[0]?.authorization).toBe('Bearer test-token')
    expect(server.requests[0]).toMatchObject({
      model: MODEL,
      stream: true,
      max_tokens: 64,
      messages: [
        { role: 'system', content: 'Be concise.' },
        { role: 'user', content: 'hello' },
      ],
    })
    expect(server.requests[0]).not.toHaveProperty('max_completion_tokens')
    expect(server.requests[0]).not.toHaveProperty('reasoning_effort')
    expect(server.requests[0]).not.toHaveProperty('stream_options')
  })

  it('preserves multi-turn user and assistant history', async () => {
    const server = await mockServer([{ events: textEvents }, { events: textEvents }])
    const ctx = await harness(server.url)
    const firstUser = user('first')
    const first = await assemble(ctx, { provider: 'metis', model: MODEL, messages: [firstUser] })

    await assemble(ctx, {
      provider: 'metis',
      model: MODEL,
      messages: [firstUser, first.message, user('second')],
    })

    expect(server.requests[1]).toMatchObject({ messages: [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'second' },
    ] })
  })

  it('round-trips one tool call and its result', async () => {
    const server = await mockServer([
      { events: toolCallEvents('call-1', 'blue') },
      { events: textEvents },
    ])
    const ctx = await harness(server.url)
    const prompt = user('look up blue')
    const first = await assemble(ctx, {
      provider: 'metis', model: MODEL, messages: [prompt], tools: [lookupTool],
    })
    const call = first.message.content.find(block => block.type === 'tool-call')
    expect(first.finish.kind).toBe('tool-calls')
    expect(call).toMatchObject({ name: 'lookup_code' })
    if (call?.type !== 'tool-call') throw new Error('mock response did not produce a tool call')

    const second = await assemble(ctx, {
      provider: 'metis',
      model: MODEL,
      messages: [prompt, first.message, createToolResultMessage({
        callId: ToolCallId(call.id),
        content: [{ type: 'text', text: 'ocean' }],
        isError: false,
      })],
      tools: [lookupTool],
    })

    expect(second.finish.kind).toBe('stop')
    expect(server.requests[1]).toMatchObject({ messages: [
      { role: 'user' },
      { role: 'assistant', tool_calls: [{ id: 'call-1', function: { name: 'lookup_code' } }] },
      { role: 'tool', tool_call_id: 'call-1', content: 'ocean' },
    ] })
  })

  it('continues across two sequential tool-call rounds', async () => {
    const server = await mockServer([
      { events: toolCallEvents('call-1', 'one') },
      { events: toolCallEvents('call-2', 'two') },
      { events: textEvents },
    ])
    const ctx = await harness(server.url)
    const messages: Message[] = [user('look up one and then two')]

    const first = await assemble(ctx, { provider: 'metis', model: MODEL, messages, tools: [lookupTool] })
    messages.push(first.message, createToolResultMessage({
      callId: ToolCallId('call-1'), content: [{ type: 'text', text: 'first result' }], isError: false,
    }))
    const second = await assemble(ctx, { provider: 'metis', model: MODEL, messages, tools: [lookupTool] })
    messages.push(second.message, createToolResultMessage({
      callId: ToolCallId('call-2'), content: [{ type: 'text', text: 'second result' }], isError: false,
    }))
    const final = await assemble(ctx, { provider: 'metis', model: MODEL, messages, tools: [lookupTool] })

    expect(first.finish.kind).toBe('tool-calls')
    expect(second.finish.kind).toBe('tool-calls')
    expect(final.finish.kind).toBe('stop')
    expect((server.requests[2] as { messages: unknown[] }).messages).toHaveLength(5)
  })

  it('returns prompt-constrained JSON as parseable text', async () => {
    const server = await mockServer([{ events: jsonEvents({ compatible: true, mode: 'prompt' }) }])
    const ctx = await harness(server.url)
    const result = await assemble(ctx, {
      provider: 'metis', model: MODEL, messages: [user('Return JSON only.')],
    })

    expect(JSON.parse(textOf(result))).toEqual({ compatible: true, mode: 'prompt' })
  })

  it('classifies idle timeout and caller cancellation and closes both streams', async () => {
    const timeoutServer = await mockServer([{ events: textEvents, delayMs: 100 }])
    const timeoutContext = await harness(timeoutServer.url, 20)
    const timedOut = await assemble(timeoutContext, { provider: 'metis', model: MODEL, messages: [] })
    expect(timedOut.finish).toMatchObject({ kind: 'error', failure: { code: 'TIMEOUT' } })

    const cancelServer = await mockServer([{ events: textEvents, delayMs: 100 }])
    const cancelContext = await harness(cancelServer.url)
    const controller = new AbortController()
    const pending = assemble(cancelContext, {
      provider: 'metis', model: MODEL, messages: [], signal: controller.signal,
    })
    setTimeout(() => { controller.abort('compatibility-test cancellation') }, 10)
    expect((await pending).finish.kind).toBe('aborted')
    await Promise.all([timeoutServer.responseClosed, cancelServer.responseClosed])
  })

  it.each([
    [400, 'INVALID_REQUEST'],
    [401, 'AUTH'],
    [429, 'RATE_LIMIT'],
    [500, 'SERVER'],
  ] as const)('maps HTTP %s to %s', async (status, code) => {
    const server = await mockServer([{
      status,
      body: JSON.stringify({ error: { message: `metis test ${status}` } }),
    }])
    const ctx = await harness(server.url)
    const result = await assemble(ctx, { provider: 'metis', model: MODEL, messages: [] })
    expect(result.finish).toMatchObject({ kind: 'error', failure: { code } })
  })
})
