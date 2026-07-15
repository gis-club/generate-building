<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Delete, MagicStick, Plus } from '@element-plus/icons-vue'
import type { VisionProviderConfig, VisionProviderTemplate } from '@/types/workspace'

const props = defineProps<{
  providers: VisionProviderConfig[]
  templates: VisionProviderTemplate[]
  busyProviderId: string
}>()

const visible = defineModel<boolean>('visible', { required: true })
const newProviderTemplate = defineModel<string>('newProviderTemplate', { required: true })
const activeModelKey = defineModel<string>('activeModelKey', { required: true })
const maxBuildings = defineModel<number>('maxBuildings', { required: true })

const emit = defineEmits<{
  save: [notify?: boolean]
  'add-provider': []
  'remove-provider': [provider: VisionProviderConfig]
  'test-provider': [provider: VisionProviderConfig]
  'discover-models': [provider: VisionProviderConfig]
  'add-model': [provider: VisionProviderConfig]
  'remove-model': [provider: VisionProviderConfig, index: number]
  'change-model': []
}>()

const selectedProviderId = ref(props.providers[0]?.id ?? '')
const selectedProvider = computed(() => (
  props.providers.find((provider) => provider.id === selectedProviderId.value)
  ?? props.providers[0]
  ?? null
))

watch(
  () => props.providers.map((provider) => provider.id),
  (ids, previousIds = []) => {
    const addedId = ids.find((id) => !previousIds.includes(id))
    if (addedId) {
      selectedProviderId.value = addedId
      return
    }
    if (!ids.includes(selectedProviderId.value)) selectedProviderId.value = ids[0] ?? ''
  },
  { immediate: true },
)

watch(visible, (isVisible) => {
  if (isVisible && !selectedProvider.value) selectedProviderId.value = props.providers[0]?.id ?? ''
})

function saveSilently() {
  emit('save', false)
}

function selectModel() {
  emit('change-model')
}

function updateModelId(model: VisionProviderConfig['models'][number]) {
  model.name = model.id
  saveSilently()
}

function saveAndClose() {
  emit('save')
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="AI 模型供应商"
    width="min(1040px, 96vw)"
    top="5vh"
    class="ai-provider-dialog"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="saveSilently"
  >
    <el-alert
      class="ai-provider-intro"
      type="info"
      title="统一管理供应商、访问凭据与视觉模型"
      description="建筑识别只会调用当前选中的已启用视觉模型。API Key 建议通过后端网关保管。"
      :closable="false"
      show-icon
    />

    <el-row class="ai-provider-addbar" :gutter="8" align="middle">
      <el-col :xs="24" :sm="18">
        <el-select v-model="newProviderTemplate" filterable placeholder="选择供应商模板">
          <el-option v-for="template in templates" :key="template.id" :label="template.name" :value="template.id" />
        </el-select>
      </el-col>
      <el-col :xs="24" :sm="6">
        <el-button type="primary" :icon="Plus" @click="$emit('add-provider')">新增供应商</el-button>
      </el-col>
    </el-row>

    <el-container class="ai-provider-workspace">
      <el-aside class="ai-provider-nav" width="220px">
        <el-row class="ai-provider-nav__heading" align="middle" justify="space-between">
          <el-text tag="strong">供应商</el-text>
          <el-tag size="small" effect="plain">{{ providers.length }}</el-tag>
        </el-row>
        <el-scrollbar class="ai-provider-nav__scroll">
          <el-menu
            class="ai-provider-menu"
            :default-active="selectedProviderId"
            @select="selectedProviderId = $event"
          >
            <el-menu-item
              v-for="provider in providers"
              :id="`ai-provider-${provider.id}`"
              :key="provider.id"
              :index="provider.id"
              class="ai-provider-menu__item"
            >
              <el-avatar shape="square" :size="32"><el-icon><MagicStick /></el-icon></el-avatar>
              <el-space class="ai-provider-menu__copy" direction="vertical" alignment="flex-start" :size="0">
                <el-text tag="strong" truncated>{{ provider.name }}</el-text>
                <el-text size="small" type="info" truncated>{{ provider.protocol }} · {{ provider.models.length }} 个模型</el-text>
              </el-space>
              <el-badge is-dot :type="provider.enabled ? 'success' : 'info'" />
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <el-main class="ai-provider-detail">
        <div v-if="selectedProvider" :key="selectedProvider.id" class="ai-provider-detail__scroll">
          <el-card class="ai-provider-card" shadow="never" :class="{ 'is-disabled': !selectedProvider.enabled }">
            <template #header>
              <el-row class="ai-provider-card__header" align="middle" justify="space-between">
                <el-space class="ai-provider-card__identity" alignment="center" :size="10">
                  <el-avatar shape="square" :size="36"><el-icon><MagicStick /></el-icon></el-avatar>
                  <el-space direction="vertical" alignment="flex-start" :size="0">
                    <el-input v-model="selectedProvider.name" :disabled="selectedProvider.builtin" @change="saveSilently" />
                    <el-text size="small" type="info">{{ selectedProvider.protocol }}</el-text>
                  </el-space>
                </el-space>
                <el-space class="ai-provider-card__header-actions" alignment="center" :size="8">
                  <el-switch
                    v-model="selectedProvider.enabled"
                    inline-prompt
                    active-text="启用"
                    inactive-text="停用"
                    @change="saveSilently"
                  />
                  <el-button
                    v-if="!selectedProvider.builtin"
                    text
                    type="danger"
                    :icon="Delete"
                    title="删除供应商"
                    @click="$emit('remove-provider', selectedProvider)"
                  />
                </el-space>
              </el-row>
            </template>

            <template v-if="selectedProvider.protocol !== 'local-sam'">
              <el-form label-position="top" class="ai-provider-form-grid">
                <el-row :gutter="12">
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="接口协议">
                      <el-select v-model="selectedProvider.protocol" @change="saveSilently">
                        <el-option label="OpenAI Responses" value="openai-responses" />
                        <el-option label="OpenAI Compatible / Chat Completions" value="openai-compatible" />
                        <el-option label="Anthropic Messages" value="anthropic" />
                        <el-option label="Google Gemini" value="gemini" />
                        <el-option label="Azure OpenAI" value="azure-openai" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="API Endpoint">
                      <el-input v-model="selectedProvider.baseUrl" placeholder="https://api.example.com/v1" @change="saveSilently" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="API Key">
                      <el-input v-model="selectedProvider.apiKey" type="password" show-password placeholder="sk-..." @change="saveSilently" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="密钥存储" class="ai-provider-remember">
                      <el-checkbox v-model="selectedProvider.rememberApiKey" @change="saveSilently">长期保存在此浏览器</el-checkbox>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="自定义请求头（JSON，可选）">
                      <el-input
                        v-model="selectedProvider.headersText"
                        type="textarea"
                        :rows="2"
                        placeholder='{"X-Project-ID":"..."}'
                        @change="saveSilently"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>

              <el-space class="ai-provider-actions" alignment="center" :size="8">
                <el-button
                  :loading="busyProviderId === selectedProvider.id"
                  :disabled="Boolean(busyProviderId)"
                  @click="$emit('test-provider', selectedProvider)"
                >测试连接</el-button>
                <el-button
                  type="primary"
                  plain
                  :loading="busyProviderId === selectedProvider.id"
                  :disabled="Boolean(busyProviderId)"
                  @click="$emit('discover-models', selectedProvider)"
                >获取模型</el-button>
              </el-space>
            </template>

            <el-card class="ai-model-list" shadow="never">
              <template #header>
                <el-row class="ai-model-list__heading" align="middle" justify="space-between">
                  <el-space alignment="center" :size="6">
                    <el-text tag="strong">模型目录</el-text>
                    <el-tag size="small">{{ selectedProvider.models.length }}</el-tag>
                  </el-space>
                  <el-button
                    v-if="!selectedProvider.builtin"
                    text
                    type="primary"
                    :icon="Plus"
                    @click="$emit('add-model', selectedProvider)"
                  >手动添加</el-button>
                </el-row>
              </template>

              <div v-if="selectedProvider.models.length" class="ai-model-table">
                <div class="ai-model-table__body">
                  <div class="ai-model-table__header" role="row">
                    <span class="ai-model-table__center">当前</span>
                    <span>模型 ID</span>
                    <span class="ai-model-table__center">视觉</span>
                    <span class="ai-model-table__center">启用</span>
                    <span class="ai-model-table__center">操作</span>
                  </div>
                  <div
                    v-for="(model, modelIndex) in selectedProvider.models"
                    :key="`${selectedProvider.id}-${modelIndex}`"
                    class="ai-model-table__row"
                    role="row"
                  >
                    <div class="ai-model-table__center">
                      <el-radio
                        v-model="activeModelKey"
                        :value="`${selectedProvider.id}::${model.id}`"
                        :disabled="!selectedProvider.enabled || !model.enabled || !model.id"
                        :aria-label="`选择 ${model.id || '未命名模型'} 作为当前模型`"
                        @change="selectModel"
                      ><span /></el-radio>
                    </div>
                    <el-input
                      v-model="model.id"
                      class="ai-model-table__model-id"
                      placeholder="model-id"
                      :disabled="selectedProvider.builtin"
                      :title="model.id"
                      @change="updateModelId(model)"
                    />
                    <div class="ai-model-table__center">
                      <el-switch
                        v-model="model.vision"
                        size="small"
                        :disabled="selectedProvider.builtin"
                        :aria-label="`${model.id || '未命名模型'} 的视觉能力`"
                        @change="saveSilently"
                      />
                    </div>
                    <div class="ai-model-table__center">
                      <el-switch
                        v-model="model.enabled"
                        size="small"
                        :disabled="selectedProvider.builtin"
                        :aria-label="`启用 ${model.id || '未命名模型'}`"
                        @change="saveSilently"
                      />
                    </div>
                    <div class="ai-model-table__center">
                      <el-button
                        v-if="!selectedProvider.builtin"
                        class="ai-model-table__delete"
                        text
                        type="danger"
                        :icon="Delete"
                        :aria-label="`删除 ${model.id || '未命名模型'}`"
                        title="删除模型"
                        @click="$emit('remove-model', selectedProvider, modelIndex)"
                      />
                      <span v-else class="ai-model-table__placeholder">—</span>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无模型，可在线获取或手动添加模型 ID" :image-size="48" />
            </el-card>
          </el-card>
        </div>

        <el-empty v-else description="还没有模型供应商">
          <el-button type="primary" :icon="Plus" @click="$emit('add-provider')">新增供应商</el-button>
        </el-empty>
      </el-main>
    </el-container>

    <template #footer>
      <el-row class="ai-provider-footer" align="middle" justify="space-between">
        <el-space alignment="center" :size="8">
          <el-text>最多识别</el-text>
          <el-input-number v-model="maxBuildings" :min="1" :max="100" size="small" />
          <el-text>个建筑</el-text>
        </el-space>
        <el-space alignment="center" :size="8">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="saveAndClose">保存配置</el-button>
        </el-space>
      </el-row>
    </template>
  </el-dialog>
</template>
