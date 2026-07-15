<script setup lang="ts">
defineProps<{
  helpVisible: boolean
  aboutVisible: boolean
  pricingVisible: boolean
  infoVisible: boolean
  errorVisible: boolean
  errorMessage: string
  downloadProgress: number
  downloadProgressColors: unknown
}>()
</script>

<template>
  <el-card v-if="helpVisible" class="top-info" shadow="always" @click.stop>
    <template #header>帮助</template>
    <el-row class="help-columns" :gutter="18">
      <el-col :span="12">
        <el-space class="help-column" direction="vertical" alignment="flex-start" :size="8">
          <el-text>漫游地图：鼠标左键按下拖动</el-text>
          <el-text>缩放地图：滚轮控制缩放</el-text>
          <el-text>倾斜视角：鼠标中键按下拖动</el-text>
        </el-space>
      </el-col>
      <el-col :span="12">
        <el-space class="help-column" direction="vertical" alignment="flex-start" :size="8">
          <el-text>绘制区域：左键逐点绘制，双击结束</el-text>
          <el-text>编辑顶点：选中点后拖动，右键删除</el-text>
          <el-text>插入顶点：单击线段附近插入新点</el-text>
        </el-space>
      </el-col>
    </el-row>
  </el-card>

  <el-card v-if="aboutVisible" class="top-info" shadow="always" @click.stop>
    <template #header>关于</template>
    <el-space direction="vertical" alignment="flex-start" :size="8">
      <el-text>GIS 工作台用于快速完成地图浏览、区域绘制、参数调整、AI 辅助识别与模型导出。</el-text>
      <el-text>当前项目运行于纯前端预览模式，适合本地联调、界面演示与交互优化。</el-text>
    </el-space>
  </el-card>

  <el-card v-if="pricingVisible" class="top-info" shadow="always" @click.stop>
    <template #header>定价</template>
    <el-descriptions class="price-list" :column="1" border>
      <el-descriptions-item label="离线预览版"><el-tag type="success">当前可用</el-tag></el-descriptions-item>
      <el-descriptions-item label="专业版"><el-tag type="info">待接入</el-tag></el-descriptions-item>
      <el-descriptions-item label="企业版"><el-tag type="info">待接入</el-tag></el-descriptions-item>
    </el-descriptions>
  </el-card>

  <el-card v-if="infoVisible" class="top-info" shadow="always" @click.stop>
    <template #header>说明</template>
    <el-space direction="vertical" alignment="flex-start" :size="8">
      <el-text>当前界面重点围绕白模高频工作流进行重构，预留的业务入口可继续挂接真实服务。</el-text>
      <el-text>如需进一步升级，下一步建议补齐图层管理、对象筛选和多视图联动能力。</el-text>
    </el-space>
  </el-card>

  <el-alert
    v-if="errorVisible"
    class="top-info top-info--warning"
    title="重要提示"
    :description="errorMessage"
    type="warning"
    show-icon
    :closable="false"
    @click.stop
  />

  <el-card v-if="downloadProgress > 0 && downloadProgress < 100" class="top-info top-info--warning" shadow="always" @click.stop>
    <template #header>下载进度</template>
    <el-progress :text-inside="true" :stroke-width="20" :percentage="downloadProgress" :color="downloadProgressColors as any" />
  </el-card>
</template>
