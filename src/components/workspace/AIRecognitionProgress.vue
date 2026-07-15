<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  running: boolean
  percentage: number
  stage: string
  modelLabel: string
  startedAt: number
}>()

const now = ref(Date.now())
let elapsedTimer: ReturnType<typeof window.setInterval> | undefined

const normalizedPercentage = computed(() => Math.max(0, Math.min(100, Math.round(props.percentage || 0))))
const elapsedSeconds = computed(() => {
  if (!props.startedAt) return 0
  return Math.max(0, Math.floor((now.value - props.startedAt) / 1000))
})
const elapsedLabel = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return minutes > 0 ? `${minutes}分${String(seconds).padStart(2, '0')}秒` : `${seconds}秒`
})

function stopElapsedTimer() {
  if (elapsedTimer === undefined) return
  window.clearInterval(elapsedTimer)
  elapsedTimer = undefined
}

watch(
  () => props.running,
  (running) => {
    stopElapsedTimer()
    now.value = Date.now()
    if (!running) return
    elapsedTimer = window.setInterval(() => {
      now.value = Date.now()
    }, 1000)
  },
  { immediate: true }
)

onBeforeUnmount(stopElapsedTimer)
</script>

<template>
  <Transition name="ai-progress">
    <el-card
      v-if="running"
      class="ai-recognition-progress ai-recognition-progress__card"
      shadow="always"
      role="status"
      aria-live="polite"
      :aria-label="`AI 识别进度 ${normalizedPercentage}%：${stage}`"
    >
        <el-row class="ai-recognition-progress__header" align="middle" justify="space-between">
          <el-space class="ai-recognition-progress__title" alignment="center" :size="10">
            <el-icon class="ai-recognition-progress__spinner"><Loading /></el-icon>
            <el-space direction="vertical" alignment="flex-start" :size="0">
              <el-text tag="strong">AI 建筑识别</el-text>
              <el-text size="small" type="info">{{ modelLabel }}</el-text>
            </el-space>
          </el-space>
          <el-tag class="ai-recognition-progress__percentage" size="small" type="primary" effect="dark" round>{{ normalizedPercentage }}%</el-tag>
        </el-row>

        <el-progress
          :percentage="normalizedPercentage"
          :stroke-width="10"
          :show-text="false"
          striped
          striped-flow
          :duration="12"
        />

        <el-row class="ai-recognition-progress__meta" align="middle" justify="space-between">
          <el-text size="small" type="info">{{ stage }}</el-text>
          <el-text size="small" type="info">已用时 {{ elapsedLabel }}</el-text>
        </el-row>
        <el-text tag="p" size="small" type="info">模型返回前可能需要一些时间，请保持页面开启。</el-text>
    </el-card>
  </Transition>
</template>
