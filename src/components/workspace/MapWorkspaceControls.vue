<script setup lang="ts">
import { Aim, Box, EditPen, Location, Refresh } from '@element-plus/icons-vue'

defineProps<{
  drawingActive: boolean
  buildingCount: number
  pointCount: number
  visualModeLabel: string
  averageHeight: number
  sceneModeLabel: string
}>()

defineEmits<{
  reset: []
  north: []
  draw: []
  position: []
}>()
</script>

<template>
  <el-space class="map-commandbar" alignment="center" :size="4" @click.stop>
    <el-button circle :icon="Refresh" title="初始位置" @click="$emit('reset')" />
    <el-button circle :icon="Aim" title="回到正北" @click="$emit('north')" />
    <el-divider direction="vertical" />
    <el-button circle :icon="EditPen" :class="{ 'is-active': drawingActive }" title="绘制区域" @click="$emit('draw')" />
    <el-button circle :icon="Location" title="定位到坐标" @click="$emit('position')" />
  </el-space>

  <el-card class="map-overview-card" shadow="always" @click.stop>
    <el-space alignment="center" :size="10">
      <el-avatar class="map-overview-card__icon" shape="square" :size="34"><el-icon><Box /></el-icon></el-avatar>
      <el-space direction="vertical" alignment="flex-start" :size="0">
        <el-text tag="strong">{{ buildingCount }} 个建筑对象</el-text>
        <el-text size="small" type="info">{{ visualModeLabel }} · 平均高度 {{ averageHeight }}m</el-text>
      </el-space>
    </el-space>
  </el-card>

  <el-footer class="studio-statusbar" height="var(--studio-status-height)" @click.stop>
    <el-row align="middle" justify="space-between" :wrap="false">
      <el-space alignment="center" :size="6"><span class="studio-online-dot" /><el-text size="small">就绪</el-text></el-space>
      <el-space class="studio-statusbar__center" alignment="center" :size="0">
        <el-tag size="small" effect="plain">对象 {{ buildingCount }}</el-tag>
        <el-tag size="small" effect="plain">节点 {{ pointCount }}</el-tag>
        <el-tag size="small" effect="plain">场景 {{ sceneModeLabel }}</el-tag>
      </el-space>
      <el-space alignment="center" :size="8">
        <el-text size="small">EPSG:4326</el-text><el-text size="small">WGS 84</el-text><el-text size="small">100%</el-text>
      </el-space>
    </el-row>
  </el-footer>
</template>
