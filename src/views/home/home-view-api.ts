/**
 * 页面生命周期与授权相关方法。
 *
 * 项目已经从 Electron 桌面应用迁移为纯 Vite + Vue + TypeScript 结构，
 * 因此这里不再依赖 preload 或主进程消息，而是直接在浏览器环境下初始化地图和页面状态。
 */
const checkBuildLicense = (payload) => yge('/tools/tools_building/getCheckBuild', payload)
import { defineRecoveredMethods } from '../../lib/recovered-sdk-types.ts'

/**
 * 首页生命周期。
 * 纯前端模式下：created / beforeDestroy 仅保留空壳兼容；mounted 时直接进入本地预览流程。
 */
export const homeViewLifecycleHooks = defineRecoveredMethods({
  created() {},
  beforeDestroy() {},
  mounted() {
    this.checkFlag = true
    this.currUserId = 'preview'
    this.currUserEndTime = '--'
    this.currUserIsTry = '离线预览'

    this.$nextTick(() => {
      if (typeof this.initMapAll === 'function') {
        this.initMapAll(true)
        return
      }

      if (typeof this.resizeWindow === 'function') {
        this.resizeWindow()
      }
    })
  }
})

/**
 * 兼容保留的授权初始化方法。
 * 如果未来重新接入在线授权服务，页面仍然可以通过该方法切换回服务端校验模式。
 */
export const homeViewApiMethods = defineRecoveredMethods({
  initRSA() {
    const info = this.infoArr
    if (info == null) return

    const payload = {
      encryptMac: O9(info[0]),
      encryptCpu: O9(info[1] + '/' + info[2] + '/' + info[3] + '/' + info[4])
    }

    checkBuildLicense(payload).then((response) => {
      if (response.code !== 200) {
        console.log('授权接口连接失败')
        return
      }

      let canUse = true

      if (response.data.id != null) {
        this.currUserId = response.data.id
        this.currUserEndTime = response.data.endTime

        switch (response.data.isTry) {
          case 0:
            this.currUserIsTry = '试用'
            break
          case 1:
            this.currUserIsTry = '会员'
            break
          case 2:
            this.currUserIsTry = '过期'
            canUse = false
            break
          case 3:
            this.currUserIsTry = '暂停使用'
            canUse = false
            break
        }
      }

      if (response.data.errorCode != null) {
        canUse = false
        this.errShow1 = true
        this.currUserErrorMsg = response.data.error
      }

      this.initMapAll(canUse)
    })
  }
})
