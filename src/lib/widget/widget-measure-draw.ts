/**
 * 测距、测面与绘制控件实现。
 */

import { defineRecoveredMethods } from '../recovered-sdk-types.ts'

export const measureDrawMethods = defineRecoveredMethods({
  constructor() {},

  drawMea(options) {
    this.viewer = options.viewer.viewer
    this.canvas = this.viewer.scene.canvas
    this.camera = this.viewer.scene.camera
    this.ellipsoid = this.viewer.scene.globe.ellipsoid
    this.scene = this.viewer.scene
    this.positions = []
    this.pointStyleType = options.pointStyleType == null ? 0 : options.pointStyleType
    this.pointStyle =
      options.pointStyle || {
        color: Cesium.Color.SKYBLUE,
        pixelSize: 10,
        outlineColor: Cesium.Color.YELLOW,
        outlineWidth: 3
      }
    this.pointIcon = options.pointIcon
    this.shapeEntity = null
    this.shapeXYZEntity = null
    this.polygonEntity = null
    this.polygonXYZEntity = null
    this.handler = null
    this.pointEntityArray = []
    this.labelEntityArray = []
    this.distances = []
    this.materialType = options.materialType == null ? 0 : options.materialType
    this.lineColor = options.lineColor || '#FF4500'
    this.lineOpacity = 90
    this.isGround = true
    this.lineWidth = options.lineWidth || 3
    this.totalFlag = options.totalFlag
    this.polygonColor = options.polygonColor || '#FF4500'
    this.polygonOpacity = options.polygonOpacity == null ? 0.4 : options.polygonOpacity
    this.polygonEndFlag = false
    this.posList = []
  },

  clearAllMea() {
    const viewer = this.viewer
    for (let index = 0; index < this.pointEntityArray.length; index += 1) {
      viewer.entities.remove(this.pointEntityArray[index])
    }
    for (let index = 0; index < this.labelEntityArray.length; index += 1) {
      viewer.entities.remove(this.labelEntityArray[index])
    }

    if (this.shapeEntity) viewer.entities.remove(this.shapeEntity)
    if (this.polygonEntity) viewer.entities.remove(this.polygonEntity)
    if (this.shapeXYZEntity) viewer.entities.remove(this.shapeXYZEntity)
    if (this.polygonXYZEntity) viewer.entities.remove(this.polygonXYZEntity)
    if (this.shapeXXXEntity) viewer.entities.remove(this.shapeXXXEntity)
    if (this.shapeYYYEntity) viewer.entities.remove(this.shapeYYYEntity)

    this.pointEntityArray = []
    this.labelEntityArray = []
    this.shapeEntity = null
    this.polygonEntity = null
    this.shapeXYZEntity = null
    this.polygonXYZEntity = null
    this.posXYZFlag = false
    this.polyXYZPos = []
    this.shapeXXXEntity = null
    this.shapeYYYEntity = null
    this.positions = []
    this.distances = []
    this.posList = []

    const posList = document.getElementById('posList')
    if (posList != null) {
      posList.innerHTML = ''
    }
  },

  drawLineMeaXYZStart(options) {
    this.clearAllMea()
    this.pointNum = 0
    this.drawMeaXYZCommon(options.type)
  },

  drawMeaXYZCommon(type) {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.canvas)
    this.handler.setInputAction((event) => {
      const ray = this.camera.getPickRay(event.position)
      if (!Cesium.defined(ray)) {
        return
      }

      const picked = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(picked)) {
        return
      }

      if (this.positions.length === 0) {
        this.positions.push(picked)
        this.createTemporaryShapeXYZ()
      }
      this.positions.push(picked)

      const point = this.createPoint(picked)
      this.pointEntityArray.push(point)
      this.pointNum += 1

      if (this.pointNum >= 2) {
        this.positions.pop()
        if (type === 0) {
          const a = this.getMidPointLonLat(this.positions[0], this.positions[1])
          const b = this.getMidPointLonLat(this.positions[1], this.positions[2])
          const c = this.getMidPointLonLat(this.positions[2], this.positions[0])
          this.labelEntityArray.push(this.addLabelDy(a.midPoint, `姘村钩璺濈锛?{a.distance}m`))
          this.labelEntityArray.push(this.addLabelDy(b.midPoint, `鍨傜洿璺濈锛?{b.distance}m`))
          this.labelEntityArray.push(this.addLabelDy(c.midPoint, `鐩寸嚎璺濈锛?{c.distance}m`))
        }
        this.handler.destroy()
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.handler.setInputAction((event) => {
      if (this.pointNum > 2) {
        return
      }

      const ray = this.camera.getPickRay(event.endPosition)
      if (!Cesium.defined(ray)) {
        return
      }

      const picked = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(picked) || this.positions.length === 0) {
        return
      }

      this.positions.pop()
      this.positions.push(picked)
      if (type !== 2) {
        this.setPosXYZ(this.positions, picked)
        if (this.posXYZFlag) {
          this.createTempPolygonXYZ()
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  },

  drawLineMeaStart(options) {
    this.clearAllMea()
    this.type = options.type == null ? 0 : options.type
    this.drawMeaCommon('Line')
  },

  drawPolygonMeaStart(options) {
    this.clearAllMea()
    this.type = options.type == null ? 0 : options.type
    this.drawMeaCommon('Polygon')
  },

  drawMeaCommon(mode) {
    const viewer = this.viewer
    this.handler = new Cesium.ScreenSpaceEventHandler(this.canvas)

    this.handler.setInputAction((event) => {
      const ray = this.camera.getPickRay(event.position)
      if (!Cesium.defined(ray)) {
        return
      }

      let picked = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(picked)) {
        return
      }

      this.isGround = true
      const scenePick = viewer.scene.pick(event.position)
      if (
        scenePick != null &&
        scenePick.id != null &&
        !(scenePick.id instanceof Cesium.Entity) &&
        scenePick.id.indexOf('_build') !== -1
      ) {
        let buildPosition = viewer.scene.pickPosition(event.position)
        const lonlat = this.toLonLat(buildPosition)
        lonlat[2] += 2
        this.isGround = false
        buildPosition = this.formLonLat(lonlat)
        picked = buildPosition
      }

      if (this.positions.length === 0) {
        this.positions.push(picked)
        this.createTemporaryShape()
      }
      this.positions.push(picked)

      const point = this.createPoint(picked)
      this.pointEntityArray.push(point)

      if ((this.type === 1 || this.type === 5) && this.pointEntityArray.length > 1) {
        const distance = this.getLength(
          this.positions[this.positions.length - 3],
          this.positions[this.positions.length - 2]
        )
        const midpoint = this.getMidpoint(
          this.positions[this.positions.length - 3],
          this.positions[this.positions.length - 2]
        )
        if (distance > 0) {
          this.distances.push(distance)
          this.labelEntityArray.push(this.addLabel(midpoint, distance, '娴嬭窛'))
        }
      }

      if (this.type === 3) {
        const text = `x: ${picked.x.toFixed(2)}\ny: ${picked.y.toFixed(2)}\nz: ${picked.z.toFixed(2)}`
        this.labelEntityArray.push(this.addLabelPoint(picked, text))
        const value = [
          parseFloat(picked.x.toFixed(2)),
          parseFloat(picked.y.toFixed(2)),
          parseFloat(picked.z.toFixed(2))
        ]
        this.posList.push(value)
        document.getElementById('posList').innerHTML += `[${value}],<br>`
      }

      if (this.type === 4) {
        const lonlat = this.toLonLat(picked)
        const text =
          `lon: ${lonlat[0].toFixed(6)}\nlat: ${lonlat[1].toFixed(6)}\nheight: ${lonlat[2].toFixed(2)}`
        this.labelEntityArray.push(this.addLabelPoint(picked, text))
        const value = [
          parseFloat(lonlat[0].toFixed(6)),
          parseFloat(lonlat[1].toFixed(6)),
          parseFloat(lonlat[2].toFixed(2))
        ]
        this.posList.push(value)
        document.getElementById('posList').innerHTML += `[${value}],<br>`
      }

      if (this.type === 7) {
        const lonlat = this.toLonLat(picked)
        const value = [
          parseFloat(lonlat[0].toFixed(6)),
          parseFloat(lonlat[1].toFixed(6)),
          parseFloat(lonlat[2].toFixed(2))
        ]
        this.posList.push(value)
        document.getElementById('posList').innerHTML += `${value}/`
        viewer.entities.remove(this.labelEntityArray[this.labelEntityArray.length - 1])
        this.labelEntityArray.pop()
        this.labelEntityArray.push(this.addLabelPointAngle(picked, '0掳'))
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.handler.setInputAction((event) => {
      const ray = this.camera.getPickRay(event.endPosition)
      if (!Cesium.defined(ray)) {
        return
      }

      let picked = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(picked) || this.positions.length === 0) {
        return
      }

      this.isGround = true
      const scenePick = this.viewer.scene.pick(event.endPosition)
      if (
        scenePick != null &&
        scenePick.id != null &&
        !(scenePick.id instanceof Cesium.Entity) &&
        scenePick.id.indexOf('_build') !== -1
      ) {
        let buildPosition = this.viewer.scene.pickPosition(event.endPosition)
        const lonlat = this.toLonLat(buildPosition)
        lonlat[2] += 2
        this.isGround = false
        buildPosition = this.formLonLat(lonlat)
        picked = buildPosition
      }

      this.positions.pop()
      this.positions.push(picked)

      if (this.type === 7) {
        if (this.positions.length === 2) {
          const start = this.toLonLat(this.positions[0])
          const end = this.toLonLat(this.positions[1])
          const angle = parseFloat(
            turf.bearing(turf.point([start[0], start[1]]), turf.point([end[0], end[1]])).toFixed(2)
          )
          viewer.entities.getById('mbs_mea_angle').label.text = `${angle}掳`
        }

        if (this.positions.length >= 3) {
          const a = this.toLonLat(this.positions[this.positions.length - 3])
          const b = this.toLonLat(this.positions[this.positions.length - 2])
          const c = this.toLonLat(this.positions[this.positions.length - 1])
          const bearing1 = turf.bearing(turf.point([b[0], b[1]]), turf.point([a[0], a[1]]))
          const bearing2 = turf.bearing(turf.point([b[0], b[1]]), turf.point([c[0], c[1]]))
          let angle = Math.abs(bearing1 - bearing2)
          if (angle > 180) {
            angle = 360 - angle
          }
          viewer.entities.getById('mbs_mea_angle').label.text = `${parseFloat(angle.toFixed(2))}掳`
        }

        const current = this.toLonLat(picked)
        const previous = this.toLonLat(this.positions[this.positions.length - 2])
        const currentPoint = turf.point([current[0], current[1]])
        const previousPoint = turf.point([previous[0], previous[1]])
        const bearing = turf.bearing(previousPoint, currentPoint)
        const distance = 200
        const options = { units: 'meters' as const }
        const top = turf.destination(currentPoint, distance, bearing, options).geometry.coordinates
        const bottom = turf.destination(currentPoint, distance, bearing - 180, options).geometry.coordinates
        const left = turf.destination(currentPoint, distance, bearing - 90, options).geometry.coordinates
        const right = turf.destination(currentPoint, distance, bearing - 270, options).geometry.coordinates

        this.positionsXXX = [
          this.formLonLat([bottom[0], bottom[1], current[2]]),
          this.formLonLat([top[0], top[1], current[2]])
        ]
        this.positionsYYY = [
          this.formLonLat([right[0], right[1], current[2]]),
          this.formLonLat([left[0], left[1], current[2]])
        ]
        if (this.shapeXXXEntity == null) {
          this.createTemporaryShapeAngle()
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    this.handler.setInputAction(() => {
      if (this.positions.length === 0) {
        return
      }

      if (this.positions.length === 2) {
        this.positions = []
      } else {
        this.positions.splice(this.positions.length - 2, 1)
      }

      viewer.entities.remove(this.pointEntityArray[this.pointEntityArray.length - 1])
      this.pointEntityArray.pop()

      if (this.type === 1 || this.type === 5) {
        viewer.entities.remove(this.labelEntityArray[this.labelEntityArray.length - 1])
        this.labelEntityArray.pop()
      }

      if (this.type === 3 || this.type === 4) {
        viewer.entities.remove(this.labelEntityArray[this.labelEntityArray.length - 1])
        this.labelEntityArray.pop()
        const posList = document.getElementById('posList')
        const parts = posList.innerHTML.split(',<br>')
        parts.splice(parts.length - 2, 1)
        posList.innerHTML = parts.join(',<br>')
      }

      if (this.type === 7) {
        const posList = document.getElementById('posList')
        const parts = posList.innerHTML.split('/')
        parts.splice(parts.length - 2, 1)
        posList.innerHTML = parts.join('/')
        viewer.entities.remove(this.labelEntityArray[this.labelEntityArray.length - 1])
        this.labelEntityArray.pop()
        this.labelEntityArray.push(
          this.addLabelPointAngle(this.positions[this.positions.length - 2], '0掳')
        )
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    this.handler.setInputAction(() => {
      if (this.positions.length < 4) {
        return
      }

      this.positions.pop()
      if (this.type === 5) {
        let total = 0
        for (let index = 0; index < this.distances.length; index += 1) {
          total += this.distances[index]
        }
        this.labelEntityArray.push(
          this.addLabel(this.positions[this.positions.length - 1], total, '鍚堣')
        )
      }

      if (mode === 'Polygon') {
        this.positions.pop()
        this.positions.pop()
        viewer.entities.remove(this.pointEntityArray[this.pointEntityArray.length - 1])
        this.pointEntityArray.pop()
        viewer.entities.remove(this.pointEntityArray[this.pointEntityArray.length - 1])
        this.pointEntityArray.pop()
        this.positions[this.positions.length] = this.positions[0]
        this.createTempPolygon()

        if (this.type === 2) {
          const area = this.getArea(this.positions)
          this.labelEntityArray.push(
            this.addLabel(this.positions[this.positions.length - 1], area, '闈㈢Н')
          )
        }
      }

      this.handler.destroy()
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  },

  createPoint(position) {
    if (this.pointStyleType === 0) {
      return this.viewer.entities.add({
        position,
        point: {
          show: true,
          color: this.pointStyle.color,
          pixelSize: this.pointStyle.pixelSize,
          outlineColor: this.pointStyle.outlineColor,
          outlineWidth: this.pointStyle.outlineWidth,
          scaleByDistance: new Cesium.NearFarScalar(15000, 1, 150000, 0.2)
        }
      })
    }

    return this.viewer.entities.add({
      position,
      billboard: {
        image: this.pointIcon,
        scale: 0.5,
        eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -10)),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        scaleByDistance: new Cesium.NearFarScalar(15000, 1, 150000, 0.2)
      }
    })
  },

  createTemporaryShape() {
    let material = null
    let width = 0
    switch (this.materialType) {
      case 0:
        material = Cesium.Color.fromCssColorString(this.lineColor).withAlpha(this.lineOpacity / 100)
        width = this.lineWidth
        break
      case 1:
        material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.5,
          color: Cesium.Color.fromCssColorString(this.lineColor).withAlpha(this.lineOpacity / 100)
        })
        width = this.lineWidth
        break
      case 2:
        material = new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString(this.lineColor), 1),
          gapColor: Cesium.Color.WHITE,
          dashLength: 100
        })
        width = 5
        break
    }

    this.shapeEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => (this.positions != null ? this.positions : null), false),
        clampToGround: this.isGround,
        width,
        material
      }
    })
  },

  createTemporaryShapeAngle() {
    const material = new Cesium.PolylineDashMaterialProperty({
      color: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString('#ffa700'), 0.2),
      gapColor: Cesium.Color.WHITE,
      dashLength: 64
    })

    this.shapeXXXEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(
          () => (this.positionsXXX != null ? this.positionsXXX : null),
          false
        ),
        clampToGround: this.isGround,
        width: 5,
        material
      }
    })

    this.shapeYYYEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(
          () => (this.positionsYYY != null ? this.positionsYYY : null),
          false
        ),
        clampToGround: this.isGround,
        width: 5,
        material
      }
    })
  },

  createTempPolygon() {
    this.polygonEntity = this.viewer.entities.add({
      polygon: {
        clampToGround: this.isGround,
        hierarchy: this.positions,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString(this.polygonColor).withAlpha(this.polygonOpacity)
        )
      }
    })
  },

  createTemporaryShapeXYZ() {
    let material = null
    let width = 0
    switch (this.materialType) {
      case 0:
        material = Cesium.Color.fromCssColorString(this.lineColor).withAlpha(this.lineOpacity / 100)
        width = this.lineWidth
        break
      case 1:
        material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.5,
          color: Cesium.Color.fromCssColorString(this.lineColor).withAlpha(this.lineOpacity / 100)
        })
        width = this.lineWidth
        break
      case 2:
        material = new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString(this.lineColor), 1),
          gapColor: Cesium.Color.WHITE,
          dashLength: 100
        })
        width = 5
        break
    }

    this.shapeXYZEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => (this.positions != null ? this.positions : null), false),
        clampToGround: false,
        width,
        material
      }
    })
  },

  createTempPolygonXYZ() {
    this.polygonXYZEntity = this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(
          () => new Cesium.PolygonHierarchy(this.polyXYZPos),
          false
        ),
        material: new Cesium.ColorMaterialProperty(Cesium.Color.ORANGE.withAlpha(1)),
        perPositionHeight: true
      }
    })
  },

  getLength(start, end) {
    const startCartographic = Cesium.Cartographic.fromCartesian(start)
    const endCartographic = Cesium.Cartographic.fromCartesian(end)
    const geodesic = new Cesium.EllipsoidGeodesic()
    geodesic.setEndPoints(startCartographic, endCartographic)
    return geodesic.surfaceDistance
  },

  getMidpoint(start, end) {
    const startCartographic = Cesium.Cartographic.fromCartesian(start)
    const endCartographic = Cesium.Cartographic.fromCartesian(end)
    const geodesic = new Cesium.EllipsoidGeodesic()
    geodesic.setEndPoints(startCartographic, endCartographic)
    return Cesium.Ellipsoid.WGS84.cartographicToCartesian(geodesic.interpolateUsingFraction(0.5))
  },

  bearing(start, end) {
    const a = Cesium.Cartographic.fromCartesian(start)
    const b = Cesium.Cartographic.fromCartesian(end)
    let angle = -Math.atan2(
      Math.sin(a.longitude - b.longitude) * Math.cos(b.latitude),
      Math.cos(a.latitude) * Math.sin(b.latitude) -
        Math.sin(a.latitude) * Math.cos(b.latitude) * Math.cos(a.longitude - b.longitude)
    )
    if (angle < 0) {
      angle += Math.PI * 2
    }
    return angle
  },

  pointAngle(a, b, c) {
    let angle = this.bearing(b, a) - this.bearing(b, c)
    if (angle < 0) {
      angle += Math.PI * 2
    }
    return angle
  },

  getArea(positions) {
    let area = 0
    for (let index = 0; index < positions.length - 2; index += 1) {
      const a = (index + 1) % positions.length
      const b = (index + 2) % positions.length
      const angle = this.pointAngle(positions[index], positions[a], positions[b])
      const lengthA = this.getLength(positions[a], positions[0])
      const lengthB = this.getLength(positions[b], positions[0])
      area += (lengthA * lengthB * Math.sin(angle)) / 2
    }
    return Math.abs(parseFloat((area / 1000000).toFixed(2)))
  }
})

export default measureDrawMethods


