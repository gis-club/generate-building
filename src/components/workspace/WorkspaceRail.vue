<script setup lang="ts">
import { Files, InfoFilled, Operation, View } from '@element-plus/icons-vue'
import type { WorkspacePanel } from '@/types/workspace'

defineProps<{
  activePanel: WorkspacePanel
}>()

const emit = defineEmits<{
  'update:activePanel': [value: WorkspacePanel]
  'change-scene': []
  info: [event: MouseEvent]
}>()

function handleSelect(index: string) {
  if (index === 'layers' || index === 'tools') emit('update:activePanel', index)
  else if (index === 'scene') emit('change-scene')
}
</script>

<template>
  <el-menu
    class="studio-rail"
    :default-active="activePanel"
    aria-label="工作区导航"
    @select="handleSelect"
    @click.stop
  >
    <el-menu-item index="layers" title="数据与图层">
      <el-icon><Files /></el-icon><template #title>图层</template>
    </el-menu-item>
    <el-menu-item index="tools" title="处理工具">
      <el-icon><Operation /></el-icon><template #title>处理</template>
    </el-menu-item>
    <el-menu-item index="scene" title="切换场景">
      <el-icon><View /></el-icon><template #title>视图</template>
    </el-menu-item>
    <el-menu-item index="info" class="studio-rail__info" title="工作台说明" @click="emit('info', $event as MouseEvent)">
      <el-icon><InfoFilled /></el-icon><template #title>说明</template>
    </el-menu-item>
  </el-menu>
</template>
