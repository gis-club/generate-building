<script setup lang="ts">
import { Download, HelpFilled, InfoFilled, Moon, Sunny, Upload } from '@element-plus/icons-vue'

defineProps<{
  buildingCount: number
  pointCount: number
  sceneModeLabel: string
  themeMode: 'light' | 'dark'
}>()

defineEmits<{
  import: []
  export: []
  help: [event: MouseEvent]
  about: [event: MouseEvent]
  'toggle-theme': []
}>()
</script>

<template>
  <el-row class="studio-header" align="middle" :wrap="false" @click.stop>
    <el-space class="studio-brand" alignment="center" :size="10">
      <el-avatar class="studio-brand__mark" shape="square" :size="32">G</el-avatar>
      <el-space class="studio-brand__copy" direction="vertical" alignment="flex-start" :size="0">
        <el-text tag="strong">GeoBuild</el-text>
        <el-text size="small" type="info">空间建模工作台</el-text>
      </el-space>
    </el-space>

    <el-space class="studio-breadcrumb" alignment="center" :size="10">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>工作空间</el-breadcrumb-item>
        <el-breadcrumb-item>建筑白模生成</el-breadcrumb-item>
      </el-breadcrumb>
      <el-tag class="studio-save-state" size="small" type="success" effect="plain" round>已保存</el-tag>
    </el-space>

    <el-space class="studio-header__summary" alignment="center" :size="8">
      <el-tag size="small" effect="plain"><b>{{ buildingCount }}</b>&nbsp;个建筑</el-tag>
      <el-tag size="small" effect="plain"><b>{{ pointCount }}</b>&nbsp;个轮廓点</el-tag>
      <el-tag size="small" effect="plain">{{ sceneModeLabel }}</el-tag>
    </el-space>

    <el-space class="studio-header__actions" alignment="center" :size="6">
      <el-button
        class="studio-icon-btn studio-theme-toggle"
        circle
        :icon="themeMode === 'dark' ? Sunny : Moon"
        :title="themeMode === 'dark' ? '切换到亮色主题' : '切换到暗色主题'"
        :aria-label="themeMode === 'dark' ? '切换到亮色主题' : '切换到暗色主题'"
        data-testid="theme-toggle"
        @click="$emit('toggle-theme')"
      />
      <el-button class="studio-header-btn" :icon="Upload" @click="$emit('import')">导入</el-button>
      <el-button class="studio-header-btn studio-header-btn--primary" type="primary" :icon="Download" @click="$emit('export')">
        导出
      </el-button>
      <el-button class="studio-icon-btn" circle :icon="HelpFilled" title="帮助" @click="$emit('help', $event)" />
      <el-button class="studio-icon-btn" circle :icon="InfoFilled" title="关于" @click="$emit('about', $event)" />
    </el-space>
  </el-row>
</template>
