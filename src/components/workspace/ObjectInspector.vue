<script setup lang="ts">
import { ref } from 'vue'
import { Delete, EditPen, Setting } from '@element-plus/icons-vue'
import type { BuildingGeometry } from '@/types/workspace'

defineProps<{
  buildings: BuildingGeometry[]
  height: number
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

const scrollContainer = ref<HTMLElement>()

defineExpose({
  get scrollTop() {
    return scrollContainer.value?.scrollTop ?? 0
  },
  set scrollTop(value: number) {
    if (scrollContainer.value) scrollContainer.value.scrollTop = value
  },
  get scrollHeight() {
    return scrollContainer.value?.scrollHeight ?? 0
  },
})
</script>

<template>
  <aside ref="scrollContainer" class="tool-panel right-toolbar" :style="{ height: `${height}px` }" @click.stop>
    <div class="right-toolbar__header">
      <div class="right-toolbar__title">
        <span class="right-toolbar__eyebrow">Inspector</span>
        <strong>对象检查器</strong>
      </div>
      <el-button text type="primary" class="right-toolbar__toggle" @click="$emit('toggle-panels')">{{ panelToggleText }}</el-button>
    </div>

    <div class="right-toolbar__stats">
      <el-statistic title="建筑" :value="buildings.length" />
      <el-statistic title="轮廓点" :value="pointCount" />
      <el-statistic title="平均高度" :value="averageHeight"><template #suffix>m</template></el-statistic>
    </div>

    <el-empty v-if="buildings.length === 0" class="inspector-empty" description="未选择空间对象" :image-size="72">
      <template #image><el-icon><Setting /></el-icon></template>
      <el-button type="primary" :icon="EditPen" @click="$emit('draw')">绘制区域</el-button>
    </el-empty>

    <el-card v-for="item in buildings" :key="item.id" class="geometry-card" shadow="never" :body-style="{ padding: 0 }">
      <div
        class="geometry-card__title"
        :style="item.panelShow ? { background: `linear-gradient(135deg, ${item.color}, rgba(109, 125, 255, 0.92))`, borderColor: item.color, color: '#ffffff' } : {}"
        @click="$emit('select', item.id)"
      >
        <div class="geometry-card__title-copy">
          <span class="geometry-card__serial">#{{ item.id + 1 }}</span>
          <div><strong>{{ item.name || `几何体 ${item.id + 1}` }}</strong><small>{{ Math.max(item.lonlats.length - 1, 0) }} 个轮廓点</small></div>
        </div>
        <el-button text circle :icon="Delete" class="geometry-card__delete" title="删除对象" @click.stop="$emit('delete', item.id)" />
      </div>

      <div v-show="item.panelShow" class="geometry-card__body">
        <div class="tool-content">
          <div class="tool-content__head"><h4 class="tool-content__tag">基础信息</h4><span class="tool-content__meta">坐标（{{ item.lonlats.length }} 个）</span></div>
          <el-input v-model="item.name" size="small" placeholder="请输入建筑名称" @change="$emit('update')"><template #prepend>名称</template></el-input>
        </div>

        <div class="tool-content tool-content--params">
          <div class="tool-content__head"><h4 class="tool-content__tag">参数设置</h4><span class="tool-content__meta">实时刷新</span></div>
          <div class="params-row">
            <span>底部高度</span>
            <el-input-number v-model="item.height" :precision="0" :step="1" :max="1000" size="small" @change="$emit('update')" @input="$emit('input')" />
          </div>
          <div class="params-row">
            <span>顶部高度</span>
            <el-input-number v-model="item.extrudeHeight" :precision="2" :step="1" :max="1000" size="small" @change="$emit('update')" @input="$emit('input')" />
          </div>
          <div class="params-row">
            <span>选择颜色</span>
            <div class="params-row__color">
              <span class="color-dot" :style="{ background: item.color }" />
              <el-color-picker v-model="item.color" :predefine="predefineColors" size="small" @change="$emit('update')" />
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </aside>
</template>
