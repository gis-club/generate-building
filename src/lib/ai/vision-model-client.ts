import type {
  VisionModelConfig,
  VisionProviderConfig,
  VisionProviderProtocol
} from './vision-provider-registry.ts'

export interface NormalizedBuildingOutline {
  label: string
  polygon: number[][]
}

export interface VisionRecognitionOptions {
  imageDataUrl: string
  maxBuildings?: number
  signal?: AbortSignal
}

const OUTLINE_SCHEMA = {
  type: 'object',
  properties: {
    buildings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          polygon: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2
            }
          }
        },
        required: ['label', 'polygon'],
        additionalProperties: false
      }
    }
  },
  required: ['buildings'],
  additionalProperties: false
}

function trimSlash(value: string) {
  return String(value || '').replace(/\/+$/, '')
}

function parseHeaders(provider: VisionProviderConfig): Record<string, string> {
  if (!provider.headersText?.trim()) return {}
  let value: unknown
  try {
    value = JSON.parse(provider.headersText)
  } catch {
    throw new Error(`供应商“${provider.name}”的自定义请求头不是合法 JSON`)
  }
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('自定义请求头必须是 JSON 对象')
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, String(item)])
  )
}

function authHeaders(provider: VisionProviderConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (provider.protocol === 'anthropic') {
    if (provider.apiKey) headers['x-api-key'] = provider.apiKey
    headers['anthropic-version'] = '2023-06-01'
    headers['anthropic-dangerous-direct-browser-access'] = 'true'
  } else if (provider.protocol === 'gemini') {
    if (provider.apiKey) headers['x-goog-api-key'] = provider.apiKey
  } else if (provider.protocol === 'azure-openai') {
    if (provider.apiKey) headers['api-key'] = provider.apiKey
  } else if (provider.apiKey) {
    headers.Authorization = `Bearer ${provider.apiKey}`
  }
  return { ...headers, ...parseHeaders(provider) }
}

function requireProviderConfig(provider: VisionProviderConfig) {
  if (!provider.baseUrl && provider.protocol !== 'local-sam') {
    throw new Error(`请先配置“${provider.name}”的 API Endpoint`)
  }
  if (!provider.apiKey && !['local-sam', 'openai-compatible'].includes(provider.protocol)) {
    throw new Error(`请先配置“${provider.name}”的 API Key`)
  }
}

async function readJson(response: Response) {
  const text = await response.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!response.ok) {
    const message =
      data?.error?.message || data?.error?.type || data?.message || data?.raw || response.statusText
    throw new Error(`供应商请求失败 (${response.status})：${String(message).slice(0, 300)}`)
  }
  return data
}

function buildPrompt(maxBuildings: number) {
  return `你是一名遥感建筑轮廓提取专家。识别这张地图截图中清晰可见的建筑屋顶/建筑基底轮廓，忽略道路、树木、阴影、文字、地图控件以及已有的三维模型。最多返回 ${maxBuildings} 个最可信的建筑。

必须只返回 JSON：{"buildings":[{"label":"building","polygon":[[x,y],...] }]}
polygon 使用图像归一化坐标，左上角为 [0,0]，右下角为 [1000,1000]；点顺时针排列，不要重复首点；每个轮廓至少 3 点。不要返回 Markdown 或解释。`
}

function splitDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl)
  if (!match) throw new Error('地图截图格式无效')
  return { mimeType: match[1], base64: match[2] }
}

function getOpenAIText(data: any) {
  if (typeof data?.output_text === 'string') return data.output_text
  if (Array.isArray(data?.output)) {
    const texts = data.output
      .flatMap((item: any) => item?.content || [])
      .map((item: any) => item?.text)
      .filter((item: any) => typeof item === 'string')
    if (texts.length) return texts.join('\n')
  }
  const content = data?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map((item: any) => item?.text || item?.content || '').join('\n')
  }
  return ''
}

function extractJson(text: string) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    throw new Error('模型没有返回可解析的建筑轮廓 JSON')
  }
}

function normalizePoint(point: unknown): number[] | null {
  if (!Array.isArray(point) || point.length < 2) return null
  let x = Number(point[0])
  let y = Number(point[1])
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
    x *= 1000
    y *= 1000
  }
  return [Math.max(0, Math.min(1000, x)), Math.max(0, Math.min(1000, y))]
}

export function normalizeBuildingOutlines(value: any): NormalizedBuildingOutline[] {
  const candidates = Array.isArray(value)
    ? value
    : value?.buildings || value?.outlines || value?.polygons || value?.boxes || []
  if (!Array.isArray(candidates)) return []

  return candidates
    .map((item, index) => {
      const source = Array.isArray(item) ? item : item?.polygon || item?.points || item?.mask
      if (!Array.isArray(source)) return null
      const polygon: number[][] = []
      for (const rawPoint of source) {
        const point = normalizePoint(rawPoint)
        if (!point) continue
        const previous = polygon[polygon.length - 1]
        if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) polygon.push(point)
      }
      if (polygon.length > 3) {
        const first = polygon[0]
        const last = polygon[polygon.length - 1]
        if (first[0] === last[0] && first[1] === last[1]) polygon.pop()
      }
      if (polygon.length < 3) return null
      return { label: String(item?.label || item?.name || `building-${index + 1}`), polygon }
    })
    .filter(Boolean) as NormalizedBuildingOutline[]
}

async function requestOpenAIResponses(
  provider: VisionProviderConfig,
  model: VisionModelConfig,
  options: VisionRecognitionOptions,
  prompt: string
) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/responses`, {
    method: 'POST',
    headers: authHeaders(provider),
    signal: options.signal,
    body: JSON.stringify({
      model: model.id,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: options.imageDataUrl, detail: 'high' }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'building_outlines',
          strict: true,
          schema: OUTLINE_SCHEMA
        }
      }
    })
  })
  const data = await readJson(response)
  return extractJson(getOpenAIText(data))
}

async function requestOpenAICompatible(
  provider: VisionProviderConfig,
  model: VisionModelConfig,
  options: VisionRecognitionOptions,
  prompt: string
) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(provider),
    signal: options.signal,
    body: JSON.stringify({
      model: model.id,
      temperature: 0,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: options.imageDataUrl, detail: 'high' } }
          ]
        }
      ]
    })
  })
  const data = await readJson(response)
  return extractJson(getOpenAIText(data))
}

async function requestAnthropic(
  provider: VisionProviderConfig,
  model: VisionModelConfig,
  options: VisionRecognitionOptions,
  prompt: string
) {
  const image = splitDataUrl(options.imageDataUrl)
  const response = await fetch(`${trimSlash(provider.baseUrl)}/messages`, {
    method: 'POST',
    headers: authHeaders(provider),
    signal: options.signal,
    body: JSON.stringify({
      model: model.id,
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } },
            { type: 'text', text: prompt }
          ]
        }
      ]
    })
  })
  const data = await readJson(response)
  const text = (data?.content || []).map((item: any) => item?.text || '').join('\n')
  return extractJson(text)
}

async function requestGemini(
  provider: VisionProviderConfig,
  model: VisionModelConfig,
  options: VisionRecognitionOptions,
  prompt: string
) {
  const image = splitDataUrl(options.imageDataUrl)
  const modelId = model.id.replace(/^models\//, '')
  const response = await fetch(
    `${trimSlash(provider.baseUrl)}/models/${encodeURIComponent(modelId)}:generateContent`,
    {
      method: 'POST',
      headers: authHeaders(provider),
      signal: options.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: image.mimeType, data: image.base64 } }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: OUTLINE_SCHEMA
        }
      })
    }
  )
  const data = await readJson(response)
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((item: any) => item?.text || '')
    .join('\n')
  return extractJson(text)
}

function azureChatUrl(provider: VisionProviderConfig) {
  const base = trimSlash(provider.baseUrl)
  if (/\/chat\/completions(?:\?|$)/.test(base)) return base
  return `${base}/chat/completions?api-version=2024-10-21`
}

async function requestAzureOpenAI(
  provider: VisionProviderConfig,
  model: VisionModelConfig,
  options: VisionRecognitionOptions,
  prompt: string
) {
  const response = await fetch(azureChatUrl(provider), {
    method: 'POST',
    headers: authHeaders(provider),
    signal: options.signal,
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: options.imageDataUrl, detail: 'high' } }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 4096
    })
  })
  const data = await readJson(response)
  return extractJson(getOpenAIText(data))
}

export async function recognizeBuildingsWithVisionModel(
  provider: VisionProviderConfig,
  model: VisionModelConfig,
  options: VisionRecognitionOptions
): Promise<NormalizedBuildingOutline[]> {
  requireProviderConfig(provider)
  const prompt = buildPrompt(Math.max(1, Math.min(100, options.maxBuildings || 30)))
  let result: any
  if (provider.protocol === 'openai-responses') {
    result = await requestOpenAIResponses(provider, model, options, prompt)
  } else if (provider.protocol === 'anthropic') {
    result = await requestAnthropic(provider, model, options, prompt)
  } else if (provider.protocol === 'gemini') {
    result = await requestGemini(provider, model, options, prompt)
  } else if (provider.protocol === 'azure-openai') {
    result = await requestAzureOpenAI(provider, model, options, prompt)
  } else {
    result = await requestOpenAICompatible(provider, model, options, prompt)
  }
  const outlines = normalizeBuildingOutlines(result)
  if (!outlines.length) throw new Error('模型未识别到有效建筑轮廓')
  return outlines
}

function modelsEndpoint(protocol: VisionProviderProtocol, baseUrl: string) {
  const base = trimSlash(baseUrl)
  if (protocol === 'gemini') return `${base}/models?pageSize=1000`
  return `${base}/models`
}

export async function fetchVisionProviderModels(
  provider: VisionProviderConfig
): Promise<VisionModelConfig[]> {
  requireProviderConfig(provider)
  if (provider.protocol === 'local-sam') return provider.models
  if (provider.protocol === 'azure-openai') {
    throw new Error('Azure OpenAI 使用部署名称，请手动添加模型/部署')
  }
  const response = await fetch(modelsEndpoint(provider.protocol, provider.baseUrl), {
    headers: authHeaders(provider)
  })
  const data = await readJson(response)
  const items = provider.protocol === 'gemini' ? data?.models : data?.data
  if (!Array.isArray(items)) throw new Error('供应商没有返回模型列表')
  return items
    .filter((item) => {
      if (provider.protocol !== 'gemini') return item?.id
      return item?.name && (!item?.supportedGenerationMethods || item.supportedGenerationMethods.includes('generateContent'))
    })
    .map((item) => ({
      id: String(item.id || item.name || '').replace(/^models\//, ''),
      name: String(item.displayName || item.name || item.id || '').replace(/^models\//, ''),
      enabled: true,
      vision: true
    }))
}

export async function testVisionProvider(provider: VisionProviderConfig) {
  if (provider.protocol === 'local-sam') {
    const response = await fetch(`${trimSlash(provider.baseUrl)}/automatic_masks`, {
      method: 'OPTIONS'
    })
    return response.ok || [404, 405].includes(response.status)
  }
  if (provider.protocol === 'azure-openai') {
    requireProviderConfig(provider)
    return true
  }
  await fetchVisionProviderModels(provider)
  return true
}
