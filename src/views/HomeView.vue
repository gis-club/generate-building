<template>
  <main class="home-view" @click="showInfo($event, 0)">
    <div class="home-view__ambient home-view__ambient--teal" />
    <div class="home-view__ambient home-view__ambient--violet" />
    <div class="home-view__mesh" />
    <div id="posList" />
    <input id="fileInput" type="file" accept=".json,.geojson" hidden />

    <template v-if="checkFlag">
      <div id="map" ref="imgBox" class="map-layer" :style="{ height: mapDivHeight + 'px', width: '100%' }" />
      <div id="threeContainer" ref="threeContainer" class="model-layer" :style="{ height: mapDivHeight + 'px', width: '100%' }" />

      <StudioHeader
        :building-count="finalData.length"
        :point-count="pointCount"
        :scene-mode-label="sceneModeLabel"
        @import="openImportDialog"
        @export="exportJson(0)"
        @help="showInfo($event, 1)"
        @about="showInfo($event, 2)"
      />

      <WorkspaceRail
        v-model:active-panel="activeWorkspacePanel"
        :ai-active="aiRunning || aiProviderDialogVisible"
        @change-scene="updateView"
        @open-ai="openAIWorkspace"
        @info="showInfo($event, 4)"
      />

      <WorkspaceSidebar
        v-model:active-panel="activeWorkspacePanel"
        v-model:search="toolSearch"
        v-model:ai-active-model-key="aiActiveModelKey"
        :buildings="finalData"
        :selected-visual-mode="selectedVisualMode"
        :scene-mode-label="sceneModeLabel"
        :ai-running="aiRunning"
        :ai-providers="aiProviders"
        :user-label="currUserIsTry"
        @select="updatePanel"
        @import="openImportDialog"
        @add-layer="toggleLayerPanel"
        @draw="handleDrawArea"
        @north="handleGoNorth"
        @reset="handleResetHome"
        @position="togglePositionPanel"
        @coming-soon="showComingSoon"
        @export-json="exportJson(0)"
        @export-gltf="exportGltf"
        @change-scene="updateView"
        @adjust-height="adjustAllHeight"
        @change-visual-mode="setVisualMode"
        @toggle-panels="toggleAllPanels"
        @open-ai="openAIProviderManager"
        @run-ai="handleAIAssist"
        @change-ai-model="onActiveAIModelChange"
      />

      <MapWorkspaceControls
        :drawing-active="drawingActive"
        :building-count="finalData.length"
        :point-count="pointCount"
        :visual-mode-label="visualModeLabel"
        :average-height="averageExtrudeHeight"
        :scene-mode-label="sceneModeLabel"
        @reset="handleResetHome"
        @north="handleGoNorth"
        @draw="handleDrawArea"
        @position="togglePositionPanel"
      />
    </template>

    <AIRecognitionProgress
      :running="aiRunning"
      :percentage="aiProgress"
      :stage="aiProgressStage"
      :model-label="activeAIModelLabel"
      :started-at="aiProgressStartedAt"
    />

    <WorkspaceFeedback
      :help-visible="infoShow1"
      :about-visible="infoShow2"
      :pricing-visible="infoShow3"
      :info-visible="infoShow4"
      :error-visible="errShow1"
      :error-message="currUserErrorMsg"
      :download-progress="downloadProgress"
      :download-progress-colors="downloadProgressColors"
    />

    <WorkspaceDialogs
      :position-visible="leftShow1"
      :layer-visible="leftShow2"
      :position-form="posForm"
      :layer-form="layerForm"
      @submit-position="posFormSubmit"
      @cancel-position="posFormCancel"
      @submit-layer="layerFormSubmit"
      @cancel-layer="layerFormCancel"
    />

    <ObjectInspector
      ref="scrollContainer"
      :buildings="finalData"
      :height="mapDivHeight - 70"
      :point-count="pointCount"
      :average-height="averageExtrudeHeight"
      :panel-toggle-text="panelToggleText"
      :predefine-colors="predefineColors"
      @toggle-panels="toggleAllPanels"
      @draw="handleDrawArea"
      @select="updatePanel"
      @delete="deleteSingle"
      @update="updateAll"
      @input="updateAllInput"
    />

    <AIProviderDialog
      v-model:visible="aiProviderDialogVisible"
      v-model:new-provider-template="aiNewProviderTemplate"
      v-model:active-model-key="aiActiveModelKey"
      v-model:max-buildings="aiMaxBuildings"
      :providers="aiProviders"
      :templates="aiProviderTemplates"
      :busy-provider-id="aiProviderBusyId"
      @save="saveAIProviderSettings"
      @add-provider="addAIProvider"
      @remove-provider="removeAIProvider"
      @test-provider="testAIProvider"
      @discover-models="discoverAIModels"
      @add-model="addAIModel"
      @remove-model="removeAIModel"
      @change-model="onActiveAIModelChange"
    />
  </main>
</template>

<script lang="ts">
import AIProviderDialog from '@/components/workspace/AIProviderDialog.vue'
import AIRecognitionProgress from '@/components/workspace/AIRecognitionProgress.vue'
import MapWorkspaceControls from '@/components/workspace/MapWorkspaceControls.vue'
import ObjectInspector from '@/components/workspace/ObjectInspector.vue'
import StudioHeader from '@/components/workspace/StudioHeader.vue'
import WorkspaceDialogs from '@/components/workspace/WorkspaceDialogs.vue'
import WorkspaceFeedback from '@/components/workspace/WorkspaceFeedback.vue'
import WorkspaceRail from '@/components/workspace/WorkspaceRail.vue'
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar.vue'
import homeViewOptions from './HomeView.logic.ts'
import { listActiveVisionModels } from '../lib/ai/vision-provider-registry.ts'

/**
 * 读取组合后的基础状态工厂。
 * 这里保留 Options API 写法，避免一次性重构过大影响现有 Cesium / Three 逻辑。
 */
const createBaseData = homeViewOptions.data

export default {
  ...homeViewOptions,
  components: {
    ...(homeViewOptions.components || {}),
    AIProviderDialog,
    AIRecognitionProgress,
    MapWorkspaceControls,
    ObjectInspector,
    StudioHeader,
    WorkspaceDialogs,
    WorkspaceFeedback,
    WorkspaceRail,
    WorkspaceSidebar
  },
  data() {
    /**
     * 先获取逻辑层提供的原始状态，再在视图层补充仅用于界面高亮的字段。
     * `selectedVisualMode` 只负责按钮状态，不直接参与底层几何生成。
     */
    const baseData = typeof createBaseData === 'function' ? createBaseData.call(this) : {}
    return {
      ...baseData,
      selectedVisualMode: 'preview',
      activeWorkspacePanel: 'layers',
      toolSearch: ''
    }
  },
  computed: {
    aiModelOptions() {
      return listActiveVisionModels(this.aiProviders || [])
    },
    activeAIModelLabel() {
      return this.aiModelOptions.find((item) => item.key === this.aiActiveModelKey)?.modelName || '未选择模型'
    },
    pointCount() {
      if (!Array.isArray(this.finalData)) return 0
      return this.finalData.reduce((total, item) => total + Math.max((item.lonlats?.length || 1) - 1, 0), 0)
    },
    averageExtrudeHeight() {
      if (!Array.isArray(this.finalData) || this.finalData.length === 0) return 0
      const total = this.finalData.reduce((sum, item) => sum + Number(item.extrudeHeight || 0), 0)
      return Math.round(total / this.finalData.length)
    },
    visualModeLabel() {
      if (this.selectedVisualMode === 'wireframe') return '线框预览'
      if (this.selectedVisualMode === 'hidden') return '隐藏模型'
      return '实体预览'
    },
    sceneModeLabel() {
      return this.sceneFlag ? '地球场景' : '纯净背景'
    },
    panelToggleText() {
      return this.allPanelShow ? '全部收起' : '展开全部'
    }
  },
  methods: {
    ...(homeViewOptions.methods || {}),
    matchesSearch(...labels) {
      const keyword = String(this.toolSearch || '').trim().toLowerCase()
      if (!keyword) return true
      return labels.some((label) => String(label || '').toLowerCase().includes(keyword))
    },
    /**
     * 关闭顶部说明类浮层。
     * 左侧工具面板切换前统一调用，避免多个面板叠在一起。
     */
    closeFloatPanels() {
      this.infoShow1 = false
      this.infoShow2 = false
      this.infoShow3 = false
      this.infoShow4 = false
    },
    triggerResize() {
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    /**
     * 相机快速回正北方向，方便用户重新建立方向感。
     */
    handleGoNorth() {
      const homePos = this.baseWidgetObject?.homePos || this.homePos
      if (!window.myViewer?.locationCenter || !homePos?.pos) return

      window.myViewer.locationCenter({
        pos: homePos.pos,
        headingAngle: 0,
        pitchAngle: homePos.pitch ?? -90,
        distance: homePos.distance ?? 4000
      })
    },
    /**
     * 回到初始视角。
     * 优先使用运行时小部件记录的位置，其次退回页面默认 homePos。
     */
    handleResetHome() {
      const homePos = this.baseWidgetObject?.homePos || this.homePos
      if (!window.myViewer?.locationCenter || !homePos?.pos) return

      window.myViewer.locationCenter({
        pos: homePos.pos,
        headingAngle: homePos.heading ?? 0,
        pitchAngle: homePos.pitch ?? -90,
        distance: homePos.distance ?? 4000
      })
    },
    /**
     * 展开/收起“自定义位置”面板。
     */
    togglePositionPanel() {
      this.closeFloatPanels()
      this.leftShow1 = !this.leftShow1
      this.leftShow2 = false
      this.triggerResize()
    },
    /**
     * 展开/收起“自定义图层”面板。
     */
    toggleLayerPanel() {
      this.closeFloatPanels()
      this.leftShow1 = false
      this.leftShow2 = !this.leftShow2
      this.triggerResize()
    },
    /**
     * 触发隐藏文件输入框，导入 GeoJSON。
     */
    openImportDialog() {
      const fileInput = document.getElementById('fileInput')
      if (fileInput) fileInput.click()
    },
    /**
     * 统一消息提示出口，兼容旧逻辑中的 `window.Mx`。
     */
    notify(message, type = 'info') {
      if (typeof window.Mx === 'function') {
        window.Mx({ type, message })
      }
    },
    /**
     * 绘制区域按钮逻辑：
     * - 再次点击时取消当前绘制；
     * - 首次点击时进入多边形测绘状态。
     */
    handleDrawArea() {
      if (this.drawingActive) {
        this.cancelCurrentDrawing?.()
        return
      }

      this.closeFloatPanels()
      this.leftShow1 = false
      this.leftShow2 = false
      this.update?.(0)
      this.notify('左键逐点绘制，双击完成区域', 'success')
    },
    /**
     * AI 辅助入口。
     * 如果 AI 正在处理，则仅做提示，避免重复发起请求。
     */
    handleAIAssist() {
      if (this.aiRunning) {
        this.notify('AI识别进行中，请稍候', 'info')
        return
      }

      this.closeFloatPanels()
      this.leftShow1 = false
      this.leftShow2 = false
      this.useActiveAIModel?.()
    },
    /**
     * 竖向活动栏的 AI 入口只负责打开模型中心；任何模型都必须由用户主动选择。
     */
    openAIWorkspace() {
      if (this.aiRunning) {
        this.notify('AI识别进行中，请稍候', 'info')
        return
      }

      this.activeWorkspacePanel = 'tools'
      this.toolSearch = 'AI'
      this.closeFloatPanels()
      this.leftShow1 = false
      this.leftShow2 = false
      this.openAIProviderManager?.()
    },
    /**
     * 一键折叠/展开右侧所有几何配置卡片。
     */
    toggleAllPanels() {
      const next = !this.allPanelShow
      this.fold(next)
      this.allPanelShow = next
    },
    /**
     * 切换模型显示模式。
     * `preview`：正常实体
     * `wireframe`：线框
     * `hidden`：隐藏建筑，仅保留底图与编辑数据
     */
    setVisualMode(mode) {
      this.selectedVisualMode = mode

      if (mode === 'preview') {
        this.modelMode = undefined
        this.highlightButton?.('预览模型')
        this.genBuild?.()
        return
      }

      if (mode === 'wireframe') {
        this.modelMode = 'vertex'
        this.highlightButton?.('线框化')
        this.vertexBuild?.()
        return
      }

      this.modelMode = 'hidden'
      this.highlightButton?.('隐藏模型')
      this.updateAll?.()
    },
    /**
     * 暂未接入的按钮统一提示。
     */
    showComingSoon(label) {
      if (typeof window.Mx === 'function') {
        window.Mx({ type: 'info', message: `${label} 暂未接入，当前先保留静态界面。` })
      }
    }
  }
}
</script>

<style src="../styles/workspace.css"></style>
