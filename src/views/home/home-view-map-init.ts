import {
  Viewer,
  LayerRecovered,
  GEManageRecovered,
  BaseWidgetRecovered,
  Measure
} from './home-view-lib.ts'

/**
 * 地图初始化与页面级 UI 交互逻辑。
 * 这里负责 Cesium Viewer、基础控件、导入文件、视图刷新和面板联动。
 */
const HOME_WIDGET_MODULES = [
  '自定义位置',
  '自定义图层',
  '导入geojson',
  '导出geojson',
  '导出gltf',
  '切换场景',
  '降低整体高度',
  '升高整体高度',
  '预览模型',
  '线框化',
  '隐藏模型',
  '绘制区域',
  '导出局部json',
  '全部折叠',
  'AI辅助'
]

function createHomeWidgetModules(enabled) {
  if (!enabled) return []
  return HOME_WIDGET_MODULES.map((name) => ({ name, svgStr: '' }))
}

function bindWidgetButton(vm, title, handler) {
  const button = vm.getButtonByTitle('mbs-widget1', title)
  if (!button) return
  button.addEventListener('click', handler)
}

function addPreviewBaseLayer(viewer) {
  const imageryLayers = viewer.viewer.imageryLayers
  imageryLayers.removeAll()

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  })

  const imagery = imageryLayers.addImageryProvider(provider)
  imagery.name = 'preview_arcgis_satellite'
  return imagery
}

import { defineRecoveredMethods } from '../../lib/recovered-sdk-types.ts'

export const homeViewMapInitMethods = defineRecoveredMethods({
  /**
   * 页面地图总入口。
   * 在主视图 DOM 准备好后依次初始化地图、工具条、点击事件和窗口尺寸监听。
   */
  initMapAll(licensePassed) {
    this.checkFlag = licensePassed
    this.$nextTick(() => {
      this.initMap()
      this.operate(licensePassed)
      if (this.finalData.length > 0 && typeof this.updateAll === 'function') {
        this.updateAll()
      }
      this.mapLeftClick('map')
      this.resizeWindow()
    })
  },
  /**
   * 顶部帮助/关于/定价面板开关。
   */
  showInfo(event, type) {
    this.infoShow1 = false
    this.infoShow2 = false
    this.infoShow3 = false
    this.infoShow4 = false

    switch (type) {
      case 1:
        this.infoShow1 = true
        this.leftShow1 = false
        this.leftShow2 = false
        break
      case 2:
        this.infoShow2 = true
        this.leftShow1 = false
        this.leftShow2 = false
        break
      case 3:
        this.infoShow3 = true
        this.leftShow1 = false
        this.leftShow2 = false
        break
      case 4:
        this.infoShow4 = true
        this.leftShow1 = false
        this.leftShow2 = false
        break
    }

    this.$nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  },
  resizePanel() {
    const panel = document.querySelector<HTMLElement>('.tool-panel')
    if (panel) {
      panel.style.height = window.innerHeight - 45 + 'px'
    }
  },
  resizeWindow() {
    const syncHeight = () => {
      const map = document.getElementById('map')
      const threeContainer = document.getElementById('threeContainer')
      const toolPanel = document.querySelector<HTMLElement>('.tool-panel')

      if (map) map.style.height = '100%'
      if (threeContainer) threeContainer.style.height = '100%'
      if (toolPanel) toolPanel.style.height = window.innerHeight - 45 + 'px'

      const loadingText = document.querySelector<HTMLElement>('#loading-sam span')
      if (loadingText) {
        loadingText.style.lineHeight = window.innerHeight + 'px'
      }
    }

    window.onload = syncHeight
    window.addEventListener('resize', syncHeight)
  },
  /**
   * 正常实体模式重新生成建筑。
   */
  genBuild() {
    this.updateAll()
  },
  tranBuild() {
    const index = new GEManageRecovered(myViewer).containsByNameIndexOf('mbs-basePolygon_build')[0]
    myViewer.viewer.scene.primitives._primitives[index]._primitives[0].appearance.translucent = true
  },
  vertexBuild() {
    this.updateAll()
  },
  hideBuild() {
    const index = new GEManageRecovered(myViewer).containsByNameIndexOf('mbs-basePolygon_build')[0]
    myViewer.viewer.scene.primitives._primitives[index]._primitives[0].show = false
  },
  pedestalBuild() {
    this.updateAll()
  },
  addPostStage(fragmentShader) {
    const startAt = new Date().getTime()
    const uniforms = { num: 2, yPos: 0, darkIsHot: true }

    this.postStage = new Cesium.PostProcessStage({
      fragmentShader,
      uniforms: {
        iTime() {
          return (new Date().getTime() - startAt) / 1000
        },
        uvNum: uniforms.num,
        yPos: uniforms.yPos,
        darkIsHot: uniforms.darkIsHot
      }
    })

    window.myViewer.viewer.scene.postProcessStages.add(this.postStage)
  },
  /**
   * 初始化 Cesium 场景。
   * 纯 Vite 预览模式使用 ArcGIS 影像底图，避免依赖 Electron 授权流程。
   */
  initMap() {
    const isPreview = window.__MBS_RECOVERED_PREVIEW__ === true
    const viewer = new Viewer('map', {
      ionToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MDA4MTA3YS1mZDNmLTQyYzMtYjg3Ny1jN2EzNWNkNzBhNzYiLCJpZCI6MTE0MDgzLCJpYXQiOjE3NzA0NTY5NjZ9.ky7zHUKW9YVxb1LB6jW0PLdv0I9pPIFDdytlLcPUb-Y',
      terrain: { terrainFlag: !isPreview }
    })

    viewer.viewer.scene.globe.depthTestAgainstTerrain = true
    viewer.viewer.scene.postProcessStages.fxaa.enabled = true
    viewer.locationCenter({
      pos: [113.738, 34.77],
      headingAngle: -90,
      pitchAngle: -90,
      distance: 1500
    })

    if (isPreview) {
      addPreviewBaseLayer(viewer)
    } else {
      new LayerRecovered().addOnLineMap({ viewer, type: 'google', layer: '卫星' })
    }

    this.widgetObject = new Measure()
    this.widgetObject.drawMea({
      viewer,
      pointStyleType: 0,
      lineColor: '#ffff00',
      lineWidth: 3,
      lineOpacity: 50
    })

    window.myViewer = viewer
  },
  operate(licensePassed) {
    this.baseWidgetObject = new BaseWidgetRecovered()
    this.baseWidgetObject.initWidget({
      dom: 'map',
      viewer: window.myViewer,
      align: 'custom',
      theme: 'bright',
      textShow: true,
      buttons: [0, 1, 2],
      customStyle: { top: -100, left: 0, width: 185, buttonWidth: 185 },
      customPrevModule: [],
      customModule: createHomeWidgetModules(licensePassed),
      homePos: { pos: [113.73, 34.77], heading: 0, pitch: -90, distance: 4000 }
    })

    if (!licensePassed) return

    bindWidgetButton(this, '自定义位置', () => {
      this.leftShow1 = !this.leftShow1
      this.leftShow2 = false
      this.infoShow1 = false
      this.infoShow2 = false
      this.infoShow3 = false
      this.infoShow4 = false
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    })

    bindWidgetButton(this, '自定义图层', () => {
      this.leftShow1 = false
      this.leftShow2 = !this.leftShow2
      this.infoShow1 = false
      this.infoShow2 = false
      this.infoShow3 = false
      this.infoShow4 = false
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    })

    bindWidgetButton(this, '切换场景', () => this.updateView())
    bindWidgetButton(this, '降低整体高度', () => this.adjustAllHeight(-5))
    bindWidgetButton(this, '升高整体高度', () => this.adjustAllHeight(5))
    bindWidgetButton(this, '预览模型', () => {
      this.selectedVisualMode = 'preview'
      this.modelMode = undefined
      this.highlightButton('预览模型')
      this.genBuild()
    })
    bindWidgetButton(this, '线框化', () => {
      this.selectedVisualMode = 'wireframe'
      this.modelMode = 'vertex'
      this.highlightButton('线框化')
      this.vertexBuild()
    })
    bindWidgetButton(this, '隐藏模型', () => {
      this.selectedVisualMode = 'hidden'
      this.modelMode = 'hidden'
      this.highlightButton('隐藏模型')
      this.updateAll()
    })
    bindWidgetButton(this, '绘制区域', () => this.update(0))
    bindWidgetButton(this, '导出局部json', () => this.exportJson(1))
    bindWidgetButton(this, '导出gltf', () => this.exportGltf())
    bindWidgetButton(this, '导出geojson', () => this.exportJson(0))
    bindWidgetButton(this, '全部折叠', () => {
      this.fold(this.allPanelShow)
      this.allPanelShow = !this.allPanelShow
    })
    bindWidgetButton(this, 'AI辅助', () => this.useActiveAIModel())
    bindWidgetButton(this, '导入geojson', () => this.openImportDialog())

    const exportPartButton = this.getButtonByTitle('mbs-widget1', '导出局部json')
    if (exportPartButton) exportPartButton.style.display = 'none'

  },
  posFormSubmit() {
    window.myViewer.locationCenter({
      pos: [this.posForm.lon, this.posForm.lat],
      headingAngle: 0,
      pitchAngle: -90,
      distance: 5000
    })
  },
  posFormCancel() {
    this.leftShow1 = false
    this.$nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  },
  layerFormSubmit() {
    new LayerRecovered().addOnLineMapCustom({
      viewer: window.myViewer,
      url: this.layerForm.url,
      layerName: this.layerForm.name
    })

    this.layerFormCancel()
  },
  layerFormCancel() {
    this.leftShow2 = false
    this.$nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  },
  getButtonByTitle(widgetId, title) {
    const buttons = document.getElementById(widgetId)?.querySelectorAll('button') || []
    return Array.from(buttons).filter((button) => button.title === title)[0]
  },
  highlightButton(title) {
    const buttons = ['预览模型', '线框化', '隐藏模型']

    for (const buttonTitle of buttons) {
      const button = this.getButtonByTitle('mbs-widget1', buttonTitle)
      if (!button) continue

      const isCurrent = buttonTitle === title
      const backgroundColor = isCurrent ? 'rgb(0, 125, 255)' : 'rgba(255,255,255,1.0)'
      const color = isCurrent ? '#ffffff' : '#000000'

      button.style.backgroundColor = backgroundColor
      button.style.color = color

      const paths = button.getElementsByTagName('path')
      for (const path of paths) {
        path.style.fill = color
      }
    }
  },
  updateView() {
    this.sceneFlag = !this.sceneFlag
    if (this.sceneFlag) {
      window.myViewer.updateViewer({ globeFlag: true })
    } else {
      myViewer.updateViewer({ globeFlag: false, backGroundColor: '#f5f5f5' })
    }
  }
})


