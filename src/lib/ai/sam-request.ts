/**
 * SAM 请求层。
 * 纯 Vite 项目下统一走 /sam-api 代理，避免浏览器直接跨域访问官方模型接口。
 */

/**
 * SAM 请求适配层。
 *
 * 旧工程既支持桌面端转发，也支持直接调用外部服务。
 * 当前项目已经改造成纯 Vite + Vue + TypeScript，因此这里统一走 Vite 开发代理，
 * 从而避免浏览器直接请求第三方接口时触发 CORS 限制。
 */
import { MaskTraceRecovered } from '../mbs-sdk-exports-core.ts'

const SAM_PROXY_ENDPOINT = '/sam-api/automatic_masks'

async function requestSamAutomaticMasks(blob) {
  const response = await fetch(SAM_PROXY_ENDPOINT, {
    method: 'POST',
    body: blob
  })

  if (!response.ok) {
    throw new Error(`SAM request failed: ${response.status}`)
  }

  return response.json()
}

export const samRequestMethods = {
  constructor(options) {
    this.viewer = options.viewer.viewer
    this.data = options.data
    this.drawGeoShow = options.drawGeoShow
    this.drawCanvasShow = options.drawCanvasShow
    this.samLonlats = null
    this.samError = null
    this.initImg()
  },

  loadingHtml(show) {
    new MaskTraceRecovered().loadingHtml(show)
  },

  async initImg() {
    this.loadingHtml(true)
    let data = this.data
    let fileName = ''

    if (data instanceof URL) {
      fileName = data.pathname
    } else if (typeof data === 'string') {
      data = new URL(data.replace('/assets/', '/public/assets/'))
      fileName = data.pathname
    }

    if (fileName) {
      fileName = fileName.substring(fileName.lastIndexOf('/') + 1)
    }

    const file = data instanceof File ? data : await this.getFile(data)
    const image = new Image()
    image.src = URL.createObjectURL(file)

    image.onload = () => {
      const { height, width, scale, uploadScale } = this.handleImageScale(image)
      image.width = Math.round(width * scale)
      image.height = Math.round(height * scale)
      this.setParmsandQueryModel(width, height, uploadScale, image, null, fileName, false, false)
    }
  },

  setParmsandQueryModel(width, height, uploadScale, image, prompt, fileName, showPrompt, skipInference) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * uploadScale)
    canvas.height = Math.round(height * uploadScale)
    window.realWidth = canvas.width
    window.realHeight = canvas.height

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          this.queryModelReturnTensors(blob, prompt, canvas.height, fileName, showPrompt, skipInference)
        }
      },
      'image/jpeg',
      1
    )
  },

  async queryModelReturnTensors(blob, prompt, imageHeight, fileName, showPrompt, skipInference) {
    if (skipInference) {
      return
    }

    try {
      this.samError = null
      const result = await requestSamAutomaticMasks(blob)
      this.handleAllModelResults(result, imageHeight, this)
    } catch (error) {
      this.samError = 'AI识别请求失败，请检查网络或代理配置后重试'
      this.loadingHtml(false)
      console.error(error)
    }
  }
}

export default samRequestMethods

