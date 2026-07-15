<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon: Component
    title: string
    subtitle: string
    shortcut?: string
    active?: boolean
    kind?: 'action' | 'tool'
  }>(),
  {
    shortcut: '',
    active: false,
    kind: 'tool'
  }
)

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <el-button
    plain
    :class="[kind === 'action' ? 'studio-action-row' : 'studio-tool-row', { 'is-active': active }]"
    @click="$emit('click', $event)"
  >
    <el-row class="workspace-tool-action__row" align="middle">
      <el-col :span="4" class="workspace-tool-action__icon-col">
        <el-icon class="workspace-tool-action__icon"><component :is="icon" /></el-icon>
      </el-col>
      <el-col :span="shortcut ? 17 : 20">
        <el-space class="workspace-tool-action__copy" direction="vertical" alignment="flex-start" :size="0">
          <el-text tag="strong">{{ title }}</el-text>
          <el-text size="small" type="info">{{ subtitle }}</el-text>
        </el-space>
      </el-col>
      <el-col v-if="shortcut" :span="3" class="workspace-tool-action__shortcut-col">
        <el-tag size="small" effect="plain">{{ shortcut }}</el-tag>
      </el-col>
    </el-row>
  </el-button>
</template>
