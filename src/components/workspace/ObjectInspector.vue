<script setup lang="ts">
import { ref } from 'vue'
import { Delete, EditPen, Setting } from '@element-plus/icons-vue'
import type { BuildingGeometry } from '@/types/workspace'

defineProps<{
  buildings: BuildingGeometry[]
  pointCount: number
  averageHeight: number
  panelToggleText: string
  predefineColors: string[]
}>()

defineEmits<{
  'toggle-panels': []
  draw: []
  select: [id: number]
  delete: [id: number]
  update: []
  input: []
}>()

const scrollContainer = ref<{ wrapRef?: HTMLElement }>()

defineExpose({
  get scrollTop() {
    return scrollContainer.value?.wrapRef?.scrollTop ?? 0
  },
  set scrollTop(value: number) {
    if (scrollContainer.value?.wrapRef) scrollContainer.value.wrapRef.scrollTop = value
  },
  get scrollHeight() {
    return scrollContainer.value?.wrapRef?.scrollHeight ?? 0
  },
})
</script>

<template>
  <el-container class="tool-panel right-toolbar" direction="vertical" @click.stop>
    <el-header class="right-toolbar__header" height="65px">
      <el-space class="right-toolbar__title" direction="vertical" alignment="flex-start" :size="0">
        <el-text class="right-toolbar__eyebrow" size="small">Inspector</el-text>
        <el-text tag="strong">对象检查器</el-text>
      </el-space>
      <el-button text type="primary" class="right-toolbar__toggle" @click="$emit('toggle-panels')">{{ panelToggleText }}</el-button>
    </el-header>

    <el-row class="right-toolbar__stats" :gutter="6">
      <el-col :span="8"><el-statistic title="建筑" :value="buildings.length" /></el-col>
      <el-col :span="8"><el-statistic title="轮廓点" :value="pointCount" /></el-col>
      <el-col :span="8"><el-statistic title="平均高度" :value="averageHeight"><template #suffix>m</template></el-statistic></el-col>
    </el-row>

    <el-scrollbar ref="scrollContainer" class="inspector-scroll">
      <el-space direction="vertical" alignment="stretch" :size="10" fill class="inspector-stack">
        <el-empty v-if="buildings.length === 0" class="inspector-empty" description="未选择空间对象" :image-size="72">
          <template #image><el-icon><Setting /></el-icon></template>
          <el-button type="primary" :icon="EditPen" @click="$emit('draw')">绘制区域</el-button>
        </el-empty>

        <el-card v-for="item in buildings" :key="item.id" class="geometry-card" shadow="never">
          <template #header>
            <el-row
              class="geometry-card__title"
              align="middle"
              justify="space-between"
              :style="item.panelShow ? { background: `linear-gradient(135deg, ${item.color}, rgba(109, 125, 255, 0.92))`, borderColor: item.color, color: '#ffffff' } : {}"
              @click="$emit('select', item.id)"
            >
              <el-space class="geometry-card__title-copy" alignment="center" :size="8">
                <el-tag class="geometry-card__serial" size="small" effect="plain">#{{ item.id + 1 }}</el-tag>
                <el-space direction="vertical" alignment="flex-start" :size="0">
                  <el-text tag="strong">{{ item.name || `几何体 ${item.id + 1}` }}</el-text>
                  <el-text size="small" type="info">{{ Math.max(item.lonlats.length - 1, 0) }} 个轮廓点</el-text>
                </el-space>
              </el-space>
              <el-button text circle :icon="Delete" class="geometry-card__delete" title="删除对象" @click.stop="$emit('delete', item.id)" />
            </el-row>
          </template>

          <el-collapse-transition>
            <el-space v-show="item.panelShow" direction="vertical" alignment="stretch" :size="8" fill class="geometry-card__body">
              <el-card class="tool-content" shadow="never">
                <template #header>
                  <el-row class="tool-content__head" align="middle" justify="space-between">
                    <el-text tag="strong" class="tool-content__tag">基础信息</el-text>
                    <el-tag size="small" effect="plain" class="tool-content__meta">坐标（{{ item.lonlats.length }} 个）</el-tag>
                  </el-row>
                </template>
                <el-input v-model="item.name" size="small" placeholder="请输入建筑名称" @change="$emit('update')"><template #prepend>名称</template></el-input>
              </el-card>

              <el-card class="tool-content tool-content--params" shadow="never">
                <template #header>
                  <el-row class="tool-content__head" align="middle" justify="space-between">
                    <el-text tag="strong" class="tool-content__tag">参数设置</el-text>
                    <el-tag size="small" effect="plain" class="tool-content__meta">实时刷新</el-tag>
                  </el-row>
                </template>
                <el-form label-position="left" label-width="72px" size="small">
                  <el-form-item label="底部高度">
                    <el-input-number v-model="item.height" :precision="0" :step="1" :max="1000" @change="$emit('update')" @input="$emit('input')" />
                  </el-form-item>
                  <el-form-item label="顶部高度">
                    <el-input-number v-model="item.extrudeHeight" :precision="2" :step="1" :max="1000" @change="$emit('update')" @input="$emit('input')" />
                  </el-form-item>
                  <el-form-item label="选择颜色">
                    <el-space alignment="center" :size="8">
                      <el-tag class="color-dot" :style="{ background: item.color }" round>&nbsp;</el-tag>
                      <el-color-picker v-model="item.color" :predefine="predefineColors" @change="$emit('update')" />
                    </el-space>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-space>
          </el-collapse-transition>
        </el-card>
      </el-space>
    </el-scrollbar>
  </el-container>
</template>
