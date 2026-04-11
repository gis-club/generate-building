<template>
  <div class="home-view" @click="showInfo($event, 0)">
    <div id="posList" />
    <input id="fileInput" type="file" accept=".json,.geojson" hidden />

    <template v-if="checkFlag">
      <div id="map" ref="imgBox" class="map-layer" :style="{ height: `${mapDivHeight}px`, width: '100%' }" />
      <div
        id="threeContainer"
        ref="threeContainer"
        class="model-layer"
        :style="{ height: `${mapDivHeight}px`, width: '100%' }"
      />

      <aside class="left-toolbar" @click.stop>
        <div class="left-toolbar__brand">
          <div class="left-toolbar__logo">MBS</div>
          <div class="left-toolbar__divider" />
          <h1>建筑白模工具</h1>
          <strong>v1.0.1</strong>
          <p>联系qq：274113729</p>
        </div>

        <button class="left-tool-btn" @click="handleGoNorth">回到正北</button>
        <button class="left-tool-btn" @click="handleResetHome">初始位置</button>
        <button class="left-tool-btn" @click="showComingSoon('图层控制')">图层控制</button>
        <button class="left-tool-btn" @click="togglePositionPanel">自定义位置</button>
        <button class="left-tool-btn" @click="toggleLayerPanel">自定义图层</button>
        <button class="left-tool-btn" @click="openImportDialog">导入geojson</button>
        <button class="left-tool-btn" @click="exportJson(0)">导出geojson</button>
        <button class="left-tool-btn" @click="exportGltf()">导出gltf</button>
        <button class="left-tool-btn" @click="updateView()">切换场景</button>
        <button class="left-tool-btn" @click="adjustAllHeight(-5)">降低整体高度</button>
        <button class="left-tool-btn" @click="adjustAllHeight(5)">升高整体高度</button>
        <button
          class="left-tool-btn"
          :class="{ 'is-active': selectedVisualMode === 'preview' }"
          @click="setVisualMode('preview')"
        >
          预览模型
        </button>
        <button
          class="left-tool-btn"
          :class="{ 'is-active': selectedVisualMode === 'wireframe' }"
          @click="setVisualMode('wireframe')"
        >
          线框化
        </button>
        <button
          class="left-tool-btn"
          :class="{ 'is-active': selectedVisualMode === 'hidden' }"
          @click="setVisualMode('hidden')"
        >
          隐藏模型
        </button>
        <button
          class="left-tool-btn"
          :class="{ 'is-active': drawingActive }"
          @click="handleDrawArea"
        >
          绘制区域
        </button>
        <button class="left-tool-btn" @click="toggleAllPanels">全部折叠</button>
        <button
          class="left-tool-btn"
          :class="{ 'is-active': aiRunning }"
          @click="handleAIAssist"
        >
          {{ aiRunning ? 'AI识别中' : 'AI辅助' }}
        </button>
      </aside>

      <div class="top-panel" @click.stop>
        <div class="top-panel__links">
          <button @click="showInfo($event, 1)">帮助</button>
          <button @click="showInfo($event, 2)">关于</button>
          <button @click="showInfo($event, 3)">定价</button>
          <button @click="showInfo($event, 4)">定价说明</button>
        </div>

        <div class="top-panel-tag">
          <el-tag effect="dark">注册序号：{{ currUserId }}</el-tag>
          <el-tag effect="dark" type="success">到期时间：{{ currUserEndTime }}</el-tag>
          <el-tag effect="dark" type="warning">使用状态：{{ currUserIsTry }}</el-tag>
        </div>

        <div class="drag" />
      </div>
    </template>

    <div v-if="infoShow1" class="top-info" @click.stop>
      <div class="top">帮助</div>
      <div class="bottom">
        <div class="help-columns">
          <div class="help-column">
            <p>漫游地图：鼠标左键按下拖动</p>
            <p>缩放地图：滚轮控制缩放</p>
            <p>倾斜视角：鼠标中键按下拖动</p>
          </div>
          <div class="help-column">
            <p>绘制区域：左键逐点绘制，双击结束</p>
            <p>编辑顶点：选中点后拖动，右键删除</p>
            <p>插入顶点：双击线段插入新点</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="infoShow2" class="top-info" @click.stop>
      <div class="top">关于</div>
      <div class="bottom">
        <p>软件名称：建筑白模工具</p>
        <p>版本号：v1.0.1</p>
        <p>作者：图界mbs</p>
        <p>B站：https://space.bilibili.com/43506538</p>
        <p>联系 QQ：274113729</p>
        <p>使用状态：{{ currUserIsTry }}</p>
        <p>到期时间：{{ currUserEndTime }}</p>
      </div>
    </div>

    <div v-if="infoShow3" class="top-info" @click.stop>
      <div class="top">定价</div>
      <div class="bottom">
        <ul class="price-list">
          <li><span>月度</span><strong>¥39</strong></li>
          <li><span>季度</span><strong>¥66</strong></li>
          <li><span>年度</span><strong>¥98</strong></li>
        </ul>
        <div class="mbs-price-precautions">
          <p>联系 QQ：274113729 咨询付费</p>
          <p>售后时间：工作日 09:00 - 17:00</p>
        </div>
      </div>
    </div>

    <div v-if="infoShow4" class="top-info" @click.stop>
      <div class="top">定价说明</div>
      <div class="bottom">
        <div class="mbs-price-precautions">
          <p>付款时提供注册序号，一台电脑对应一个序号。</p>
          <p>默认试用 15 天，关注 B 站账号可额外获取试用期。</p>
          <p>后续功能会持续更新，价格以付款时页面展示为准。</p>
        </div>
      </div>
    </div>

    <div v-if="errShow1" class="top-info top-info--warning" @click.stop>
      <div class="top">重要提示</div>
      <div class="bottom">{{ currUserErrorMsg }}</div>
    </div>

    <div
      v-if="downloadProgress > 0 && downloadProgress < 100"
      class="top-info top-info--warning"
      @click.stop
    >
      <div class="top">下载进度</div>
      <div class="bottom">
        <el-progress
          :text-inside="true"
          :stroke-width="20"
          :percentage="downloadProgress"
          :color="downloadProgressColors"
        />
      </div>
    </div>

    <div v-if="leftShow1" class="side-dialog" @click.stop>
      <div class="top">自定义位置</div>
      <div class="bottom">
        <el-form :model="posForm" label-width="92px">
          <el-form-item label="经度[WGS84]">
            <el-input v-model="posForm.lon" placeholder="请输入经度">
              <template #prepend>lon</template>
            </el-input>
          </el-form-item>
          <el-form-item label="纬度[WGS84]">
            <el-input v-model="posForm.lat" placeholder="请输入纬度">
              <template #prepend>lat</template>
            </el-input>
          </el-form-item>
          <el-form-item class="form-actions">
            <el-button type="primary" @click="posFormSubmit">确定</el-button>
            <el-button @click="posFormCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div v-if="leftShow2" class="side-dialog" @click.stop>
      <div class="top">添加自定义图层</div>
      <div class="bottom">
        <el-form :model="layerForm" label-width="70px">
          <el-form-item label="地址">
            <el-input v-model="layerForm.url" placeholder="请输入在线图层地址">
              <template #prepend>url</template>
            </el-input>
          </el-form-item>
          <el-form-item label="图层名称">
            <el-input v-model="layerForm.name" placeholder="请输入图层名称" />
          </el-form-item>
          <el-form-item class="form-actions">
            <el-button type="primary" @click="layerFormSubmit">添加</el-button>
            <el-button @click="layerFormCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <aside
      v-if="finalData.length > 0"
      ref="scrollContainer"
      class="tool-panel right-toolbar"
      :style="{ height: `${mapDivHeight - 70}px` }"
      @click.stop
    >
      <div v-for="item in finalData" :key="item.id" class="geometry-card">
        <div
          class="geometry-card__title"
          :style="item.panelShow ? { background: item.color, borderColor: item.color, color: '#ffffff' } : {}"
          @click="updatePanel(item.id)"
        >
          <span>几何体 {{ item.id + 1 }}</span>
          <button class="geometry-card__delete" @click.stop="deleteSingle(item.id)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <div v-show="item.panelShow" class="geometry-card__body">
          <div class="tool-content">
            <h4 class="tool-content__tag">坐标（{{ item.lonlats.length }} 个）</h4>
            <el-input v-model="item.name" size="small" @change="updateAll">
              <template #prepend>名称</template>
            </el-input>
          </div>

          <div class="tool-content tool-content--params">
            <h4 class="tool-content__tag">配参</h4>
            <div class="params-row">
              <span>底部高度</span>
              <el-input-number
                v-model="item.height"
                :precision="0"
                :step="1"
                :max="1000"
                size="small"
                @change="updateAll"
                @input="updateAllInput"
              />
            </div>

            <div class="params-row">
              <span>顶部高度</span>
              <el-input-number
                v-model="item.extrudeHeight"
                :precision="2"
                :step="1"
                :max="1000"
                size="small"
                @change="updateAll"
                @input="updateAllInput"
              />
            </div>

            <div class="params-row">
              <span>选择颜色</span>
              <el-color-picker
                v-model="item.color"
                :predefine="predefineColors"
                size="small"
                @change="updateAll"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script lang="ts">
import { Delete } from '@element-plus/icons-vue'
import homeViewOptions from './HomeView.logic.ts'

/**
 * 读取组合后的基础状态工厂。
 * 这里保留 Options API 写法，避免一次性重构过大影响现有 Cesium / Three 逻辑。
 */
const createBaseData = homeViewOptions.data

export default {
  ...homeViewOptions,
  components: {
    ...(homeViewOptions.components || {}),
    Delete
  },
  data() {
    /**
     * 先获取逻辑层提供的原始状态，再在视图层补充仅用于界面高亮的字段。
     * `selectedVisualMode` 只负责按钮状态，不直接参与底层几何生成。
     */
    const baseData = typeof createBaseData === 'function' ? createBaseData.call(this) : {}
    return {
      ...baseData,
      selectedVisualMode: 'preview'
    }
  },
  methods: {
    ...(homeViewOptions.methods || {}),
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
      this.useSAM?.()
    },
    /**
     * 一键折叠/展开右侧所有几何配置卡片。
     */
    toggleAllPanels() {
      this.fold(this.allPanelShow)
      this.allPanelShow = !this.allPanelShow
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

<style>
html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.home-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0b1020;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.map-layer,
.model-layer {
  position: absolute;
  inset: 0;
}

.model-layer {
  pointer-events: none;
}

.left-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 184px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 0 0 1px rgba(54, 82, 156, 0.08);
}

.left-toolbar__brand {
  padding: 10px 10px 14px;
  text-align: center;
}

.left-toolbar__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #42d392, #647eff);
  color: #07111f;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 2px;
  box-shadow: 0 18px 30px rgba(66, 211, 146, 0.18);
}

.left-toolbar__divider {
  height: 2px;
  margin-top: 6px;
  background: linear-gradient(90deg, #4ed7b8, #5d75ff);
}

.left-toolbar__brand h1 {
  margin: 12px 0 6px;
  font-size: 19px;
  line-height: 1.3;
  color: #46cdb8;
}

.left-toolbar__brand strong {
  display: block;
  font-size: 17px;
  color: #6b72ff;
}

.left-toolbar__brand p {
  margin: 10px 0 0;
  font-size: 14px;
  color: #d94a78;
}

.left-tool-btn {
  height: 34px;
  padding: 0 14px;
  border: 0;
  border-top: 1px solid #dfdfdf;
  background: rgba(255, 255, 255, 0.9);
  color: #111111;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.left-tool-btn:hover,
.left-tool-btn.is-active {
  background: #1677ff;
  color: #ffffff;
}

.top-panel {
  position: absolute;
  top: 0;
  left: 184px;
  right: 0;
  z-index: 28;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 18px 0 22px;
  background: rgba(255, 255, 255, 0.96);
}

.top-panel__links {
  display: flex;
  gap: 22px;
}

.top-panel__links button {
  border: 0;
  background: transparent;
  color: #111111;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.top-panel-tag {
  display: flex;
  gap: 10px;
}

.top-info,
.side-dialog {
  position: absolute;
  z-index: 40;
  width: 380px;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 20px 60px rgba(10, 20, 60, 0.24);
}

.top-info {
  top: 72px;
  left: 220px;
}

.top-info--warning {
  width: 420px;
}

.side-dialog {
  top: 170px;
  left: 220px;
}

.top-info .top,
.side-dialog .top {
  padding: 14px 18px;
  background: linear-gradient(135deg, #1f6fff, #7346ff);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
}

.top-info .bottom,
.side-dialog .bottom {
  padding: 18px;
  color: #24324b;
  font-size: 14px;
  line-height: 1.8;
}

.help-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.help-column p,
.mbs-price-precautions p,
.top-info .bottom p {
  margin: 0 0 8px;
}

.price-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0 0 14px;
  list-style: none;
}

.price-list li {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  background: #f5f7ff;
  font-weight: 700;
}

.right-toolbar {
  position: absolute;
  top: 58px;
  right: 16px;
  z-index: 26;
  width: 286px;
  padding: 12px 12px 40px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(4px);
}

.geometry-card {
  margin-bottom: 12px;
}

.geometry-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding-left: 12px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.94);
  color: #111111;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.geometry-card__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-right: 6px;
  border: 0;
  border-radius: 50%;
  background: #ff5b2e;
  color: #ffffff;
  cursor: pointer;
}

.geometry-card__body {
  margin-top: 12px;
}

.tool-content {
  margin-bottom: 12px;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  background: rgba(145, 145, 145, 0.78);
}

.tool-content__tag {
  display: inline-block;
  margin: 0 0 12px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.95);
  color: #333333;
  font-size: 14px;
  font-weight: 700;
}

.tool-content--params {
  padding-bottom: 6px;
}

.params-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
}

.params-row .el-input-number {
  width: 126px;
}

.form-actions .el-form-item__content {
  justify-content: flex-end;
}

#mbs-widget1,
#mbs-widget2,
#mbs-widget {
  display: none !important;
}
</style>

