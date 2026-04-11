/**
 * 页面侧边工具条 UI 基础能力。
 */

import { MeasureRecovered } from '../mbs-sdk-exports-core.ts'

const DEFAULT_HOME_POS = {
  pos: [113.73, 34.77],
  heading: 0,
  pitch: -90,
  distance: 4000
}

const TOOL_CONFIG = [
  { id: 'north', title: '回正北', text: '北' },
  { id: 'home', title: '初始视角', text: '家' },
  { id: 'layer', title: '图层控制', text: '层' },
  { id: 'line', title: '测距', text: '线' },
  { id: 'area', title: '测面', text: '面' },
  { id: 'point', title: '拾取坐标', text: '点' },
  { id: 'clear', title: '清除', text: '清' },
  { id: 'helpPc', title: '帮助-PC', text: 'PC' },
  { id: 'helpMobile', title: '帮助-Mobile', text: 'M' },
  { id: 'zoomIn', title: '放大', text: '+' },
  { id: 'zoomOut', title: '缩小', text: '-' }
]

export class BaseWidgetRecovered {
  constructor() {}

  initWidget(options) {
    this.dom = options.dom
    this.viewer = options.viewer
    this.align = options.align || 'right_center'
    this.theme = options.theme || 'bright'
    this.buttons = options.buttons || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    this.homePos = options.homePos || DEFAULT_HOME_POS
    this.controlLayers = []
    this.checkLayerControl = []
    this.layerDivFlag = false
    this.helpDivFlag = false
    this.helpMobileDivFlag = false
    this.customStyle = options.customStyle || {}
    this.customModule = options.customModule || []
    this.customPrevModule = options.customPrevModule || []
    this.textShow = options.textShow || false
    this.createWidget()
  }

  createWidget() {
    const viewer = this.viewer.viewer
    const measure = new MeasureRecovered()
    measure.drawMea({
      viewer: this.viewer,
      pointStyleType: 0,
      pointStyle: {
        color: Cesium.Color.ORANGE,
        pixelSize: 10,
        outlineColor: Cesium.Color.YELLOW,
        outlineWidth: 3
      },
      lineColor: '#ffa700',
      materialType: 2
    })

    const host = document.getElementById(this.dom)
    if (!host) {
      return
    }

    const root = document.createElement('div')
    root.id = 'mbs-widget'
    root.style = this.buildRootStyle()

    const layerPanel = document.createElement('div')
    layerPanel.id = 'mbs-widget-layer'
    layerPanel.style = this.buildPanelStyle(false)

    const helpPanel = document.createElement('div')
    helpPanel.id = 'mbs-widget-help-pc'
    helpPanel.style = this.buildPanelStyle(false)
    helpPanel.innerHTML = this.getHelpHtml('pc')

    const mobileHelpPanel = document.createElement('div')
    mobileHelpPanel.id = 'mbs-widget-help-mobile'
    mobileHelpPanel.style = this.buildPanelStyle(false)
    mobileHelpPanel.innerHTML = this.getHelpHtml('mobile')

    const buttons = []
    const buttonStyle = this.buildButtonStyle()

    const appendButton = (config, handler) => {
      const button = document.createElement('button')
      button.title = config.title
      button.type = 'button'
      button.style = buttonStyle
      button.innerHTML = this.textShow ? `${config.text}<span>${config.title}</span>` : config.text
      button.addEventListener('click', handler)
      root.appendChild(button)
      buttons.push(button)
      return button
    }

    this.customPrevModule.forEach((module) => {
      appendButton(
        { title: module.name || 'custom-prev', text: module.text || module.name || '*' },
        () => {
          if (typeof module.onClick === 'function') {
            module.onClick({ viewer: this.viewer, widget: this })
          }
        }
      )
    })

    TOOL_CONFIG.forEach((config, index) => {
      if (this.buttons.indexOf(index) === -1) {
        return
      }

      appendButton(config, () => {
        switch (config.id) {
          case 'north':
            this.adjustCamera(viewer)
            break
          case 'home':
            this.viewer.locationCenter({
              pos: this.homePos.pos,
              headingAngle: this.homePos.heading,
              pitchAngle: this.homePos.pitch,
              distance: this.homePos.distance
            })
            break
          case 'layer':
            this.renderLayerPanel(layerPanel)
            this.layerDivFlag = !this.layerDivFlag
            layerPanel.style.display = this.layerDivFlag ? 'block' : 'none'
            helpPanel.style.display = 'none'
            mobileHelpPanel.style.display = 'none'
            this.helpDivFlag = false
            this.helpMobileDivFlag = false
            break
          case 'line':
            measure.drawLineMeaStart({ type: 5 })
            break
          case 'area':
            measure.drawPolygonMeaStart({ type: 2 })
            break
          case 'point':
            measure.drawLineMeaStart({ type: 4 })
            break
          case 'clear':
            measure.clearAllMea()
            break
          case 'helpPc':
            this.helpDivFlag = !this.helpDivFlag
            helpPanel.style.display = this.helpDivFlag ? 'block' : 'none'
            this.layerDivFlag = false
            this.helpMobileDivFlag = false
            layerPanel.style.display = 'none'
            mobileHelpPanel.style.display = 'none'
            break
          case 'helpMobile':
            this.helpMobileDivFlag = !this.helpMobileDivFlag
            mobileHelpPanel.style.display = this.helpMobileDivFlag ? 'block' : 'none'
            this.layerDivFlag = false
            this.helpDivFlag = false
            layerPanel.style.display = 'none'
            helpPanel.style.display = 'none'
            break
          case 'zoomIn':
            if (viewer.camera.positionCartographic.height > 2.4) {
              viewer.camera.zoomIn(viewer.camera.positionCartographic.height / 1.2)
            }
            break
          case 'zoomOut':
            viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 1.2)
            break
        }
      })
    })

    this.customModule.forEach((module) => {
      appendButton(
        { title: module.name || 'custom', text: module.text || module.name || '*' },
        () => {
          if (typeof module.onClick === 'function') {
            module.onClick({ viewer: this.viewer, widget: this })
          }
        }
      )
    })

    layerPanel.addEventListener('click', (event) => {
      const target = event.target
      if (
        target &&
        (target.matches('.mbs-layer-label') || target.matches('.mbs-layer-checkbox'))
      ) {
        this.checkLayerControlChange()
      }
    })

    host.appendChild(root)
    host.appendChild(layerPanel)
    host.appendChild(helpPanel)
    host.appendChild(mobileHelpPanel)
  }

  buildRootStyle() {
    const themeDark = this.theme === 'dark'
    const style = {
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 3
    }

    if (this.align === 'left_center') {
      style.left = '1%'
      style.top = '20%'
    } else if (this.align === 'right_top') {
      style.right = '2%'
      style.top = '2%'
    } else if (this.align === 'left_top') {
      style.left = '1%'
      style.top = '2%'
    } else if (this.align === 'custom') {
      style.left = `${this.customStyle.left || 0}%`
      style.top = `${this.customStyle.top || 0}%`
    } else {
      style.right = '2%'
      style.top = '20%'
    }

    if (themeDark) {
      style.color = '#ffffff'
    }

    return Object.entries(style)
      .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`)
      .join(';')
  }

  buildButtonStyle() {
    const dark = this.theme === 'dark'
    const width = this.textShow ? this.customStyle.buttonWidth || 110 : 40
    const height = this.textShow ? this.customStyle.buttonHeight || 40 : 38
    return [
      `width:${width}px`,
      `height:${height}px`,
      'border:none',
      'border-radius:6px',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:6px',
      `background:${dark ? '#000000' : '#ffffff'}`,
      `color:${dark ? '#ffffff' : '#000000'}`,
      `box-shadow:0 0 3px ${dark ? '#ffffff' : '#666464'}`
    ].join(';')
  }

  buildPanelStyle(show) {
    const dark = this.theme === 'dark'
    return [
      'position:absolute',
      this.align === 'left_center' || this.align === 'left_top' ? 'left:80px' : 'right:80px',
      this.align === 'right_top' || this.align === 'left_top' ? 'top:2%' : 'top:20%',
      'width:220px',
      'padding:12px',
      'border-radius:6px',
      `background:${dark ? '#000000' : '#ffffff'}`,
      `color:${dark ? '#ffffff' : '#000000'}`,
      'box-shadow:0 0 3px #666464',
      `display:${show ? 'block' : 'none'}`,
      'z-index:3'
    ].join(';')
  }

  renderLayerPanel(panel) {
    const layers = this.viewer.viewer.imageryLayers._layers
    this.controlLayers = []
    let html = `
      <div class="layer_control_title" style="font-size:16px;font-weight:600;margin-bottom:8px;">鍥惧眰鎺у埗</div>
      <div id="mbs-layer-control">
        <label class="mbs-layer-label" style="display:block;height:24px;">
          <input type="checkbox" checked disabled />
          <span>鍩虹鍥惧眰</span>
        </label>
    `

    for (let index = 1; index < layers.length; index += 1) {
      const name = layers[index].name || `layer-${index}`
      this.controlLayers.push(name)
      html += `
        <label class="mbs-layer-label" style="display:block;height:24px;">
          <input type="checkbox" class="mbs-layer-checkbox" name="mbs-layer-item" value="${name}" checked />
          <span>${name}</span>
        </label>
      `
    }

    html += '</div>'
    panel.innerHTML = html
  }

  getHelpHtml(mode) {
    if (mode === 'mobile') {
      return `
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">鎿嶄綔璇存槑锛圡obile锛?/div>
        <div style="font-size:14px;line-height:1.8;">
          婕父鍦板浘锛氬崟鎸囨嫋鍔?br/>
          缂╂斁鍦板浘锛氬弻鎸囨崗鍚堢缉鏀?br/>
          鏃嬭浆瑙嗚锛氬弻鎸囧钩绉?鏃嬭浆
        </div>
      `
    }

    return `
      <div style="font-size:16px;font-weight:600;margin-bottom:8px;">鎿嶄綔璇存槑锛圥C锛?/div>
      <div style="font-size:14px;line-height:1.8;">
        婕父鍦板浘锛氬乏閿嫋鍔?br/>
        缂╂斁鍦板浘锛氭粴杞缉鏀?br/>
        鏃嬭浆瑙嗚锛氫腑閿嫋鍔?/ Ctrl + 宸﹂敭鎷栧姩
      </div>
    `
  }

  getSelectedCheckboxes() {
    const checkboxes = document
      .getElementById('mbs-layer-control')
      .querySelectorAll("input[type='checkbox']")
    const result = []
    for (let index = 0; index < checkboxes.length; index += 1) {
      if (checkboxes[index].checked) {
        result.push(checkboxes[index].value)
      }
    }
    return result
  }

  checkLayerControlChange() {
    const selected = this.getSelectedCheckboxes()
    const layers = this.viewer.viewer.imageryLayers._layers
    for (let index = 1; index < layers.length; index += 1) {
      layers[index].show = false
    }

    for (let index = 0; index < selected.length; index += 1) {
      const layerIndex = this.controlLayers.indexOf(selected[index])
      if (layerIndex !== -1) {
        layers[layerIndex + 1].show = true
      }
    }
  }

  adjustCamera(viewer) {
    const center = new Cesium.Cartesian2(
      Math.floor(viewer.canvas.clientWidth / 2),
      Math.floor(viewer.canvas.clientHeight / 2)
    )
    const ellipsoidPoint = viewer.scene.camera.pickEllipsoid(center)
    if (!Cesium.defined(ellipsoidPoint)) {
      return
    }

    const distance = Cesium.Cartesian3.distance(ellipsoidPoint, viewer.scene.camera.positionWC)
    const lonlat = this.toLonLat(ellipsoidPoint)
    lonlat[2] += distance

    viewer.camera.flyTo({
      destination: this.formLonLat(lonlat),
      duration: 1.5,
      orientation: {
        heading: Math.PI * 2,
        pitch: -Math.PI / 2,
        roll: 0
      }
    })
  }

  toLonLat(cartesian) {
    const cartographic = this.viewer.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian)
    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude),
      cartographic.height
    ]
  }

  formLonLat(lonlat) {
    return Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], lonlat[2])
  }
}

export default BaseWidgetRecovered


