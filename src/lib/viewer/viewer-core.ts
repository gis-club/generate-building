/**
 * Viewer 核心初始化逻辑。
 */

export const viewerCoreMethods = {
  constructor(container, options = {}) {
    window.Cesium.Ion.defaultAccessToken = options.ionToken

    this.terrain = options.terrain
    if (options.terrain == null) {
      this.terrain = {
        terrainFlag: false,
        terrainScale: 1,
        oceanFlag: false,
        terrainType: 'real'
      }
    } else if (options.terrain.terrainScale == null) {
      this.terrain.terrainScale = 1
    }

    if (options.backGroundColor != null) {
      this.backGroundColor = options.backGroundColor
    }

    this.sunLightFlag = options.sunLightFlag
    this.animateFlag = options.animateFlag
    this.animateSpeed = options.animateSpeed
    this.globeFlag = options.globeFlag == null ? true : options.globeFlag
    this.timeline = options.timeline == null ? false : options.timeline
    this.shadows = options.shadows == null ? true : options.shadows
    this.viewer = this.initMap(container)
  },

  initMap(container) {
    const ellipsoidRadii = [6378137, 6378137, 6356752314245179e-9]
    Cesium.Ellipsoid.WGS84 = Object.freeze(
      new Cesium.Ellipsoid(ellipsoidRadii[0], ellipsoidRadii[1], ellipsoidRadii[2])
    )

    let terrainProvider = null
    if (
      this.terrain.terrainFlag &&
      (this.terrain.terrainType === 'real' || this.terrain.terrainType == null)
    ) {
      terrainProvider = Cesium.Terrain.fromWorldTerrain({
        requestWaterMask: this.terrain.oceanFlag,
        requestVertexNormals: this.terrain.terrainFlag
      })
    }

    const viewer = new Cesium.Viewer(container, {
      terrain: terrainProvider,
      homeButton: false,
      geocoder: false,
      baseLayerPicker: false,
      animation: false,
      timeline: this.timeline,
      fullscreenButton: false,
      infoBox: false,
      sceneModePicker: false,
      navigationInstructionsInitiallyVisible: false,
      navigationHelpButton: false,
      selectionIndicator: false,
      shadows: this.shadows,
      contextOptions: { requestWebgl2: true }
    })

    viewer.scene.verticalExaggeration = this.terrain.terrainScale
    viewer.scene.postProcessStages.fxaa.enabled = true
    viewer.scene.globe.depthTestAgainstTerrain = true
    viewer._cesiumWidget._creditContainer.style.display = 'none'
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    )
    viewer.camera.percentageChanged = 0.01

    if (this.sunLightFlag) {
      viewer.scene.globe.enableLighting = true
    }

    if (this.animateFlag) {
      viewer.clock.shouldAnimate = true
      viewer.clock.multiplier = this.animateSpeed
    }

    if (this.backGroundColor != null) {
      viewer.scene.skyBox.show = false
      viewer.scene.sun.show = false
      viewer.scene.moon.show = false
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(this.backGroundColor)
    }

    if (this.globeFlag === false) {
      viewer.scene.globe.show = false
      viewer.scene.skyAtmosphere.show = false
    }

    if (this.terrain.terrainFlag && this.terrain.terrainType === 'noise') {
      this.noiseTerrainProvider(viewer)
    }
    if (this.terrain.terrainFlag && this.terrain.terrainType === 'sineY') {
      this.sineTerrainProviderY(viewer)
    }
    if (this.terrain.terrainFlag && this.terrain.terrainType === 'sineXY') {
      this.sineTerrainProviderXY(viewer)
    }

    this.addLogo(viewer)
    return viewer
  },

  updateViewer(options = {}) {
    const viewer = this.viewer
    viewer.scene.globe.show = options.globeFlag
    viewer.scene.skyAtmosphere.show = options.globeFlag

    if (options.backGroundColor != null) {
      viewer.scene.skyBox.show = false
      viewer.scene.sun.show = false
      viewer.scene.moon.show = false
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(options.backGroundColor)
    }
  }
}

export default viewerCoreMethods


