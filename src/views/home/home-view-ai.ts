import { SAMRecovered } from './home-view-lib.ts'

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

export const homeViewAiMethods = {
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
    this.removeSamArtifacts()

    try {
      window.myViewer.viewer.render()
      const dataUrl = window.myViewer.viewer.scene.canvas.toDataURL('image/png')

      this.myAIObject = new SAMRecovered({
        viewer: window.myViewer,
        data: dataUrl,
        drawGeoShow: false,
        drawCanvasShow: false
      })

      const lonlats = await this.waitForSamLonlats()
      const minHeights = await this.getRealHeight(lonlats)
      const startId = this.currId

      for (let index = 0; index < lonlats.length; index += 1) {
        this.finalData.push({
          id: startId + index,
          name: `AI识别${startId + index + 1}`,
          height: 0,
          extrudeHeight: 40,
          minHeight: minHeights[index] ?? 0,
          style: '1',
          color: '#ffffff',
          lonlats: lonlats[index],
          panelShow: false
        })
      }

      this.currId = this.finalData.length
      this.updateAll()
      this.notify?.(`AI识别完成，新增 ${lonlats.length} 个区域`, 'success')

      this.$nextTick(() => {
        if (this.$refs.scrollContainer) {
          this.$refs.scrollContainer.scrollTop = this.$refs.scrollContainer.scrollHeight
        }
      })
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
}

