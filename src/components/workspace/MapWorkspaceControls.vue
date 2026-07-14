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
  <div class="map-commandbar" @click.stop>
    <el-button circle :icon="Refresh" title="初始位置" @click="$emit('reset')" />
    <el-button circle :icon="Aim" title="回到正北" @click="$emit('north')" />
    <span />
    <el-button circle :icon="EditPen" :class="{ 'is-active': drawingActive }" title="绘制区域" @click="$emit('draw')" />
    <el-button circle :icon="Location" title="定位到坐标" @click="$emit('position')" />
  </div>

  <div class="map-overview-card" @click.stop>
    <span class="map-overview-card__icon"><el-icon><Box /></el-icon></span>
    <div><strong>{{ buildingCount }} 个建筑对象</strong><small>{{ visualModeLabel }} · 平均高度 {{ averageHeight }}m</small></div>
  </div>

  <footer class="studio-statusbar" @click.stop>
    <div><span class="studio-online-dot" /> 就绪</div>
    <div class="studio-statusbar__center">
      <span>对象 {{ buildingCount }}</span>
      <span>节点 {{ pointCount }}</span>
      <span>场景 {{ sceneModeLabel }}</span>
    </div>
    <div><span>EPSG:4326</span><span>WGS 84</span><span>100%</span></div>
  </footer>
</template>
