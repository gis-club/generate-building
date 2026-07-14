<script setup lang="ts">
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

function saveSilently() {
  emit('save', false)
}

function selectModel() {
  emit('change-model')
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
    width="min(980px, 94vw)"
    class="ai-provider-dialog"
    append-to-body
    destroy-on-close
    @closed="saveSilently"
  >
    <el-alert type="info" :closable="false" show-icon class="ai-provider-intro">
      <template #title><strong>统一管理供应商与模型</strong></template>
      一个供应商可配置多个模型；建筑识别只调用当前选中的视觉模型。
      <el-tag type="warning" effect="plain">浏览器直连</el-tag>
    </el-alert>

    <div class="ai-provider-addbar">
      <el-select v-model="newProviderTemplate" filterable>
        <el-option v-for="template in templates" :key="template.id" :label="template.name" :value="template.id" />
      </el-select>
      <el-button type="primary" :icon="Plus" @click="$emit('add-provider')">新增供应商</el-button>
    </div>

    <div class="ai-provider-list">
      <el-card
        v-for="provider in providers"
        :id="`ai-provider-${provider.id}`"
        :key="provider.id"
        class="ai-provider-card"
        :class="{ 'is-disabled': !provider.enabled }"
        shadow="never"
      >
        <template #header>
          <div class="ai-provider-card__header">
            <div class="ai-provider-card__identity">
              <span><el-icon><MagicStick /></el-icon></span>
              <div>
                <el-input v-model="provider.name" :disabled="provider.builtin" @change="saveSilently" />
                <small>{{ provider.protocol }}</small>
              </div>
            </div>
            <div class="ai-provider-card__header-actions">
              <el-switch v-model="provider.enabled" @change="saveSilently" />
              <el-button v-if="!provider.builtin" text type="danger" :icon="Delete" title="删除供应商" @click="$emit('remove-provider', provider)" />
            </div>
          </div>
        </template>

        <template v-if="provider.protocol !== 'local-sam'">
          <el-form label-position="top" class="ai-provider-form-grid">
            <el-form-item label="接口协议">
              <el-select v-model="provider.protocol" @change="saveSilently">
                <el-option label="OpenAI Responses" value="openai-responses" />
                <el-option label="OpenAI Compatible / Chat Completions" value="openai-compatible" />
                <el-option label="Anthropic Messages" value="anthropic" />
                <el-option label="Google Gemini" value="gemini" />
                <el-option label="Azure OpenAI" value="azure-openai" />
              </el-select>
            </el-form-item>
            <el-form-item label="API Endpoint">
              <el-input v-model="provider.baseUrl" placeholder="https://api.example.com/v1" @change="saveSilently" />
            </el-form-item>
            <el-form-item label="API Key">
              <el-input v-model="provider.apiKey" type="password" show-password placeholder="sk-..." @change="saveSilently" />
            </el-form-item>
            <el-form-item label="密钥存储" class="ai-provider-remember">
              <el-checkbox v-model="provider.rememberApiKey" @change="saveSilently">长期保存在此浏览器</el-checkbox>
            </el-form-item>
            <el-form-item label="自定义请求头（JSON，可选）" class="ai-provider-headers">
              <el-input v-model="provider.headersText" type="textarea" :rows="2" placeholder='{"X-Project-ID":"..."}' @change="saveSilently" />
            </el-form-item>
          </el-form>

          <div class="ai-provider-actions">
            <el-button :loading="busyProviderId === provider.id" :disabled="Boolean(busyProviderId)" @click="$emit('test-provider', provider)">测试连接</el-button>
            <el-button :loading="busyProviderId === provider.id" :disabled="Boolean(busyProviderId)" @click="$emit('discover-models', provider)">获取模型</el-button>
          </div>
        </template>

        <div class="ai-model-list">
          <div class="ai-model-list__heading">
            <span>模型目录 <b>{{ provider.models.length }}</b></span>
            <el-button v-if="!provider.builtin" text type="primary" :icon="Plus" @click="$emit('add-model', provider)">手动添加模型</el-button>
          </div>
          <div v-if="provider.models.length" class="ai-model-table">
            <div class="ai-model-table__head"><span>当前</span><span>模型 ID</span><span>显示名称</span><span>视觉</span><span>启用</span><span /></div>
            <div v-for="(model, modelIndex) in provider.models" :key="`${provider.id}-${modelIndex}`" class="ai-model-row">
              <el-radio v-model="activeModelKey" :value="`${provider.id}::${model.id}`" :disabled="!provider.enabled || !model.enabled || !model.id" @change="selectModel"><span /></el-radio>
              <el-input v-model="model.id" placeholder="model-id" :disabled="provider.builtin" @change="saveSilently" />
              <el-input v-model="model.name" placeholder="显示名称" :disabled="provider.builtin" @change="saveSilently" />
              <el-switch v-model="model.vision" :disabled="provider.builtin" @change="saveSilently" />
              <el-switch v-model="model.enabled" :disabled="provider.builtin" @change="saveSilently" />
              <el-button v-if="!provider.builtin" text type="danger" :icon="Delete" title="删除模型" @click="$emit('remove-model', provider, modelIndex)" />
            </div>
          </div>
          <el-empty v-else class="ai-model-empty" description="还没有模型，可在线获取或手动添加模型 ID" :image-size="48" />
        </div>
      </el-card>
    </div>

    <el-alert
      class="ai-provider-security"
      type="warning"
      show-icon
      :closable="false"
      title="API Key 默认仅保存在当前标签会话；生产环境建议通过后端网关转发并保管密钥。"
    />

    <template #footer>
      <div class="ai-provider-footer">
        <label>最多识别 <el-input-number v-model="maxBuildings" :min="1" :max="100" size="small" /> 个建筑</label>
        <div>
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="saveAndClose">保存配置</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
