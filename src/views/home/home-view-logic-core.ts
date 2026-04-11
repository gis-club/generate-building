import { createHomeViewRecoveredData } from './home-view-data.ts'
import { homeViewLifecycleHooks, homeViewApiMethods } from './home-view-api.ts'

/**
 * 首页逻辑核心层：
 * - 负责 data 初始化
 * - 负责页面生命周期
 * - 负责基础 API 方法挂载
 */
export { createHomeViewRecoveredData, homeViewLifecycleHooks, homeViewApiMethods }

export const homeViewRecoveredCore = {
  data: createHomeViewRecoveredData,
  created: homeViewLifecycleHooks.created,
  beforeDestroy: homeViewLifecycleHooks.beforeDestroy,
  beforeUnmount: homeViewLifecycleHooks.beforeDestroy,
  mounted: homeViewLifecycleHooks.mounted,
  methods: homeViewApiMethods
}

export default homeViewRecoveredCore

