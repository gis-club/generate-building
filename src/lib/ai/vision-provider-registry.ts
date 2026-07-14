/**
 * Dify-style vision provider registry.
 *
 * A provider owns credentials and an endpoint; each provider can expose any
 * number of models.  The recognition workflow only stores a provider/model
 * reference, so adding a new model never requires changing the Cesium code.
 */

export type VisionProviderProtocol =
  | 'local-sam'
  | 'openai-responses'
  | 'openai-compatible'
  | 'anthropic'
  | 'gemini'
  | 'azure-openai'

export interface VisionModelConfig {
  id: string
  name: string
  enabled: boolean
  vision: boolean
}

export interface VisionProviderConfig {
  id: string
  name: string
  protocol: VisionProviderProtocol
  baseUrl: string
  apiKey: string
  rememberApiKey: boolean
  headersText: string
  enabled: boolean
  builtin?: boolean
  models: VisionModelConfig[]
}

export interface VisionProviderTemplate {
  id: string
  name: string
  protocol: VisionProviderProtocol
  baseUrl: string
  modelHint: string
  apiKeyOptional?: boolean
}

export interface ActiveVisionModel {
  key: string
  providerId: string
  providerName: string
  modelId: string
  modelName: string
}

const REGISTRY_STORAGE_KEY = 'geobuild.ai.providers.v2'
const SESSION_SECRETS_KEY = 'geobuild.ai.provider-secrets.v2'
const ACTIVE_MODEL_STORAGE_KEY = 'geobuild.ai.active-model.v2'

export const VISION_PROVIDER_TEMPLATES: VisionProviderTemplate[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    protocol: 'openai-responses',
    baseUrl: 'https://api.openai.com/v1',
    modelHint: '输入支持图像的模型 ID'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    modelHint: '输入支持视觉的 Claude 模型 ID'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelHint: '输入支持图像理解的 Gemini 模型 ID'
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    protocol: 'azure-openai',
    baseUrl: 'https://RESOURCE.openai.azure.com/openai/deployments/DEPLOYMENT',
    modelHint: '模型 ID 可填写部署名称'
  },
  {
    id: 'qwen',
    name: '阿里云百炼 / Qwen',
    protocol: 'openai-compatible',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelHint: '输入 Qwen-VL 模型 ID'
  },
  {
    id: 'volcengine',
    name: '火山方舟',
    protocol: 'openai-compatible',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    modelHint: '输入视觉模型或推理接入点 ID'
  },
  {
    id: 'zhipu',
    name: '智谱 AI',
    protocol: 'openai-compatible',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    modelHint: '输入 GLM 视觉模型 ID'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    protocol: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelHint: '输入 OpenRouter 视觉模型 ID'
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    protocol: 'openai-compatible',
    baseUrl: 'https://api.siliconflow.cn/v1',
    modelHint: '输入支持视觉的模型 ID'
  },
  {
    id: 'ollama',
    name: 'Ollama / 本地模型',
    protocol: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:11434/v1',
    modelHint: '输入本地视觉模型 ID',
    apiKeyOptional: true
  },
  {
    id: 'custom',
    name: '自定义 OpenAI Compatible',
    protocol: 'openai-compatible',
    baseUrl: '',
    modelHint: '输入供应商提供的模型 ID',
    apiKeyOptional: true
  }
]

function createId(prefix = 'provider') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function createSamProvider(): VisionProviderConfig {
  return {
    id: 'local-sam',
    name: '本地 SAM 服务',
    protocol: 'local-sam',
    baseUrl: '/sam-api',
    apiKey: '',
    rememberApiKey: false,
    headersText: '{}',
    enabled: true,
    builtin: true,
    models: [{ id: 'segment-anything', name: 'Segment Anything', enabled: true, vision: true }]
  }
}

export function createProviderFromTemplate(templateId: string): VisionProviderConfig {
  const template =
    VISION_PROVIDER_TEMPLATES.find((item) => item.id === templateId) ||
    VISION_PROVIDER_TEMPLATES[VISION_PROVIDER_TEMPLATES.length - 1]

  return {
    id: createId(template.id),
    name: template.name,
    protocol: template.protocol,
    baseUrl: template.baseUrl,
    apiKey: '',
    rememberApiKey: false,
    headersText: '{}',
    enabled: true,
    models: []
  }
}

function normalizeProvider(value: Partial<VisionProviderConfig>): VisionProviderConfig | null {
  if (!value || !value.id || !value.protocol) return null
  return {
    id: String(value.id),
    name: String(value.name || value.id),
    protocol: value.protocol,
    baseUrl: String(value.baseUrl || '').replace(/\/$/, ''),
    apiKey: String(value.apiKey || ''),
    rememberApiKey: Boolean(value.rememberApiKey),
    headersText: String(value.headersText || '{}'),
    enabled: value.enabled !== false,
    builtin: Boolean(value.builtin),
    models: Array.isArray(value.models)
      ? value.models
          .filter((model) => model?.id)
          .map((model) => ({
            id: String(model.id),
            name: String(model.name || model.id),
            enabled: model.enabled !== false,
            vision: model.vision !== false
          }))
      : []
  }
}

export function loadVisionProviders(): VisionProviderConfig[] {
  const stored = safeParse<Partial<VisionProviderConfig>[]>(
    localStorage.getItem(REGISTRY_STORAGE_KEY),
    []
  )
  const sessionSecrets = safeParse<Record<string, string>>(
    sessionStorage.getItem(SESSION_SECRETS_KEY),
    {}
  )
  const providers = stored.map(normalizeProvider).filter(Boolean) as VisionProviderConfig[]

  for (const provider of providers) {
    if (!provider.apiKey && sessionSecrets[provider.id]) {
      provider.apiKey = sessionSecrets[provider.id]
    }
  }

  if (!providers.some((provider) => provider.protocol === 'local-sam')) {
    providers.unshift(createSamProvider())
  }
  return providers
}

export function saveVisionProviders(providers: VisionProviderConfig[]) {
  const sessionSecrets: Record<string, string> = {}
  const persisted = providers.map((provider) => {
    const normalized = normalizeProvider(provider) as VisionProviderConfig
    if (!normalized.rememberApiKey && normalized.apiKey) {
      sessionSecrets[normalized.id] = normalized.apiKey
      normalized.apiKey = ''
    }
    return normalized
  })

  localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(persisted))
  sessionStorage.setItem(SESSION_SECRETS_KEY, JSON.stringify(sessionSecrets))
}

export function getActiveVisionModelKey() {
  return localStorage.getItem(ACTIVE_MODEL_STORAGE_KEY) || 'local-sam::segment-anything'
}

export function saveActiveVisionModelKey(value: string) {
  localStorage.setItem(ACTIVE_MODEL_STORAGE_KEY, value || '')
}

export function listActiveVisionModels(providers: VisionProviderConfig[]): ActiveVisionModel[] {
  const result: ActiveVisionModel[] = []
  for (const provider of providers) {
    if (!provider.enabled) continue
    for (const model of provider.models) {
      if (!model.enabled || !model.vision) continue
      result.push({
        key: `${provider.id}::${model.id}`,
        providerId: provider.id,
        providerName: provider.name,
        modelId: model.id,
        modelName: model.name || model.id
      })
    }
  }
  return result
}

export function resolveActiveVisionModel(
  providers: VisionProviderConfig[],
  key: string
): { provider: VisionProviderConfig; model: VisionModelConfig } | null {
  const separator = key.indexOf('::')
  if (separator < 1) return null
  const providerId = key.slice(0, separator)
  const modelId = key.slice(separator + 2)
  const provider = providers.find((item) => item.id === providerId && item.enabled)
  const model = provider?.models.find((item) => item.id === modelId && item.enabled && item.vision)
  return provider && model ? { provider, model } : null
}

export function addOrMergeModels(
  provider: VisionProviderConfig,
  models: VisionModelConfig[]
): number {
  let added = 0
  for (const model of models) {
    const existing = provider.models.find((item) => item.id === model.id)
    if (existing) {
      existing.name = model.name || existing.name
      continue
    }
    provider.models.push({ ...model, enabled: true, vision: true })
    added += 1
  }
  return added
}

export function createEmptyVisionModel(): VisionModelConfig {
  return { id: '', name: '', enabled: true, vision: true }
}
