/**
 * 应用入口文件。
 *
 * 这里负责：
 * 1. 创建 Vue 应用实例。
 * 2. 注册 Element Plus 组件库。
 * 3. 注入预览环境下使用的全局兼容方法，保证从旧工程迁移来的代码可以继续运行。
 * 4. 挂载首页视图组件。
 */
import { createApp } from 'vue'
import ElementPlus, { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium'
import * as turf from '@turf/turf'
import * as decomp from 'poly-decomp'
import LZString from 'lz-string'
import proj4 from 'proj4'
import HomeView from './views/HomeView.vue'

/**
 * 兼容旧项目中使用的全局预览标记。
 * 当前仓库已经改造成纯 Vite + Vue + TypeScript 应用，因此默认按本地预览模式运行。
 */
window.__MBS_RECOVERED_PREVIEW__ = true
window.CESIUM_BASE_URL = '/cesium'
window.Cesium = Cesium
window.turf = turf
window.decomp = decomp
window.LZString = LZString
window.proj4 = proj4

/**
 * 兼容旧授权接口调用。
 * 在纯前端预览模式下，这里返回一个固定的“离线预览”结果，避免页面因为缺少桌面端授权服务而中断。
 */
window.yge =
  window.yge ||
  (() =>
    Promise.resolve({
      code: 503,
      data: {
        errorCode: 'preview',
        error: '当前为纯 Vite 预览模式，未连接授权服务。'
      }
    }))

/**
 * 兼容旧代码中的简单加密包装函数。
 * 这里保留原有调用接口，但在纯前端模式下直接原样返回输入值。
 */
window.O9 = window.O9 || ((value) => value)

/**
 * 兼容旧代码中的消息提示函数。
 * 所有历史逻辑仍然可以通过 window.Mx 调用 Element Plus 的消息提示能力。
 */
window.Mx =
  window.Mx ||
  ((options = {}) =>
    ElMessage({
      type: options.type || 'info',
      message: options.title ? `${options.title}: ${options.message}` : options.message || ''
    }))

const app = createApp(HomeView)
app.use(ElementPlus)
app.mount('#app')
