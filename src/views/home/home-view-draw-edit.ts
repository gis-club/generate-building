import {
  GEManageRecovered,
  GeometryBRecovered,
  GEPickRecovered
} from './home-view-lib.ts'

/**
 * 区域绘制、右侧面板编辑和几何刷新逻辑。
 * “绘制区域”功能的核心实现集中在这里。
 */
function buildInstancesArr(finalData) {
  const instances = []

  for (const item of finalData) {
    const lonlats = JSON.parse(JSON.stringify(item.lonlats))
    const heights = []

    for (const point of lonlats) {
      heights.push(point[2])
      point.pop()
    }

    instances.push({
      pos: lonlats,
      color: item.color,
      height: item.extrudeHeight + item.minHeight,
      groundHeight: item.height + item.minHeight,
      id: item.id + '_build',
      heights
    })
  }

  return instances
}

/**
 * 解析测绘控件写入 DOM 的点位字符串，恢复为闭合多边形坐标。
 */
function parseLonlatsFromPosList(rawValue) {
  const segments = rawValue
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)

  const lonlats = []
  let minHeight = Number.POSITIVE_INFINITY

  for (const segment of segments) {
    const point = segment
      .split(',')
      .map((value) => parseFloat(value))
      .slice(0, 3)

    if (point.length < 3 || point.some((value) => Number.isNaN(value))) {
      continue
    }

    minHeight = Math.min(minHeight, point[2])
    lonlats.push(point)
  }

  if (lonlats.length < 3) {
    return null
  }

  lonlats.push([...lonlats[0]])

  return {
    lonlats,
    minHeight: Number.isFinite(minHeight) ? minHeight : 0
  }
}

/**
 * 删除草稿或中间项后，重新对几何体编号。
 */
function syncGeometryIds(finalData) {
  for (let index = 0; index < finalData.length; index++) {
    finalData[index].id = index
  }
}

const VERTEX_INSERT_SNAP_DISTANCE_PIXELS = 36

function buildPolylinePositions(lonlats = []) {
  return lonlats.map((point) => Cesium.Cartesian3.fromDegrees(point[0], point[1], point[2] || 0))
}

export const homeViewDrawEditMethods = {
  /**
   * 取消当前绘制流程，并回收草稿数据。
   */
  cancelCurrentDrawing(silent = false) {
    if (!this.drawingActive && this.drawingDraftId == null) return

    try {
      this.widgetObject?.clearAllMea?.()
    } catch (error) {
      console.warn('clear draw measure failed', error)
    }

    const draftId = this.drawingDraftId
    if (draftId != null && draftId < this.finalData.length) {
      this.finalData.splice(draftId, 1)
      syncGeometryIds(this.finalData)
      this.currId = this.finalData.length
    }

    this.drawingActive = false
    this.drawingDraftId = null
    document.body.style.cursor = ''

    if (!silent && typeof window.Mx === 'function') {
      window.Mx({ type: 'info', message: '已取消绘制区域' })
    }
  },
  deleteSingle(id) {
    this.finalData.splice(id, 1)
    for (let index = id; index < this.finalData.length; index++) {
      this.finalData[index].id--
    }
    this.currId--
    this.updateAll()
  },
  /**
   * 根据 `finalData` 全量重绘建筑模型。
   * 这是页面右侧参数修改后的统一刷新入口。
   */
  updateAll() {
    const geManage = new GEManageRecovered(window.myViewer)
    geManage.removePrimitiveCollection('mbs-basePolygon_build')
    geManage.removePrimitiveCollection('mbs-basePolygon-pointVertex')

    if (this.pickedPointEndFlag) {
      geManage.removePrimitiveCollection('mbs-basePolyline_build')
      geManage.removePrimitiveCollection('mbs-basePolyline-pointVertex')
    }

    if (this.myGeometry == null) {
      this.myGeometry = new GeometryBRecovered()
    }

    const instancesArr = buildInstancesArr(this.finalData)

    /**
     * 隐藏模式下只清理已有 primitive，不再重新生成建筑实体。
     * 这样“隐藏模型”与“线框模式”完全解耦。
     */
    if (this.modelMode === 'hidden') {
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
      return
    } else if (this.modelMode === 'vertex') {
      this.myGeometry.basePolygon({
        viewer: window.myViewer,
        signStr: 'build',
        translucent: false,
        shadows: false,
        instancesArr,
        polygonShow: false,
        polygonOutlineShow: true
      })

      if (this.pickedPointEndFlag) {
        this.myGeometry.basePolyline({
          viewer: window.myViewer,
          signStr: 'build',
          instancesArr,
          pointVertexShow: true,
          pointPixelSize: 12,
          pointOutlineWidth: 3,
          lineWidth: 18
        })
      }
    } else {
      this.myGeometry.basePolygon({
        viewer: window.myViewer,
        signStr: 'build',
        translucent: false,
        shadows: false,
        instancesArr
      })
    }

    this.$nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  },
  updateAllInput() {
    this.$nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  },
  adjustAllHeight(delta) {
    for (const item of this.finalData) {
      item.minHeight += delta
    }
    this.updateAll()
  },
  fold(flag) {
    for (const item of this.finalData) {
      item.panelShow = flag
    }
  },
  /**
   * 展开/收起单个右侧配置卡片时，给对应建筑加一圈高亮墙体。
   */
  updatePanel(id) {
    this.finalData[id].panelShow = !this.finalData[id].panelShow
    this.myGeoPickObject = new GEPickRecovered()

    const index = new GEManageRecovered(myViewer).containsByNameIndexOf('_build')[0]
    const primitive = myViewer.viewer.scene.primitives._primitives[index]._primitives[0]
    const pickedId = id + '_build'
    const pickedPrimitive = { primitive, id: pickedId }

    if (this.finalData[id].panelShow) {
      const panelLonlats = []
      for (const lonlat of this.finalData[id].lonlats) {
        panelLonlats.push([lonlat[0], lonlat[1]])
      }

      decomp.makeCCW(panelLonlats)
      const line = turf.lineString(panelLonlats)
      const offset = turf.lineOffset(line, 2, { units: 'meters' })
      const coordinates = offset.geometry.coordinates
      coordinates[coordinates.length] = coordinates[0]

      this.myGeoPickObject.dynamicWall({
        pickedPrimitive,
        pickedColor: '#FF6600',
        pickedHeight: this.finalData[id].minHeight + 15,
        pos: coordinates.flat(2),
        viewer: window.myViewer,
        oldPicked: this.oldPickedPrimitive,
        ripple: 15
      })
      this.oldPickedPrimitive.id = pickedId
    } else {
      this.myGeoPickObject.dynamicWall({
        pos: null,
        viewer: window.myViewer,
        oldPicked: this.oldPickedPrimitive
      })
    }

    this.$nextTick(() => {
      window.dispatchEvent(new Event('resize'))
    })
  },
  /**
   * `type === 0` 开始绘制多边形；`type === 1` 清空测量控件。
   */
  update(type) {
    if (type === 0) {
      if (!this.widgetObject?.drawPolygonMeaStart) return
      if (this.drawingActive) {
        this.cancelCurrentDrawing(true)
      }

      document.body.style.cursor = 'crosshair'
      this.pickedPoint = null
      this.drawingActive = true
      this.drawingDraftId = this.currId
      this.widgetObject.drawPolygonMeaStart({ type: 7 })
      this.finalData.push({
        id: this.currId,
        name: '几何体' + this.currId,
        height: '0',
        extrudeHeight: '20',
        style: '1',
        color: '#ffffff',
        lonlats: [],
        panelShow: true
      })
      this.endDrawEvent()
    }

    if (type === 1) {
      this.widgetObject.clearAllMea()
    }
  },
  setLonlats() {
    const posList = document.getElementById('posList')
    if (!posList) return false

    const parsed = parseLonlatsFromPosList(posList.innerHTML)
    const draftId = this.drawingDraftId ?? this.currId

    if (!parsed || draftId == null || draftId >= this.finalData.length) {
      return false
    }

    this.finalData[draftId].lonlats = parsed.lonlats
    this.finalData[draftId].minHeight = parsed.minHeight
    return true
  },
  /**
   * 监听双击结束事件，将测绘控件结果写回 `finalData`。
   */
  endDrawEvent() {
    this.widgetObject.handler.setInputAction(() => {
      const posList = document.getElementById('posList')
      const points = posList.innerHTML.split('/')
      points.splice(points.length - 2, 1)
      posList.innerHTML = points.join('/')

      const hasPolygon = this.setLonlats()
      if (!hasPolygon) {
        this.cancelCurrentDrawing(true)
        if (typeof window.Mx === 'function') {
          window.Mx({ type: 'warning', message: '至少绘制三个点后才能生成区域' })
        }
        return
      }

      this.updateAll()
      this.currId++
      this.drawingActive = false
      this.drawingDraftId = null
      this.update(1)
      this.widgetObject.handler.destroy()
      document.body.style.cursor = ''

      this.$nextTick(() => {
        if (this.$refs.scrollContainer) {
          this.$refs.scrollContainer.scrollTop = this.$refs.scrollContainer.scrollHeight
        }
      })
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  },
  simplifyCoord(tolerance) {
    if (!this.simFlag) {
      for (const item of this.finalData) {
        item.oldLonlats = item.lonlats
      }
      this.simFlag = true
    }

    if (this.simFlag) {
      for (const item of this.finalData) {
        let lonlats = item.oldLonlats
        let maxHeight = 0

        for (const lonlat of lonlats) {
          maxHeight = maxHeight > lonlat[2] ? maxHeight : lonlat[2]
        }

        const polygon = turf.polygon([lonlats])
        const simplified = turf.simplify(polygon, {
          tolerance,
          highQuality: true,
          mutate: true
        })

        lonlats = simplified.geometry.coordinates[0]
        for (const lonlat of lonlats) {
          lonlat[2] = maxHeight
        }
        item.lonlats = lonlats
      }
    }

    this.updateAll()
  },
  mapLeftClick(type) {
    const handler = new Cesium.ScreenSpaceEventHandler(myViewer.viewer.scene.canvas)
    const viewer = myViewer.viewer

    this.pickedPoint = null
    this.pickedPointEndFlag = true

    handler.setInputAction((event) => {
      if (this.drawingActive) return
      if (type !== 'map') return

      const picked = viewer.scene.pick(event.position)

      if (this.modelMode === 'vertex') {
        if (this.suppressNextVertexInsert) {
          this.suppressNextVertexInsert = false
          return
        }

        if (picked != null && picked.primitive instanceof Cesium.PointPrimitive) {
          return
        }

        let polygonIndex = -1
        if (picked != null && picked.id != null && !(picked.id instanceof Cesium.Entity)) {
          polygonIndex = parseInt(`${picked.id}`.split('_')[0])
        }

        if (this.insertVertexAtScreenPosition(event.position, polygonIndex)) {
          return
        }
      }

      if (picked == null || picked.id == null || picked.id instanceof Cesium.Entity) return
      if (picked.id.indexOf('_build') === -1) return

      if (picked.primitive instanceof Cesium.PointPrimitive) {
        return
      }

      if (picked.primitive instanceof Cesium.GroundPolylinePrimitive) {
        const ids = picked.id.split('_')
        const index = parseInt(ids[0])
        this.fold(false)
        this.updatePanel(index)
        this.$refs.scrollContainer.scrollTop = 60 * index
        return
      }

      const index = parseInt(picked.id.split('_')[0])
      this.fold(false)
      this.updatePanel(index)
      this.$refs.scrollContainer.scrollTop = 60 * index
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction((event) => {
      if (this.drawingActive) return
      if (type !== 'map' || this.modelMode !== 'vertex') return

      const picked = viewer.scene.pick(event.position)
      if (
        picked == null ||
        picked.id == null ||
        picked.id instanceof Cesium.Entity ||
        picked.id.indexOf('_build') === -1 ||
        !(picked.primitive instanceof Cesium.PointPrimitive)
      ) {
        return
      }

      this.pickedPoint = picked.primitive
      this.pickedPointEndFlag = false
      this.suppressNextVertexInsert = false
      this.pickedPoint.pixelSize = 14
      this.pickedPoint.outlineWidth = 4
      this.pickedPoint.color = Cesium.Color.ORANGE
      this.setVertexEditLock(true)
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    handler.setInputAction((event) => {
      if (this.drawingActive) return
      if (
        type !== 'map' ||
        this.modelMode !== 'vertex' ||
        this.pickedPoint == null ||
        this.pickedPointEndFlag
      ) {
        return
      }

      const endPosition = event.endPosition
      if (!Cesium.defined(endPosition)) return

      const ray = viewer.camera.getPickRay(endPosition)
      if (!Cesium.defined(ray)) return

      const globePoint = viewer.scene.globe.pick(ray, viewer.scene)
      if (!Cesium.defined(globePoint)) return

      this.syncPickedPoint(globePoint)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction((event) => {
      if (this.drawingActive) return
      if (
        type !== 'map' ||
        this.modelMode !== 'vertex' ||
        this.pickedPoint == null ||
        this.pickedPointEndFlag
      ) {
        return
      }

      const position = event.position || event.endPosition
      if (!Cesium.defined(position)) {
        this.pickedPointEndFlag = true
        this.setVertexEditLock(false)
        this.updateAll()
        return
      }

      const ray = viewer.camera.getPickRay(position)
      if (!Cesium.defined(ray)) {
        this.pickedPointEndFlag = true
        this.setVertexEditLock(false)
        this.updateAll()
        return
      }

      const globePoint = viewer.scene.globe.pick(ray, viewer.scene)
      if (!Cesium.defined(globePoint)) {
        this.pickedPointEndFlag = true
        this.setVertexEditLock(false)
        this.updateAll()
        return
      }

      this.syncPickedPoint(globePoint)
      this.pickedPointEndFlag = true
      this.setVertexEditLock(false)
      this.updateAll()
      this.pickedPoint = null
      this.suppressNextVertexInsert = true
    }, Cesium.ScreenSpaceEventType.LEFT_UP)

    handler.setInputAction((event) => {
      if (this.drawingActive) return
      if (type !== 'map' || this.modelMode !== 'vertex') return

      const picked = viewer.scene.pick(event.position)
      if (
        picked == null ||
        picked.id == null ||
        picked.id instanceof Cesium.Entity ||
        picked.id.indexOf('_build') === -1 ||
        !(picked.primitive instanceof Cesium.PointPrimitive)
      ) {
        return
      }

      const ids = `${picked.primitive.id}`.split('_')
      const pointIndex = parseInt(ids[0])
      const polygonIndex = parseInt(ids[1])
      if (Number.isNaN(pointIndex) || Number.isNaN(polygonIndex) || this.finalData[polygonIndex] == null) {
        return
      }

      if (this.finalData[polygonIndex].lonlats.length <= 4) {
        if (typeof window.Mx === 'function') {
          window.Mx({ type: 'warning', message: '区域至少保留三个顶点' })
        }
        return
      }

      this.finalData[polygonIndex].lonlats.splice(pointIndex, 1)
      if (pointIndex === 0) {
        this.finalData[polygonIndex].lonlats.splice(
          this.finalData[polygonIndex].lonlats.length - 1,
          1
        )
        this.finalData[polygonIndex].lonlats[this.finalData[polygonIndex].lonlats.length] =
          this.finalData[polygonIndex].lonlats[0]
      }

      this.pickedPoint = null
      this.pickedPointEndFlag = true
      this.setVertexEditLock(false)
      this.updateAll()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
  },
  insertVertexAtScreenPosition(screenPosition, preferredPolygonIndex = -1) {
    let match = this.checkIfPointOnPolyline(screenPosition, preferredPolygonIndex, true)
    if (match.insertAt < 0) {
      for (let index = 0; index < this.finalData.length; index++) {
        if (index === preferredPolygonIndex) continue
        const current = this.checkIfPointOnPolyline(screenPosition, index, true)
        if (current.insertAt < 0) continue
        if (match.insertAt < 0 || current.distance < match.distance) {
          match = current
        }
      }
    }

    if (match.insertAt < 0 || match.polygonIndex < 0) {
      return false
    }

    const lonlat = this.interpolateLonlatOnSegment(
      match.polygonIndex,
      match.insertAt,
      match.ratio
    )

    this.finalData[match.polygonIndex].lonlats.splice(match.insertAt + 1, 0, lonlat)
    this.updateAll()
    return true
  },
  checkIfPointOnPolyline(screenPosition, polygonIndex, withDistance = false) {
    const scene = myViewer?.viewer?.scene
    const lonlats = this.finalData[polygonIndex]?.lonlats
    if (!scene || !screenPosition || !Array.isArray(lonlats) || lonlats.length < 2) {
      return withDistance
        ? { polygonIndex, insertAt: -1, distance: Number.POSITIVE_INFINITY, ratio: 0.5 }
        : -1
    }

    const positions = buildPolylinePositions(lonlats)
    let insertAt = -1
    let minDistance = Number.POSITIVE_INFINITY
    let bestRatio = 0.5

    for (let index = 0; index < positions.length - 1; index++) {
      const start = Cesium.SceneTransforms.worldToWindowCoordinates(scene, positions[index])
      const end = Cesium.SceneTransforms.worldToWindowCoordinates(scene, positions[index + 1])
      if (!Cesium.defined(start) || !Cesium.defined(end)) continue

      const projection = this.projectPointToScreenSegment(screenPosition, start, end)
      if (projection.distance < minDistance) {
        minDistance = projection.distance
        insertAt = index
        bestRatio = projection.ratio
      }
    }

    const result = {
      polygonIndex,
      insertAt: minDistance > VERTEX_INSERT_SNAP_DISTANCE_PIXELS ? -1 : insertAt,
      distance: minDistance,
      ratio: bestRatio
    }

    return withDistance ? result : result.insertAt
  },
  projectPointToScreenSegment(point, start, end) {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const lengthSquared = deltaX * deltaX + deltaY * deltaY

    if (lengthSquared === 0) {
      return {
        distance: Math.hypot(point.x - start.x, point.y - start.y),
        ratio: 0
      }
    }

    const ratio =
      ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared
    const clampedRatio = Math.max(0, Math.min(1, ratio))
    const projectedX = start.x + deltaX * clampedRatio
    const projectedY = start.y + deltaY * clampedRatio

    return {
      distance: Math.hypot(point.x - projectedX, point.y - projectedY),
      ratio: clampedRatio
    }
  },
  interpolateLonlatOnSegment(polygonIndex, segmentIndex, ratio) {
    const lonlats = this.finalData[polygonIndex]?.lonlats
    if (!Array.isArray(lonlats) || lonlats[segmentIndex + 1] == null) {
      return [0, 0, 0]
    }

    const start = lonlats[segmentIndex]
    const end = lonlats[segmentIndex + 1]
    const safeRatio = Math.max(0.05, Math.min(0.95, ratio))

    return [
      parseFloat((start[0] + (end[0] - start[0]) * safeRatio).toFixed(6)),
      parseFloat((start[1] + (end[1] - start[1]) * safeRatio).toFixed(6)),
      parseFloat(((start[2] || 0) + ((end[2] || 0) - (start[2] || 0)) * safeRatio).toFixed(2))
    ]
  },
  setVertexEditLock(locked) {
    const controller = myViewer?.viewer?.scene?.screenSpaceCameraController
    if (!controller) return

    const enabled = !locked
    controller.enableRotate = enabled
    controller.enableTranslate = enabled
    controller.enableTilt = enabled
    controller.enableLook = enabled
  },
  syncPickedPoint(globePoint) {
    if (!Cesium.defined(globePoint) || this.pickedPoint == null) return false

    this.pickedPoint.position = globePoint

    const ids = `${this.pickedPoint.id}`.split('_')
    const pointIndex = parseInt(ids[0])
    const polygonIndex = parseInt(ids[1])
    if (Number.isNaN(pointIndex) || Number.isNaN(polygonIndex) || this.finalData[polygonIndex] == null) {
      return false
    }

    const lonlat = this.toLonLat(globePoint)
    this.finalData[polygonIndex].lonlats[pointIndex] = lonlat
    if (pointIndex === 0) {
      this.finalData[polygonIndex].lonlats[this.finalData[polygonIndex].lonlats.length - 1] = [...lonlat]
    }

    return true
  },
  toLonLat(cartesian) {
    const cartographic = myViewer.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian)
    let latitude = Cesium.Math.toDegrees(cartographic.latitude)
    let longitude = Cesium.Math.toDegrees(cartographic.longitude)
    let height = cartographic.height

    latitude = parseFloat(latitude.toFixed(6))
    longitude = parseFloat(longitude.toFixed(6))
    height = parseFloat(height.toFixed(2))

    return [longitude, latitude, height]
  }
}


