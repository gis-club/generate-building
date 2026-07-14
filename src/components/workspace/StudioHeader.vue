<script setup lang="ts">
import { Download, HelpFilled, InfoFilled, Upload } from '@element-plus/icons-vue'

defineProps<{
  buildingCount: number
  pointCount: number
  sceneModeLabel: string
}>()

defineEmits<{
  import: []
  export: []
  help: [event: MouseEvent]
  about: [event: MouseEvent]
}>()
</script>

<template>
  <header class="studio-header" @click.stop>
    <div class="studio-brand">
      <div class="studio-brand__mark"><span>G</span></div>
      <div class="studio-brand__copy">
        <strong>GeoBuild</strong>
        <span>空间建模工作台</span>
      </div>
    </div>

    <div class="studio-breadcrumb">
      <span>工作空间</span>
      <b>/</b>
      <strong>建筑白模生成</strong>
      <span class="studio-save-state"><i /> 已保存</span>
    </div>

    <div class="studio-header__summary">
      <span><b>{{ buildingCount }}</b> 个建筑</span>
      <span><b>{{ pointCount }}</b> 个轮廓点</span>
      <span>{{ sceneModeLabel }}</span>
    </div>

    <div class="studio-header__actions">
      <el-button class="studio-header-btn" :icon="Upload" @click="$emit('import')">导入</el-button>
      <el-button class="studio-header-btn studio-header-btn--primary" type="primary" :icon="Download" @click="$emit('export')">
        导出
      </el-button>
      <el-button class="studio-icon-btn" circle :icon="HelpFilled" title="帮助" @click="$emit('help', $event)" />
      <el-button class="studio-icon-btn" circle :icon="InfoFilled" title="关于" @click="$emit('about', $event)" />
    </div>
  </header>
</template>
