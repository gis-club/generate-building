import { homeViewMapInitMethods } from './home-view-map-init.ts'
import { homeViewDrawEditMethods } from './home-view-draw-edit.ts'
import { homeViewExportMethods } from './home-view-export.ts'
import { homeViewAiMethods } from './home-view-ai.ts'

/**
 * 首页功能层聚合：
 * - 地图初始化
 * - 区域绘制与编辑
 * - 数据导入导出
 * - AI 辅助识别
 */
export { homeViewMapInitMethods, homeViewDrawEditMethods, homeViewExportMethods, homeViewAiMethods }

export const homeViewRecoveredMethodGroups = {
  mapInit: Object.keys(homeViewMapInitMethods),
  drawEdit: Object.keys(homeViewDrawEditMethods),
  export: Object.keys(homeViewExportMethods),
  ai: Object.keys(homeViewAiMethods)
}

export const homeViewRecoveredFeatureMethods = Object.assign(
  {},
  homeViewMapInitMethods,
  homeViewDrawEditMethods,
  homeViewExportMethods,
  homeViewAiMethods
)

export const homeViewRecoveredFeatures = {
  methods: homeViewRecoveredFeatureMethods,
  methodGroups: homeViewRecoveredMethodGroups
}

export default homeViewRecoveredFeatures

