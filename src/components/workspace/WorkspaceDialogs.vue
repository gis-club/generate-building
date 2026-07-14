<script setup lang="ts">
import type { LayerForm, PositionForm } from '@/types/workspace'

defineProps<{
  positionVisible: boolean
  layerVisible: boolean
  positionForm: PositionForm
  layerForm: LayerForm
}>()

defineEmits<{
  'submit-position': []
  'cancel-position': []
  'submit-layer': []
  'cancel-layer': []
}>()
</script>

<template>
  <el-card v-if="positionVisible" class="side-dialog" shadow="always" @click.stop>
    <template #header>自定义位置</template>
    <el-form :model="positionForm" label-position="top">
      <el-form-item label="经度（WGS84）">
        <el-input v-model="positionForm.lon" placeholder="请输入经度"><template #prepend>lon</template></el-input>
      </el-form-item>
      <el-form-item label="纬度（WGS84）">
        <el-input v-model="positionForm.lat" placeholder="请输入纬度"><template #prepend>lat</template></el-input>
      </el-form-item>
      <el-form-item class="form-actions">
        <el-button type="primary" @click="$emit('submit-position')">确定</el-button>
        <el-button @click="$emit('cancel-position')">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <el-card v-if="layerVisible" class="side-dialog" shadow="always" @click.stop>
    <template #header>添加自定义图层</template>
    <el-form :model="layerForm" label-position="top">
      <el-form-item label="地址">
        <el-input v-model="layerForm.url" placeholder="请输入在线图层地址"><template #prepend>URL</template></el-input>
      </el-form-item>
      <el-form-item label="图层名称"><el-input v-model="layerForm.name" placeholder="请输入图层名称" /></el-form-item>
      <el-form-item class="form-actions">
        <el-button type="primary" @click="$emit('submit-layer')">添加</el-button>
        <el-button @click="$emit('cancel-layer')">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>
