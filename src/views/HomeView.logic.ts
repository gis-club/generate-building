import homeViewRecoveredCore from './home/home-view-logic-core.ts'
import homeViewRecoveredFeatures, {
  homeViewRecoveredMethodGroups
} from './home/home-view-logic-features.ts'

/**
 * 首页逻辑总装配文件。
 *
 * 这个文件只做两件事：
 * 1. 聚合基础生命周期与状态。
 * 2. 聚合地图、绘制、导出、AI 等功能方法。
 *
 * 这样 `HomeView.vue` 可以保持专注于模板与交互，而复杂逻辑继续拆分在 `src/views/home` 下。
 */
export const homeViewDependencyLayers = {
  core: Object.keys(homeViewRecoveredCore.methods),
  features: homeViewRecoveredMethodGroups
}

const homeViewOptions = {
  name: 'HomeView',
  components: {},
  data: homeViewRecoveredCore.data,
  created: homeViewRecoveredCore.created,
  beforeDestroy: homeViewRecoveredCore.beforeDestroy,
  beforeUnmount: homeViewRecoveredCore.beforeUnmount,
  mounted: homeViewRecoveredCore.mounted,
  methods: Object.assign({}, homeViewRecoveredCore.methods, homeViewRecoveredFeatures.methods)
}

export default homeViewOptions

