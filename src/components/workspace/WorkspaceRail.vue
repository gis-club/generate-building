<script setup lang="ts">
import { Files, InfoFilled, Operation, Setting, View } from '@element-plus/icons-vue'
import type { WorkspacePanel } from '@/types/workspace'

defineProps<{
  activePanel: WorkspacePanel
  aiActive: boolean
}>()

defineEmits<{
  'update:activePanel': [value: WorkspacePanel]
  'change-scene': []
  'open-ai': []
  info: [event: MouseEvent]
}>()
</script>

<template>
  <nav class="studio-rail" aria-label="工作区导航" @click.stop>
    <div class="studio-rail__main">
      <el-button
        text
        :class="{ 'is-active': activePanel === 'layers' }"
        title="数据与图层"
        @click="$emit('update:activePanel', 'layers')"
      >
        <el-icon><Files /></el-icon><span>图层</span>
      </el-button>
      <el-button
        text
        :class="{ 'is-active': activePanel === 'tools' }"
        title="处理工具"
        @click="$emit('update:activePanel', 'tools')"
      >
        <el-icon><Operation /></el-icon><span>处理</span>
      </el-button>
      <el-button text title="切换场景" @click="$emit('change-scene')">
        <el-icon><View /></el-icon><span>视图</span>
      </el-button>
      <el-button text :class="{ 'is-active': aiActive }" title="AI 模型配置" @click="$emit('open-ai')">
        <el-icon><Setting /></el-icon><span>AI</span>
      </el-button>
    </div>
    <div class="studio-rail__bottom">
      <el-button text title="工作台说明" @click="$emit('info', $event)">
        <el-icon><InfoFilled /></el-icon><span>说明</span>
      </el-button>
    </div>
  </nav>
</template>
