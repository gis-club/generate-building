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
    <section
      v-if="running"
      class="ai-recognition-progress"
      role="status"
      aria-live="polite"
      :aria-label="`AI 识别进度 ${normalizedPercentage}%：${stage}`"
    >
      <el-card class="ai-recognition-progress__card" shadow="always">
        <div class="ai-recognition-progress__header">
          <div class="ai-recognition-progress__title">
            <el-icon class="ai-recognition-progress__spinner"><Loading /></el-icon>
            <div>
              <strong>AI 建筑识别</strong>
              <span>{{ modelLabel }}</span>
            </div>
          </div>
          <strong class="ai-recognition-progress__percentage">{{ normalizedPercentage }}%</strong>
        </div>

        <el-progress
          :percentage="normalizedPercentage"
          :stroke-width="10"
          :show-text="false"
          striped
          striped-flow
          :duration="12"
        />

        <div class="ai-recognition-progress__meta">
          <span>{{ stage }}</span>
          <span>已用时 {{ elapsedLabel }}</span>
        </div>
        <p>模型返回前可能需要一些时间，请保持页面开启。</p>
      </el-card>
    </section>
  </Transition>
</template>
