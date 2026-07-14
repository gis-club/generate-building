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
    <div class="help-columns">
      <div class="help-column">
        <p>漫游地图：鼠标左键按下拖动</p>
        <p>缩放地图：滚轮控制缩放</p>
        <p>倾斜视角：鼠标中键按下拖动</p>
      </div>
      <div class="help-column">
        <p>绘制区域：左键逐点绘制，双击结束</p>
        <p>编辑顶点：选中点后拖动，右键删除</p>
        <p>插入顶点：单击线段附近插入新点</p>
      </div>
    </div>
  </el-card>

  <el-card v-if="aboutVisible" class="top-info" shadow="always" @click.stop>
    <template #header>关于</template>
    <p>GIS 工作台用于快速完成地图浏览、区域绘制、参数调整、AI 辅助识别与模型导出。</p>
    <p>当前项目运行于纯前端预览模式，适合本地联调、界面演示与交互优化。</p>
  </el-card>

  <el-card v-if="pricingVisible" class="top-info" shadow="always" @click.stop>
    <template #header>定价</template>
    <ul class="price-list">
      <li><span>离线预览版</span><strong>当前可用</strong></li>
      <li><span>专业版</span><strong>待接入</strong></li>
      <li><span>企业版</span><strong>待接入</strong></li>
    </ul>
  </el-card>

  <el-card v-if="infoVisible" class="top-info" shadow="always" @click.stop>
    <template #header>说明</template>
    <p>当前界面重点围绕白模高频工作流进行重构，预留的业务入口可继续挂接真实服务。</p>
    <p>如需进一步升级，下一步建议补齐图层管理、对象筛选和多视图联动能力。</p>
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
