import { Sam } from './home-view-lib.ts'

import {
  addOrMergeModels,
  createEmptyVisionModel,
  createProviderFromTemplate,
  resolveActiveVisionModel,
  saveActiveVisionModelKey,
  saveVisionProviders
} from '../../lib/ai/vision-provider-registry.ts'
import {
  fetchVisionProviderModels,
  recognizeBuildingsWithVisionModel,
  testVisionProvider
} from '../../lib/ai/vision-model-client.ts'

/**
 * AI 辅助识别逻辑。
 * 当前流程：截取地图画面 -> 通过 Vite 代理请求 SAM -> 写入 `finalData`。
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 将输入值稳定转换为指定精度的数字，避免坐标与高程在界面中出现过长小数。
 */
function toFixedNumber(value, precision) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return 0
  return parseFloat(numberValue.toFixed(precision))
}

/**
 * 规范化 SAM 返回的多边形数组：过滤非法点、自动闭合首尾并补齐缺失高度。
 */
function normalizeSamLonlats(groups) {
  if (!Array.isArray(groups)) return []

  return groups
    .map((group) => {
      if (!Array.isArray(group)) return null

      const lonlats = group
        .map((point) => {
          if (!Array.isArray(point) || point.length < 2) return null
          return [
            toFixedNumber(point[0], 6),
            toFixedNumber(point[1], 6),
            point.length > 2 ? toFixedNumber(point[2], 2) : 0
          ]
        })
        .filter(Boolean)

      if (lonlats.length < 3) return null

      const first = lonlats[0]
      const last = lonlats[lonlats.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) {
        lonlats.push([...first])
      }

      return lonlats.length >= 4 ? lonlats : null
    })
    .filter(Boolean)
}

/**
 * 地形采样失败时，以已有高度字段兜底。
 */
function fallbackHeights(lonlats) {
  return lonlats.map((polygon) => {
    let minHeight = Number.POSITIVE_INFINITY

    for (const point of polygon) {
      point[2] = toFixedNumber(point[2], 2)
      minHeight = Math.min(minHeight, point[2])
    }

    return Number.isFinite(minHeight) ? minHeight : 0
  })
}

function polygonArea(points) {
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    area += current[0] * next[1] - next[0] * current[1]
  }
  return Math.abs(area) / 2
}

/**
 * Vision LLMs can occasionally return the image/background boundary as a building.
 * Reject those screen-sized outlines before projecting them onto the globe.
 */
function isPlausibleVisionOutline(points) {
  if (!Array.isArray(points) || points.length < 3) return false
  if (points.some((point) => !Array.isArray(point) || !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) {
    return false
  }

  const areaRatio = polygonArea(points) / 1_000_000
  if (areaRatio < 0.0002 || areaRatio > 0.18) return false

  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])
  const spanX = (Math.max(...xs) - Math.min(...xs)) / 1000
  const spanY = (Math.max(...ys) - Math.min(...ys)) / 1000
  return spanX <= 0.8 && spanY <= 0.8
}

import { defineRecoveredMethods } from '../../lib/recovered-sdk-types.ts'

export const homeViewAiMethods = defineRecoveredMethods({
  startAIRecognitionProgress(stage = '正在准备地图画面') {
    this.aiProgress = 8
    this.aiProgressStage = stage
    this.aiProgressStartedAt = Date.now()
  },

  updateAIRecognitionProgress(percentage, stage) {
    const nextPercentage = Math.max(0, Math.min(100, Number(percentage) || 0))
    this.aiProgress = Math.max(Number(this.aiProgress) || 0, nextPercentage)
    if (stage) this.aiProgressStage = stage
  },

  openAIProviderManager() {
    this.aiProviderDialogVisible = true
  },

  saveAIProviderSettings(showMessage = true) {
    saveVisionProviders(this.aiProviders)
    saveActiveVisionModelKey(this.aiActiveModelKey)
    if (showMessage) this.notify?.('AI 供应商与模型配置已保存', 'success')
  },

  addAIProvider() {
    const provider = createProviderFromTemplate(this.aiNewProviderTemplate)
    this.aiProviders.push(provider)
    this.saveAIProviderSettings(false)
    this.$nextTick?.(() => {
      document.getElementById(`ai-provider-${provider.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    })
  },

  removeAIProvider(provider) {
    if (provider?.builtin) return
    const index = this.aiProviders.findIndex((item) => item.id === provider.id)
    if (index < 0) return
    this.aiProviders.splice(index, 1)
    if (String(this.aiActiveModelKey).startsWith(`${provider.id}::`)) {
      this.aiActiveModelKey = ''
    }
    this.saveAIProviderSettings(false)
  },

  addAIModel(provider) {
    provider.models.push(createEmptyVisionModel())
  },

  removeAIModel(provider, modelIndex) {
    const model = provider.models[modelIndex]
    provider.models.splice(modelIndex, 1)
    if (this.aiActiveModelKey === `${provider.id}::${model?.id}`) this.aiActiveModelKey = ''
    this.saveAIProviderSettings(false)
  },

  async discoverAIModels(provider) {
    if (this.aiProviderBusyId) return
    this.aiProviderBusyId = provider.id
    try {
      const models = await fetchVisionProviderModels(provider)
      const added = addOrMergeModels(provider, models)
      this.saveAIProviderSettings(false)
      this.notify?.(`已获取 ${models.length} 个模型，新增 ${added} 个`, 'success')
    } catch (error) {
      this.notify?.(error?.message || '获取模型列表失败', 'error')
    } finally {
      this.aiProviderBusyId = ''
    }
  },

  async testAIProvider(provider) {
    if (this.aiProviderBusyId) return
    this.aiProviderBusyId = provider.id
    try {
      await testVisionProvider(provider)
      this.notify?.(`“${provider.name}”连接成功`, 'success')
    } catch (error) {
      this.notify?.(error?.message || '供应商连接失败', 'error')
    } finally {
      this.aiProviderBusyId = ''
    }
  },

  onActiveAIModelChange() {
    saveActiveVisionModelKey(this.aiActiveModelKey)
  },

  async useActiveAIModel() {
    if (this.aiRunning) return
    const active = resolveActiveVisionModel(this.aiProviders, this.aiActiveModelKey)
    if (!active) {
      this.aiProviderDialogVisible = true
      this.notify?.('请先启用并选择一个视觉模型', 'warning')
      return
    }

    if (active.provider.protocol === 'local-sam') {
      await this.useSAM()
      return
    }

    if (!window.myViewer?.viewer?.scene?.canvas) {
      this.notify?.('地图尚未初始化，无法进行 AI 辅助', 'warning')
      return
    }
    if (this.drawingActive) this.cancelCurrentDrawing?.(true)

    this.aiRunning = true
    this.aiError = ''
    this.startAIRecognitionProgress('正在截取当前地图画面')
    try {
      const viewer = window.myViewer.viewer
      viewer.render()
      const canvas = viewer.scene.canvas
      const imageDataUrl = canvas.toDataURL('image/png')
      this.updateAIRecognitionProgress(24, '地图画面已就绪，正在提交识别任务')
      this.updateAIRecognitionProgress(36, `${active.model.name || active.model.id} 正在分析建筑轮廓`)
      const outlines = await recognizeBuildingsWithVisionModel(active.provider, active.model, {
        imageDataUrl,
        maxBuildings: this.aiMaxBuildings
      })
      this.updateAIRecognitionProgress(68, '模型结果已返回，正在解析建筑轮廓')
      const lonlats = this.normalizedOutlinesToLonlats(outlines, canvas)
      if (!lonlats.length) {
        throw new Error('识别轮廓未能投影到当前地图，请确认画面中心位于地球表面')
      }
      this.updateAIRecognitionProgress(78, '轮廓解析完成，正在匹配地图坐标')
      const recognizedCount = await this.appendAIRecognizedBuildings(lonlats, active.model.name || active.model.id)
      this.updateAIRecognitionProgress(100, `识别完成，已生成 ${recognizedCount} 个区域`)
      await sleep(650)
    } catch (error) {
      console.error('vision model assist failed:', error)
      this.aiError = error?.message || 'AI识别失败'
      this.notify?.(this.aiError, 'error')
    } finally {
      this.aiRunning = false
    }
  },

  normalizedOutlinesToLonlats(outlines, canvas) {
    const viewer = window.myViewer?.viewer
    if (!viewer || !Array.isArray(outlines)) return []
    const width = canvas.width || canvas.clientWidth
    const height = canvas.height || canvas.clientHeight

    return outlines
      .map((outline) => {
        if (!isPlausibleVisionOutline(outline.polygon)) return null
        const polygon = []
        for (const point of outline.polygon || []) {
          const screenPoint = new Cesium.Cartesian2(
            (point[0] / 1000) * width,
            (point[1] / 1000) * height
          )
          const ray = viewer.camera.getPickRay(screenPoint)
          const picked = ray && viewer.scene.globe.pick(ray, viewer.scene)
          if (!picked) continue
          const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(picked)
          if (!cartographic) continue
          polygon.push([
            toFixedNumber(Cesium.Math.toDegrees(cartographic.longitude), 6),
            toFixedNumber(Cesium.Math.toDegrees(cartographic.latitude), 6),
            0
          ])
        }
        if (polygon.length < 3) return null
        const first = polygon[0]
        const last = polygon[polygon.length - 1]
        if (first[0] !== last[0] || first[1] !== last[1]) polygon.push([...first])
        return polygon.length >= 4 ? polygon : null
      })
      .filter(Boolean)
  },

  async appendAIRecognizedBuildings(lonlats, modelName = 'AI') {
    const normalized = normalizeSamLonlats(lonlats)
    if (!normalized.length) throw new Error('AI未识别到可用区域')
    this.updateAIRecognitionProgress?.(84, '正在采样地形高程')
    const minHeights = await this.getRealHeight(normalized)
    this.updateAIRecognitionProgress?.(93, '正在生成建筑对象')
    const startId = this.currId

    for (let index = 0; index < normalized.length; index += 1) {
      this.finalData.push({
        id: startId + index,
        name: `${modelName}识别${startId + index + 1}`,
        height: 0,
        extrudeHeight: 40,
        minHeight: minHeights[index] ?? 0,
        style: '1',
        color: '#ffffff',
        lonlats: normalized[index],
        panelShow: false
      })
    }

    this.currId = this.finalData.length
    this.updateAll()
    this.notify?.(`AI识别完成，新增 ${normalized.length} 个区域`, 'success')
    this.$nextTick(() => {
      if (this.$refs.scrollContainer) {
        this.$refs.scrollContainer.scrollTop = this.$refs.scrollContainer.scrollHeight
      }
    })
    return normalized.length
  },

  /**
   * AI 辅助主入口。成功后会把识别结果追加到右侧建筑列表中。
   */
  async useSAM() {
    if (this.aiRunning) return

    if (!window.myViewer?.viewer?.scene?.canvas) {
      this.notify?.('地图尚未初始化，无法进行 AI 辅助', 'warning')
      return
    }

    if (this.drawingActive) {
      this.cancelCurrentDrawing?.(true)
    }

    this.aiRunning = true
    this.aiError = ''
    this.startAIRecognitionProgress('正在截取当前地图画面')
    this.removeSamArtifacts()

    try {
      window.myViewer.viewer.render()
      const dataUrl = window.myViewer.viewer.scene.canvas.toDataURL('image/png')
      this.updateAIRecognitionProgress(24, '地图画面已就绪，正在提交 SAM 任务')

      this.myAIObject = new Sam({
        viewer: window.myViewer,
        data: dataUrl,
        drawGeoShow: false,
        drawCanvasShow: false
      })

      this.updateAIRecognitionProgress(36, 'SAM 正在分割建筑轮廓')
      const lonlats = await this.waitForSamLonlats()
      this.updateAIRecognitionProgress(72, '分割结果已返回，正在解析建筑轮廓')
      const recognizedCount = await this.appendAIRecognizedBuildings(lonlats, 'SAM')
      this.updateAIRecognitionProgress(100, `识别完成，已生成 ${recognizedCount} 个区域`)
      await sleep(650)
    } catch (error) {
      console.error('AI assist failed:', error)
      this.aiError = error?.message || 'AI识别失败'
      this.myAIObject?.loadingHtml?.(false)
      this.notify?.(this.aiError, 'error')
    } finally {
      this.aiRunning = false
      this.removeSamArtifacts()
    }
  },

  async waitForSamLonlats(timeoutMs = 90000, intervalMs = 500) {
    const startAt = Date.now()

    while (Date.now() - startAt < timeoutMs) {
      if (this.myAIObject?.samError) {
        throw new Error(this.myAIObject.samError)
      }

      const rawLonlats = this.myAIObject?.samLonlats
      const lonlats = normalizeSamLonlats(rawLonlats)
      if (lonlats.length > 0) return lonlats
      if (Array.isArray(rawLonlats)) {
        throw new Error('AI未识别到可用区域')
      }
      await sleep(intervalMs)
    }

    throw new Error('AI识别超时，请检查网络后重试')
  },

  /**
   * 使用 Cesium 地形采样为 AI 返回区域补真实高程。
   * 如果网络或地形服务不可用，则自动回退为零高程/已有高程。
   */
  async getRealHeight(lonlats) {
    if (!Array.isArray(lonlats) || lonlats.length === 0) return []

    try {
      const terrain = await Cesium.createWorldTerrainAsync()
      const cartographics = []

      for (const polygon of lonlats) {
        for (const point of polygon) {
          cartographics.push(Cesium.Cartographic.fromDegrees(point[0], point[1]))
        }
      }

      const samples = await Cesium.sampleTerrainMostDetailed(terrain, cartographics)
      const minHeights = []
      let cursor = 0

      for (let polygonIndex = 0; polygonIndex < lonlats.length; polygonIndex += 1) {
        let minHeight = Number.POSITIVE_INFINITY

        for (let pointIndex = 0; pointIndex < lonlats[polygonIndex].length; pointIndex += 1) {
          const height = toFixedNumber(samples[cursor]?.height, 2)
          lonlats[polygonIndex][pointIndex][2] = height
          minHeight = Math.min(minHeight, height)
          cursor += 1
        }

        minHeights.push(Number.isFinite(minHeight) ? minHeight : 0)
      }

      this.samMinHeightResult = minHeights
      return minHeights
    } catch (error) {
      console.warn('terrain sampling failed, fallback to zero heights:', error)
      const minHeights = fallbackHeights(lonlats)
      this.samMinHeightResult = minHeights
      return minHeights
    }
  },

  removeSamArtifacts() {
    const currentImage = document.getElementById('currImg')
    if (currentImage) currentImage.remove()

    const canvas = document.getElementById('sam_canvas')
    if (canvas) canvas.remove()
  }
})

