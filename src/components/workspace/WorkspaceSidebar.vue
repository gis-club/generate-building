<script setup lang="ts">
import {
  Aim,
  ArrowDown,
  ArrowUp,
  Box,
  Download,
  EditPen,
  Fold,
  Grid,
  Hide,
  Location,
  MagicStick,
  MapLocation,
  Operation,
  Plus,
  Refresh,
  Search,
  Setting,
  Upload,
  View,
} from '@element-plus/icons-vue'
import type { BuildingGeometry, VisionProviderConfig, VisualMode, WorkspacePanel } from '@/types/workspace'

const props = defineProps<{
  activePanel: WorkspacePanel
  search: string
  buildings: BuildingGeometry[]
  selectedVisualMode: VisualMode
  sceneModeLabel: string
  aiRunning: boolean
  aiProviders: VisionProviderConfig[]
  aiActiveModelKey: string
  userLabel: string
}>()

const emit = defineEmits<{
  'update:activePanel': [value: WorkspacePanel]
  'update:search': [value: string]
  'update:aiActiveModelKey': [value: string]
  select: [id: number]
  import: []
  'add-layer': []
  draw: []
  north: []
  reset: []
  position: []
  'coming-soon': [label: string]
  'export-json': []
  'export-gltf': []
  'change-scene': []
  'adjust-height': [delta: number]
  'change-visual-mode': [mode: VisualMode]
  'toggle-panels': []
  'open-ai': []
  'run-ai': []
  'change-ai-model': []
}>()

function matchesSearch(...labels: unknown[]) {
  const keyword = props.search.trim().toLowerCase()
  return !keyword || labels.some((label) => String(label ?? '').toLowerCase().includes(keyword))
}

function updateAIModel(value: string) {
  emit('update:aiActiveModelKey', value)
  emit('change-ai-model')
}
</script>

<template>
  <aside class="left-toolbar studio-sidebar" @click.stop>
    <div class="studio-sidebar__header">
      <div>
        <span class="studio-panel-kicker">Workspace</span>
        <h1>{{ activePanel === 'layers' ? '数据与图层' : '空间处理工具' }}</h1>
      </div>
      <el-tag size="small" effect="dark" round class="studio-count-badge">
        {{ activePanel === 'layers' ? buildings.length + 1 : 15 }}
      </el-tag>
    </div>

    <el-segmented
      class="studio-sidebar__tabs"
      :model-value="activePanel"
      :options="[{ label: '图层', value: 'layers' }, { label: '工具', value: 'tools' }]"
      @change="$emit('update:activePanel', $event as WorkspacePanel)"
    />

    <el-input
      class="studio-search"
      :model-value="search"
      :placeholder="activePanel === 'layers' ? '搜索图层' : '搜索处理工具'"
      clearable
      :prefix-icon="Search"
      @update:model-value="$emit('update:search', $event)"
    />

    <div v-if="activePanel === 'layers'" class="studio-sidebar__scroll">
      <section class="studio-section">
        <div class="studio-section__heading">
          <span>地图内容</span>
          <el-button text circle :icon="Plus" title="添加图层" @click="$emit('add-layer')" />
        </div>

        <div v-show="matchesSearch('ArcGIS 卫星影像 底图')" class="studio-layer-row is-basemap">
          <span class="studio-layer-thumb studio-layer-thumb--imagery" />
          <div><strong>ArcGIS 卫星影像</strong><small>影像底图 · 在线</small></div>
          <el-tag size="small" type="info" class="studio-layer-tag">底图</el-tag>
        </div>

        <div
          v-for="item in buildings"
          v-show="matchesSearch(item.name || `建筑 ${item.id + 1}`)"
          :key="`layer-${item.id}`"
          class="studio-layer-row"
          @click="$emit('select', item.id)"
        >
          <span class="studio-layer-thumb" :style="{ background: item.color }"><el-icon><Box /></el-icon></span>
          <div>
            <strong>{{ item.name || `建筑 ${item.id + 1}` }}</strong>
            <small>面要素 · {{ Math.max(item.lonlats.length - 1, 0) }} 个节点</small>
          </div>
          <span class="studio-layer-dot" />
        </div>

        <el-empty v-if="buildings.length === 0" class="studio-empty-layer" description="还没有建筑图层" :image-size="52">
          <el-button type="primary" :icon="EditPen" @click="$emit('draw')">绘制第一个区域</el-button>
        </el-empty>
      </section>

      <section class="studio-section studio-section--actions">
        <div class="studio-section__heading"><span>数据源</span></div>
        <el-button class="studio-action-row" text @click="$emit('import')">
          <span><el-icon><Upload /></el-icon></span><span><strong>导入本地数据</strong><small>GeoJSON / JSON</small></span>
        </el-button>
        <el-button class="studio-action-row" text @click="$emit('add-layer')">
          <span><el-icon><MapLocation /></el-icon></span><span><strong>连接在线图层</strong><small>XYZ / WMTS 服务</small></span>
        </el-button>
      </section>
    </div>

    <div v-else class="studio-sidebar__scroll studio-toolbox">
      <section v-show="matchesSearch('绘制区域 导入 GeoJSON')" class="studio-section">
        <div class="studio-section__heading"><span>最近使用</span></div>
        <div class="studio-recent-grid">
          <el-button plain @click="$emit('draw')"><el-icon><EditPen /></el-icon><span>绘制区域</span></el-button>
          <el-button plain @click="$emit('import')"><el-icon><Upload /></el-icon><span>导入数据</span></el-button>
        </div>
      </section>

      <section v-show="matchesSearch('回到正北 初始位置 自定义位置 图层控制')" class="studio-section">
        <div class="studio-section__heading"><span>地图导航</span><small>4</small></div>
        <el-button v-show="matchesSearch('回到正北')" text class="studio-tool-row" @click="$emit('north')">
          <span><el-icon><Aim /></el-icon></span><span><strong>回到正北</strong><small>校正地图方向</small></span><kbd>N</kbd>
        </el-button>
        <el-button v-show="matchesSearch('初始位置')" text class="studio-tool-row" @click="$emit('reset')">
          <span><el-icon><Refresh /></el-icon></span><span><strong>初始位置</strong><small>回到默认视角</small></span><kbd>H</kbd>
        </el-button>
        <el-button v-show="matchesSearch('自定义位置')" text class="studio-tool-row" @click="$emit('position')">
          <span><el-icon><Location /></el-icon></span><span><strong>定位到坐标</strong><small>WGS84 经纬度</small></span>
        </el-button>
        <el-button v-show="matchesSearch('图层控制')" text class="studio-tool-row" @click="$emit('coming-soon', '图层控制')">
          <span><el-icon><MapLocation /></el-icon></span><span><strong>图层控制</strong><small>可见性与顺序</small></span>
        </el-button>
      </section>

      <section v-show="matchesSearch('导入 导出 GeoJSON glTF 自定义图层')" class="studio-section">
        <div class="studio-section__heading"><span>数据管理</span><small>4</small></div>
        <el-button v-show="matchesSearch('导入 GeoJSON')" text class="studio-tool-row" @click="$emit('import')">
          <span><el-icon><Upload /></el-icon></span><span><strong>导入 GeoJSON</strong><small>添加本地矢量数据</small></span>
        </el-button>
        <el-button v-show="matchesSearch('自定义图层')" text class="studio-tool-row" @click="$emit('add-layer')">
          <span><el-icon><Plus /></el-icon></span><span><strong>添加在线图层</strong><small>连接地图服务</small></span>
        </el-button>
        <el-button v-show="matchesSearch('导出 GeoJSON')" text class="studio-tool-row" @click="$emit('export-json')">
          <span><el-icon><Download /></el-icon></span><span><strong>导出 GeoJSON</strong><small>保存矢量结果</small></span>
        </el-button>
        <el-button v-show="matchesSearch('导出 glTF')" text class="studio-tool-row" @click="$emit('export-gltf')">
          <span><el-icon><Download /></el-icon></span><span><strong>导出 glTF</strong><small>保存三维模型</small></span>
        </el-button>
      </section>

      <section v-show="matchesSearch('场景 高度 模型 线框 隐藏 折叠')" class="studio-section">
        <div class="studio-section__heading"><span>三维建模</span><small>7</small></div>
        <el-button v-show="matchesSearch('切换场景')" text class="studio-tool-row" @click="$emit('change-scene')">
          <span><el-icon><Operation /></el-icon></span><span><strong>切换场景</strong><small>{{ sceneModeLabel }}</small></span>
        </el-button>
        <el-button v-show="matchesSearch('降低整体高度')" text class="studio-tool-row" @click="$emit('adjust-height', -5)">
          <span><el-icon><ArrowDown /></el-icon></span><span><strong>降低整体高度</strong><small>全部建筑 -5m</small></span>
        </el-button>
        <el-button v-show="matchesSearch('升高整体高度')" text class="studio-tool-row" @click="$emit('adjust-height', 5)">
          <span><el-icon><ArrowUp /></el-icon></span><span><strong>升高整体高度</strong><small>全部建筑 +5m</small></span>
        </el-button>
        <el-button v-show="matchesSearch('实体预览 模型')" text class="studio-tool-row" :class="{ 'is-active': selectedVisualMode === 'preview' }" @click="$emit('change-visual-mode', 'preview')">
          <span><el-icon><View /></el-icon></span><span><strong>实体预览</strong><small>显示建筑模型</small></span>
        </el-button>
        <el-button v-show="matchesSearch('线框预览 模型')" text class="studio-tool-row" :class="{ 'is-active': selectedVisualMode === 'wireframe' }" @click="$emit('change-visual-mode', 'wireframe')">
          <span><el-icon><Grid /></el-icon></span><span><strong>线框预览</strong><small>查看模型拓扑</small></span>
        </el-button>
        <el-button v-show="matchesSearch('隐藏模型')" text class="studio-tool-row" :class="{ 'is-active': selectedVisualMode === 'hidden' }" @click="$emit('change-visual-mode', 'hidden')">
          <span><el-icon><Hide /></el-icon></span><span><strong>隐藏模型</strong><small>仅保留底图</small></span>
        </el-button>
        <el-button v-show="matchesSearch('折叠 参数')" text class="studio-tool-row" @click="$emit('toggle-panels')">
          <span><el-icon><Fold /></el-icon></span><span><strong>折叠参数面板</strong><small>整理对象检查器</small></span>
        </el-button>
      </section>

      <section v-show="matchesSearch('AI 智能 建筑识别')" class="studio-section">
        <div class="studio-section__heading"><span>智能处理</span><small>Beta</small></div>
        <el-button text class="studio-tool-row" @click="$emit('open-ai')">
          <span><el-icon><Setting /></el-icon></span><span><strong>模型供应商</strong><small>配置 Endpoint、API Key 与模型目录</small></span>
        </el-button>
        <div class="studio-ai-model-picker">
          <el-select :model-value="aiActiveModelKey" size="small" placeholder="选择视觉模型" @change="updateAIModel">
            <el-option-group v-for="provider in aiProviders.filter((item) => item.enabled)" :key="provider.id" :label="provider.name">
              <el-option
                v-for="model in provider.models.filter((item) => item.enabled && item.vision)"
                :key="`${provider.id}::${model.id}`"
                :label="model.name || model.id"
                :value="`${provider.id}::${model.id}`"
              />
            </el-option-group>
          </el-select>
          <el-button text circle :icon="Setting" title="管理模型供应商" @click="$emit('open-ai')" />
        </div>
        <el-button text class="studio-tool-row studio-tool-row--ai" :class="{ 'is-active': aiRunning }" @click="$emit('run-ai')">
          <span><el-icon><MagicStick /></el-icon></span><span><strong>{{ aiRunning ? 'AI 识别中' : 'AI 建筑识别' }}</strong><small>从影像提取建筑轮廓</small></span>
        </el-button>
      </section>
    </div>

    <div class="studio-sidebar__footer">
      <span class="studio-online-dot" />
      <div><strong>本地工作区</strong><small>{{ userLabel }} · 自动保存</small></div>
    </div>
  </aside>
</template>
