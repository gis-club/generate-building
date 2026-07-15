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
import WorkspaceToolAction from './WorkspaceToolAction.vue'

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
  <el-container class="left-toolbar studio-sidebar" direction="vertical" @click.stop>
    <el-header class="studio-sidebar__header" height="66px">
      <el-space direction="vertical" alignment="flex-start" :size="0">
        <el-text class="studio-panel-kicker" size="small">Workspace</el-text>
        <el-text tag="h1">{{ activePanel === 'layers' ? '数据与图层' : '空间处理工具' }}</el-text>
      </el-space>
      <el-tag size="small" effect="dark" round class="studio-count-badge">
        {{ activePanel === 'layers' ? buildings.length + 1 : 15 }}
      </el-tag>
    </el-header>

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

    <el-scrollbar v-if="activePanel === 'layers'" class="studio-sidebar__scroll">
      <el-card class="studio-section" shadow="never" :body-style="{ padding: 0 }">
        <el-row class="studio-section__heading" align="middle" justify="space-between">
          <el-text>地图内容</el-text>
          <el-button text circle :icon="Plus" title="添加图层" @click="$emit('add-layer')" />
        </el-row>

        <el-card v-show="matchesSearch('ArcGIS 卫星影像 底图')" class="studio-layer-row is-basemap" shadow="never">
          <el-row class="studio-layer-row__content" align="middle" :gutter="8">
            <el-col :span="5"><el-avatar class="studio-layer-thumb studio-layer-thumb--imagery" shape="square" :size="38" /></el-col>
            <el-col :span="14">
              <el-space direction="vertical" alignment="flex-start" :size="0">
                <el-text tag="strong">ArcGIS 卫星影像</el-text><el-text size="small" type="info">影像底图 · 在线</el-text>
              </el-space>
            </el-col>
            <el-col :span="5"><el-tag size="small" type="info" class="studio-layer-tag">底图</el-tag></el-col>
          </el-row>
        </el-card>

        <el-card
          v-for="item in buildings"
          v-show="matchesSearch(item.name || `建筑 ${item.id + 1}`)"
          :key="`layer-${item.id}`"
          class="studio-layer-row"
          shadow="never"
          @click="$emit('select', item.id)"
        >
          <el-row class="studio-layer-row__content" align="middle" :gutter="8">
            <el-col :span="5"><el-avatar class="studio-layer-thumb" shape="square" :size="38" :style="{ background: item.color }"><el-icon><Box /></el-icon></el-avatar></el-col>
            <el-col :span="17">
              <el-space direction="vertical" alignment="flex-start" :size="0">
                <el-text tag="strong">{{ item.name || `建筑 ${item.id + 1}` }}</el-text>
                <el-text size="small" type="info">面要素 · {{ Math.max(item.lonlats.length - 1, 0) }} 个节点</el-text>
              </el-space>
            </el-col>
            <el-col :span="2"><el-badge is-dot type="success" class="studio-layer-dot" /></el-col>
          </el-row>
        </el-card>

        <el-empty v-if="buildings.length === 0" class="studio-empty-layer" description="还没有建筑图层" :image-size="52">
          <el-button type="primary" :icon="EditPen" @click="$emit('draw')">绘制第一个区域</el-button>
        </el-empty>
      </el-card>

      <el-card class="studio-section studio-section--actions" shadow="never" :body-style="{ padding: 0 }">
        <el-row class="studio-section__heading" align="middle"><el-text>数据源</el-text></el-row>
        <WorkspaceToolAction kind="action" :icon="Upload" title="导入本地数据" subtitle="GeoJSON / JSON" @click="$emit('import')" />
        <WorkspaceToolAction kind="action" :icon="MapLocation" title="连接在线图层" subtitle="XYZ / WMTS 服务" @click="$emit('add-layer')" />
      </el-card>
    </el-scrollbar>

    <el-scrollbar v-else class="studio-sidebar__scroll studio-toolbox">
      <el-card v-show="matchesSearch('绘制区域 导入 GeoJSON')" class="studio-section" shadow="never" :body-style="{ padding: 0 }">
        <el-row class="studio-section__heading" align="middle"><el-text>最近使用</el-text></el-row>
        <el-row class="studio-recent-grid" :gutter="6">
          <el-col :span="12"><el-button plain @click="$emit('draw')"><el-icon><EditPen /></el-icon><span>绘制区域</span></el-button></el-col>
          <el-col :span="12"><el-button plain @click="$emit('import')"><el-icon><Upload /></el-icon><span>导入数据</span></el-button></el-col>
        </el-row>
      </el-card>

      <el-card v-show="matchesSearch('回到正北 初始位置 自定义位置 图层控制')" class="studio-section" shadow="never" :body-style="{ padding: 0 }">
        <el-row class="studio-section__heading" align="middle" justify="space-between"><el-text>地图导航</el-text><el-tag size="small" effect="plain">4</el-tag></el-row>
        <WorkspaceToolAction v-show="matchesSearch('回到正北')" :icon="Aim" title="回到正北" subtitle="校正地图方向" shortcut="N" @click="$emit('north')" />
        <WorkspaceToolAction v-show="matchesSearch('初始位置')" :icon="Refresh" title="初始位置" subtitle="回到默认视角" shortcut="H" @click="$emit('reset')" />
        <WorkspaceToolAction v-show="matchesSearch('自定义位置')" :icon="Location" title="定位到坐标" subtitle="WGS84 经纬度" @click="$emit('position')" />
        <WorkspaceToolAction v-show="matchesSearch('图层控制')" :icon="MapLocation" title="图层控制" subtitle="可见性与顺序" @click="$emit('coming-soon', '图层控制')" />
      </el-card>

      <el-card v-show="matchesSearch('导入 导出 GeoJSON glTF 自定义图层')" class="studio-section" shadow="never" :body-style="{ padding: 0 }">
        <el-row class="studio-section__heading" align="middle" justify="space-between"><el-text>数据管理</el-text><el-tag size="small" effect="plain">4</el-tag></el-row>
        <WorkspaceToolAction v-show="matchesSearch('导入 GeoJSON')" :icon="Upload" title="导入 GeoJSON" subtitle="添加本地矢量数据" @click="$emit('import')" />
        <WorkspaceToolAction v-show="matchesSearch('自定义图层')" :icon="Plus" title="添加在线图层" subtitle="连接地图服务" @click="$emit('add-layer')" />
        <WorkspaceToolAction v-show="matchesSearch('导出 GeoJSON')" :icon="Download" title="导出 GeoJSON" subtitle="保存矢量结果" @click="$emit('export-json')" />
        <WorkspaceToolAction v-show="matchesSearch('导出 glTF')" :icon="Download" title="导出 glTF" subtitle="保存三维模型" @click="$emit('export-gltf')" />
      </el-card>

      <el-card v-show="matchesSearch('场景 高度 模型 线框 隐藏 折叠')" class="studio-section" shadow="never" :body-style="{ padding: 0 }">
        <el-row class="studio-section__heading" align="middle" justify="space-between"><el-text>三维建模</el-text><el-tag size="small" effect="plain">7</el-tag></el-row>
        <WorkspaceToolAction v-show="matchesSearch('切换场景')" :icon="Operation" title="切换场景" :subtitle="sceneModeLabel" @click="$emit('change-scene')" />
        <WorkspaceToolAction v-show="matchesSearch('降低整体高度')" :icon="ArrowDown" title="降低整体高度" subtitle="全部建筑 -5m" @click="$emit('adjust-height', -5)" />
        <WorkspaceToolAction v-show="matchesSearch('升高整体高度')" :icon="ArrowUp" title="升高整体高度" subtitle="全部建筑 +5m" @click="$emit('adjust-height', 5)" />
        <WorkspaceToolAction v-show="matchesSearch('实体预览 模型')" :icon="View" title="实体预览" subtitle="显示建筑模型" :active="selectedVisualMode === 'preview'" @click="$emit('change-visual-mode', 'preview')" />
        <WorkspaceToolAction v-show="matchesSearch('线框预览 模型')" :icon="Grid" title="线框预览" subtitle="查看模型拓扑" :active="selectedVisualMode === 'wireframe'" @click="$emit('change-visual-mode', 'wireframe')" />
        <WorkspaceToolAction v-show="matchesSearch('隐藏模型')" :icon="Hide" title="隐藏模型" subtitle="仅保留底图" :active="selectedVisualMode === 'hidden'" @click="$emit('change-visual-mode', 'hidden')" />
        <WorkspaceToolAction v-show="matchesSearch('折叠 参数')" :icon="Fold" title="折叠参数面板" subtitle="整理对象检查器" @click="$emit('toggle-panels')" />
      </el-card>

      <el-card v-show="matchesSearch('AI 智能 建筑识别')" class="studio-ai-card" shadow="never">
        <template #header>
          <el-row align="middle" justify="space-between" class="studio-ai-card__header">
            <el-text tag="strong">智能处理</el-text>
            <el-tag size="small" type="info" effect="plain">Beta</el-tag>
          </el-row>
        </template>

        <el-space direction="vertical" alignment="stretch" :size="8" fill class="studio-ai-stack">
          <el-button plain class="studio-ai-action" @click="$emit('open-ai')">
            <el-row align="middle" class="studio-ai-action__row">
              <el-col :span="4"><el-icon class="studio-ai-action__icon"><Setting /></el-icon></el-col>
              <el-col :span="20">
                <el-space direction="vertical" alignment="flex-start" :size="0" class="studio-ai-action__copy">
                  <el-text tag="strong">模型供应商</el-text>
                  <el-text size="small" type="info">配置 Endpoint、API Key 与模型目录</el-text>
                </el-space>
              </el-col>
            </el-row>
          </el-button>

          <el-row :gutter="8" align="middle" class="studio-ai-model-row">
            <el-col :span="20">
              <el-select :model-value="aiActiveModelKey" placeholder="选择视觉模型" @change="updateAIModel">
                <el-option-group v-for="provider in aiProviders.filter((item) => item.enabled)" :key="provider.id" :label="provider.name">
                  <el-option
                    v-for="model in provider.models.filter((item) => item.enabled && item.vision)"
                    :key="`${provider.id}::${model.id}`"
                    :label="model.name || model.id"
                    :value="`${provider.id}::${model.id}`"
                  />
                </el-option-group>
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button circle :icon="Setting" title="管理模型供应商" @click="$emit('open-ai')" />
            </el-col>
          </el-row>

          <el-button plain class="studio-ai-action studio-ai-action--primary" :loading="aiRunning" @click="$emit('run-ai')">
            <el-row align="middle" class="studio-ai-action__row">
              <el-col :span="4"><el-icon class="studio-ai-action__icon"><MagicStick /></el-icon></el-col>
              <el-col :span="20">
                <el-space direction="vertical" alignment="flex-start" :size="0" class="studio-ai-action__copy">
                  <el-text tag="strong">{{ aiRunning ? 'AI 识别中' : 'AI 建筑识别' }}</el-text>
                  <el-text size="small" type="info">从影像提取建筑轮廓</el-text>
                </el-space>
              </el-col>
            </el-row>
          </el-button>
        </el-space>
      </el-card>
    </el-scrollbar>

    <el-footer class="studio-sidebar__footer" height="52px">
      <span class="studio-online-dot" />
      <el-space direction="vertical" alignment="flex-start" :size="0">
        <el-text tag="strong">本地工作区</el-text>
        <el-text size="small" type="info">{{ userLabel }} · 自动保存</el-text>
      </el-space>
    </el-footer>
  </el-container>
</template>
