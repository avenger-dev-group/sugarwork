/**
 * `@earendil-works/pi-ai` stub, including its `/providers/all` and `/api/*.lazy`
 * subpaths. The package is Node-only (no `require`/`browser` conditions, Node
 * builtins plus five cloud SDKs in its transport layer) and `llm-pi-ai` imports it
 * statically at module scope, so the row cannot mount without it.
 *
 * Every symbol `llm-pi-ai` imports by name is present: a missing CommonJS symbol
 * would surface as `undefined` at call time instead of a link error. Catalog and
 * collection operations preserve configured provider metadata so the shipped
 * Web profile can activate and describe Metis. Everything on a request or auth
 * path is loud because this deployment ships no pi-ai transport.
 */
import { notImplementedFail } from '../notImplementedFail.ts'

const MODULE = '@earendil-works/pi-ai'

type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

interface StructuralModel {
  readonly id: string
  readonly provider: string
  readonly reasoning?: boolean
  readonly thinkingLevelMap?: Partial<Record<ThinkingLevel, unknown>>
}

interface StructuralProvider {
  readonly id: string
  readonly name: string
  readonly baseUrl?: string
  readonly headers?: Readonly<Record<string, string>>
  readonly auth: object
  getModels(): readonly StructuralModel[]
  stream(): never
  streamSimple(): never
}

interface StructuralProviderInput {
  readonly id: string
  readonly name?: string
  readonly baseUrl?: string
  readonly headers?: Readonly<Record<string, string>>
  readonly auth: object
  readonly models: readonly StructuralModel[]
  readonly api: unknown
}

interface StructuralModels {
  readonly [key: string]: unknown
  setProvider(provider: StructuralProvider): void
  deleteProvider(id: string): void
  clearProviders(): void
  getProviders(): readonly StructuralProvider[]
  getProvider(id: string): StructuralProvider | undefined
  getModels(provider?: string): readonly StructuralModel[]
  getModel(provider: string, id: string): StructuralModel | undefined
  streamSimple(): never
  checkAuth(): never
}

const refuseStream = notImplementedFail(MODULE, 'stream')

/**
 * Preserve a configured provider's catalog while refusing its request path.
 * @param input - Provider metadata and models from the resolved profile.
 * @returns A structural provider for catalog reads.
 */
export function createProvider(input: StructuralProviderInput): StructuralProvider {
  return {
    id: input.id,
    name: input.name ?? input.id,
    ...input.baseUrl === undefined ? {} : { baseUrl: input.baseUrl },
    ...input.headers === undefined ? {} : { headers: input.headers },
    auth: input.auth,
    getModels: () => input.models,
    stream: refuseStream,
    streamSimple: refuseStream,
  }
}

/**
 * Preserve configured providers and their model catalogs while refusing operations that need pi-ai.
 * @returns A mutable structural provider collection.
 */
export function createModels(): StructuralModels {
  const providers = new Map<string, StructuralProvider>()
  const refuseAuth = notImplementedFail(MODULE, 'auth')
  return {
    setProvider(provider: StructuralProvider): void { providers.set(provider.id, provider) },
    deleteProvider(id: string): void { providers.delete(id) },
    clearProviders(): void { providers.clear() },
    getProviders: (): readonly StructuralProvider[] => [...providers.values()],
    getProvider: (id: string): StructuralProvider | undefined => providers.get(id),
    getModels: (provider?: string): readonly StructuralModel[] => provider === undefined
      ? [...providers.values()].flatMap(entry => entry.getModels())
      : providers.get(provider)?.getModels() ?? [],
    getModel: (provider: string, id: string): StructuralModel | undefined =>
      providers.get(provider)?.getModels().find(model => model.id === id),
    stream: refuseStream,
    complete: refuseStream,
    streamSimple: refuseStream,
    completeSimple: refuseStream,
    streamDeferred: refuseStream,
    fetchDeferred: refuseStream,
    cancelDeferred: refuseStream,
    refresh: refuseAuth,
    checkAuth: refuseAuth,
    getAvailable: refuseAuth,
    getAuth: refuseAuth,
    login: refuseAuth,
    logout: refuseAuth,
  }
}

/**
 * Return the provider-neutral reasoning levels needed to describe configured models.
 * @param model - Configured model metadata.
 * @returns The reasoning levels the model declares.
 */
export function getSupportedThinkingLevels(model: StructuralModel): ThinkingLevel[] {
  if (model.reasoning !== true) return ['off']
  const levels: ThinkingLevel[] = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
  return levels.filter((level) => {
    const mapped = model.thinkingLevelMap?.[level]
    if (mapped === null) return false
    return level !== 'xhigh' && level !== 'max' || mapped !== undefined
  })
}

/** Context-overflow predicate (unavailable). */
export const isContextOverflow = notImplementedFail(MODULE, 'isContextOverflow')

/** Builtin provider ids of pi-ai 0.84.2, in catalog order. */
const BUILTIN_PROVIDER_IDS: readonly string[] = [
  'amazon-bedrock', 'ant-ling', 'anthropic', 'azure-openai-responses', 'baseten', 'cerebras',
  'cloudflare-ai-gateway', 'cloudflare-workers-ai', 'deepseek', 'fireworks', 'github-copilot',
  'google', 'google-vertex', 'groq', 'huggingface', 'kimi-coding', 'minimax', 'minimax-cn',
  'mistral', 'moonshotai', 'moonshotai-cn', 'nvidia', 'openai', 'openai-codex', 'opencode',
  'opencode-go', 'openrouter', 'qwen-token-plan', 'qwen-token-plan-cn',
  'qwen-token-plan-individual', 'together',
  'vercel-ai-gateway', 'xai', 'xiaomi', 'xiaomi-token-plan-ams', 'xiaomi-token-plan-cn',
  'xiaomi-token-plan-sgp', 'zai', 'zai-coding-cn',
]

/**
 * Installed catalog providers, read while `llm-pi-ai` activates. Each carries the
 * api-key auth marker the adapter filters on, and no models: the provider
 * directory therefore matches the served deployment while every request path
 * lands on a loud symbol above.
 * @returns one entry per builtin provider.
 */
export function builtinProviders(): unknown[] {
  return BUILTIN_PROVIDER_IDS.map(id => ({
    id,
    name: id,
    auth: { apiKey: { type: 'api-key' } },
    models: [],
  }))
}

/**
 * Provider route ids of the installed catalog. `llm-pi-ai` registers the whole
 * catalog as configurable the moment it mounts and rejects an empty
 * registration, so these are pi-ai's real ids rather than an empty list.
 * @returns the builtin provider ids.
 */
export function getBuiltinProviders(): string[] {
  return [...BUILTIN_PROVIDER_IDS]
}

/**
 * Models of one installed catalog provider.
 * @returns no models.
 */
export function getBuiltinModels(): unknown[] {
  return []
}

/**
 * Construct a structural Anthropic messages API whose request operations refuse.
 * @returns The structural API entry.
 */
export function anthropicMessagesApi(): object {
  return { stream: refuseStream, streamSimple: refuseStream }
}

/**
 * Construct a structural OpenAI completions API whose request operations refuse.
 * @returns The structural API entry.
 */
export function openAICompletionsApi(): object {
  return { stream: refuseStream, streamSimple: refuseStream }
}

/**
 * Construct a structural OpenAI responses API whose request operations refuse.
 * @returns The structural API entry.
 */
export function openAIResponsesApi(): object {
  return { stream: refuseStream, streamSimple: refuseStream }
}

/** CommonJS interop marker: the worker loader hands `default` to default imports. */
export const __esModule = true

/** CommonJS default export: the members `require()` hands a caller of this module. */
export default {
  createProvider, createModels, getSupportedThinkingLevels, isContextOverflow, builtinProviders,
  getBuiltinModels, getBuiltinProviders, anthropicMessagesApi, openAICompletionsApi,
  openAIResponsesApi,
}
