import { GEManageRecovered, GeometryBRecovered } from './home-view-lib.ts'

/**
 * 导入、导出和三维预览相关逻辑。
 * 这里保留 GeoJSON 导出和 glTF 预览能力。
 */
import { defineRecoveredMethods } from '../../lib/recovered-sdk-types.ts'
import {
  AmbientLight,
  ExtrudeGeometry,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  Shape,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

export const homeViewExportMethods = defineRecoveredMethods({
  /**
   * 生成时间戳文件名，避免多次导出重名。
   */
  getCurrentDateTimeString() {
    const current = new Date()
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const day = String(current.getDate()).padStart(2, '0')
    const hour = String(current.getHours()).padStart(2, '0')
    const minute = String(current.getMinutes()).padStart(2, '0')
    const second = String(current.getSeconds()).padStart(2, '0')

    return `${year}${month}${day}${hour}${minute}${second}`
  },
  /**
   * 导出当前全部建筑，或导出局部相对坐标数据。
   */
  exportJson(type) {
    const fileName =
      type === 0
        ? 'build_' + this.getCurrentDateTimeString() + '.json'
        : 'part_' + this.getCurrentDateTimeString() + '.json'

    const geoJson = this.convertGeoJson(type)
    if (geoJson == null) return

    const content = JSON.stringify(geoJson, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.setAttribute('download', fileName)
    link.setAttribute('href', href)
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(href)
    }, 0)
  },
  /**
   * 将外部 GeoJSON 转换为页面内部统一的 `finalData` 结构。
   */
  convertDefaultJson(json) {
    const data = JSON.parse(JSON.stringify(json))
    const features = []

    for (const feature of data.features) {
      features.push({
        id: feature.properties.id,
        name: feature.properties.name,
        height: feature.properties.height,
        extrudeHeight: feature.properties.extrudeHeight,
        style: feature.properties.style,
        color: feature.properties.color,
        lonlats: feature.geometry.coordinates[0],
        panelShow: feature.properties.panelShow,
        minHeight: feature.properties.minHeight
      })
    }

    return features
  },
  convertGeoJson(type) {
    const sourceData = type === 0 ? JSON.parse(JSON.stringify(this.finalData)) : this.convertJson()
    const collectionIndex =
      new GEManageRecovered(myViewer).containsByNameIndexOf('mbs-basePolygon_build')[0]

    if (collectionIndex == null) {
      Mx({ title: '警告', message: '请先切换到预览模型模式后再导出', type: 'warning' })
      return
    }

    const boundingSpheres =
      myViewer.viewer.scene.primitives._primitives[collectionIndex]._primitives[0]._boundingSpheres
    const center = this.toLonLat(boundingSpheres[0].center)
    const geoJson = {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
          center
        }
      },
      features: []
    }

    let minHeight = 10000

    for (const item of sourceData) {
      geoJson.features.push({
        geometry: { coordinates: [item.lonlats], type: 'Polygon' },
        properties: {
          id: item.id,
          name: item.name,
          color: item.color,
          height: item.height,
          extrudeHeight: item.extrudeHeight,
          minHeight: item.minHeight,
          panelShow: item.panelShow,
          style: item.style
        },
        type: 'Feature'
      })

      minHeight = item.minHeight > minHeight ? minHeight : item.minHeight
    }

    geoJson.crs.properties.center[2] = minHeight
    return geoJson
  },
  convertJson() {
    const data = JSON.parse(JSON.stringify(this.finalData))
    const collectionIndex =
      new GEManageRecovered(myViewer).containsByNameIndexOf('mbs-basePolygon_build')[0]
    if (collectionIndex == null) return

    const boundingSpheres =
      myViewer.viewer.scene.primitives._primitives[collectionIndex]._primitives[0]._boundingSpheres
    const center = this.toLonLat(boundingSpheres[0].center)

    for (const item of data) {
      for (let index = 0; index < item.lonlats.length; index++) {
        item.lonlats[index] = this.convertPartXY([center[0], center[1]], item.lonlats[index])
      }
    }

    return data
  },
  convertPartXY(center, lonlat) {
    const startLon = turf.point([center[0], center[1]])
    const endLon = turf.point([lonlat[0], center[1]])
    const endLat = turf.point([center[0], lonlat[1]])
    const options = { units: 'meters' as const }

    let x = turf.distance(startLon, endLon, options)
    let y = turf.distance(startLon, endLat, options)

    if (lonlat[0] < center[0]) x = -x
    if (lonlat[1] < center[1]) y = -y

    return [x, y, lonlat[2]]
  },
  convertPartXY2(center, lonlat) {
    const start = Cesium.Cartesian3.fromDegrees(center[0], center[1])
    const end = Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1])
    const delta = Cesium.Cartesian3.subtract(end, start, new Cesium.Cartesian3())
    return [delta.x, delta.y, delta.z]
  },
  add3DTiles(url, matrix, viewer) {
    Cesium.Cesium3DTileset.fromUrl(url, {
      debugColorizeTiles: false,
      debugFreezeFrame: false,
      enableDebugWireframe: false,
      debugWireframe: false,
      debugShowBoundingVolume: false,
      debugShowContentBoundingVolume: false,
      debugShowViewerRequestVolume: false,
      debugShowRenderingStatistics: false,
      debugShowMemoryUsage: false,
      debugShowUrl: false
    }).then((tileset) => {
      tileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.HIGHLIGHT
      const primitive = viewer.scene.primitives.add(tileset)
      if (matrix != null) {
        primitive._root.transform = new GeometryBRecovered().updateMatrix(matrix)
      }
      viewer.flyTo(primitive)
      console.log('All tiles are loaded，加载完成')
      return primitive
    })
  },
  async initThree(geoJson) {
    const scene = new Scene()
    const camera = new PerspectiveCamera(
      75,
      this.$refs.threeContainer.offsetWidth / this.$refs.threeContainer.offsetHeight,
      0.1,
      10000
    )
    camera.position.set(100, 400, 400)
    camera.lookAt(0, 0, 0)

    const renderer = new WebGLRenderer()
    renderer.setSize(this.$refs.threeContainer.offsetWidth, this.$refs.threeContainer.offsetHeight)
    this.renderer = renderer
    this.$refs.threeContainer.appendChild(renderer.domElement)

    this.processGeoJSON(geoJson, scene)

    const light = new PointLight(16777215, 2000000, 50000)
    light.position.set(0, 100, 0)
    scene.add(light)

    const ambient = new AmbientLight(4210752, 100)
    scene.add(ambient)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = true
    controls.enablePan = true

    this.scene = scene

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }

    animate()
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    })
  },
  async loadGeoJSON(url) {
    return await (await fetch(url)).json()
  },
  processGeoJSON(geoJson, scene) {
    geoJson.features.forEach((feature) => {
      if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') return

      const geometry = this.createExtrudeGeometry(
        feature.geometry,
        feature.properties.extrudeHeight
      )
      const material = new MeshPhongMaterial({ color: feature.properties.color })
      const mesh = new Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2
      scene.add(mesh)
    })
  },
  createExtrudeGeometry(geometry, depth) {
    const shape = this.convertGeoJSONToShape(geometry)
    return new ExtrudeGeometry(shape, {
      steps: 1,
      depth,
      bevelEnabled: false,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0,
      bevelSegments: 1
    })
  },
  convertGeoJSONToShape(geometry) {
    const shape = new Shape()
    const coordinates =
      geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0]

    coordinates.forEach((point, index) => {
      const [x, y] = point
      if (index === 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
    })

    shape.closePath()
    return shape
  },
  exportGltf() {
    const geoJson = this.convertGeoJson(1)
    if (geoJson == null) return

    this.initThree(geoJson)
    new GLTFExporter().parse(
      this.scene,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' })
        const href = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = href
        link.download = 'model_' + this.getCurrentDateTimeString() + '.gltf'
        link.click()

        this.destroyScene()
      },
      { binary: false }
    )
  },
  destroyScene() {
    const meshes = []
    this.scene.traverse((node) => {
      if (node.isMesh) meshes.push(node)
    })

    meshes.forEach((mesh) => {
      this.scene.remove(mesh)
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) mesh.material.dispose()
    })

    this.renderer.dispose()
    this.renderer.domElement = null
    this.$refs.threeContainer.children[0].remove()
  }
})

