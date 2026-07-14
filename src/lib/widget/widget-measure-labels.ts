/**
 * 测量标签、角度标签与坐标辅助转换逻辑。
 */

import { defineRecoveredMethods } from '../recovered-sdk-types.ts'

export const measureLabelMethods = defineRecoveredMethods({
  addLabel(position, value, type) {
    let text = ''
    if (type === '娴嬭窛' || type === '鍚堣') {
      text = value > 500 ? `${(value / 1000).toFixed(2)}km` : `${value.toFixed(2)}m`
    }
    if (type === '鍚堣') {
      text = `鍚堣锛?{text}`
    }
    if (type === '闈㈢Н') {
      text = `闈㈢Н锛?{value}km虏`
    }

    return this.viewer.entities.add({
      name: 'measurement-label',
      position,
      label: {
        text,
        font: '18px sans-serif',
        fillColor: Cesium.Color.BLACK,
        backgroundColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        showBackground: true,
        style: Cesium.LabelStyle.FILL,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(15000, 1, 150000, 0.2)
      }
    })
  },

  addLabelDy(position, text) {
    return this.viewer.entities.add({
      name: 'measurement-label-dynamic',
      position,
      label: {
        text,
        font: '18px sans-serif',
        fillColor: Cesium.Color.BLACK,
        backgroundColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        showBackground: true,
        style: Cesium.LabelStyle.FILL,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(15000, 1, 150000, 0.2)
      }
    })
  },

  addLabelPoint(position, text) {
    return this.viewer.entities.add({
      name: 'position-label',
      position,
      label: {
        text,
        font: '18px sans-serif',
        fillColor: Cesium.Color.BLACK,
        backgroundColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        showBackground: true,
        style: Cesium.LabelStyle.FILL,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(15000, 1, 150000, 0.2)
      }
    })
  },

  addLabelPointAngle(position, text) {
    return this.viewer.entities.add({
      id: 'mbs_mea_angle',
      name: 'angle-label',
      position,
      label: {
        text,
        font: 'bold 18px sans-serif',
        fillColor: Cesium.Color.BLACK,
        backgroundColor: Cesium.Color.WHITE.withAlpha(0.4),
        outlineWidth: 2,
        showBackground: true,
        style: Cesium.LabelStyle.FILL,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(15000, 1, 150000, 0.2)
      }
    })
  },

  setPosXYZ(positions, current) {
    const start = positions[0]
    const end = current
    const startLonLat = this.toLonLat(start)
    const endLonLat = this.toLonLat(end)
    const lowHeight = Math.min(startLonLat[2], endLonLat[2])
    const highHeight = Math.max(startLonLat[2], endLonLat[2])
    const topPoint = startLonLat[2] > endLonLat[2] ? endLonLat : startLonLat

    if (this.posXYZFlag === true) {
      positions.pop()
      positions.pop()
    }
    positions.pop()

    topPoint[2] = highHeight
    const middle = this.formLonLat(topPoint)
    positions.push(middle, end, start)

    const bearing = turf.bearing(
      turf.point([startLonLat[0], startLonLat[1]]),
      turf.point([endLonLat[0], endLonLat[1]])
    )
    const vertical = Cesium.Cartesian3.distance(start, middle)
    const horizontal = Cesium.Cartesian3.distance(middle, end)
    const shortEdge = Math.min(vertical, horizontal) * 0.3 * 0.001
    const offset = startLonLat[2] > endLonLat[2] ? -shortEdge : shortEdge
    const marker = turf.destination(
      turf.point([topPoint[0], topPoint[1]]),
      offset,
      bearing,
      { units: 'kilometers' }
    )

    this.polyXYZPos = Cesium.Cartesian3.fromDegreesArrayHeights([
      topPoint[0],
      topPoint[1],
      highHeight,
      topPoint[0],
      topPoint[1],
      highHeight - shortEdge * 1000,
      marker.geometry.coordinates[0],
      marker.geometry.coordinates[1],
      highHeight - shortEdge * 1000,
      marker.geometry.coordinates[0],
      marker.geometry.coordinates[1],
      highHeight
    ])
    this.posXYZFlag = true
  },

  toLonLat(cartesian) {
    const cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian)
    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude),
      cartographic.height
    ]
  },

  formLonLat(lonlat) {
    return Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], lonlat[2])
  },

  getMidPointLonLat(start, end) {
    const a = this.toLonLat(start)
    const b = this.toLonLat(end)
    const lowHeight = Math.min(a[2], b[2])
    let midpoint
    let distance

    if (a[0].toFixed(10) === b[0].toFixed(10) && a[1].toFixed(10) === b[1].toFixed(10)) {
      distance = Math.abs(a[2] - b[2])
      midpoint = this.formLonLat([a[0], a[1], lowHeight + distance / 2])
      distance = parseFloat(distance.toFixed(2))
    } else {
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2] + b[2] / 2]
      if (a[2].toFixed(6) === b[2].toFixed(6)) {
        mid[2] = a[2]
      } else {
        mid[2] = lowHeight + Math.abs(a[2] - b[2]) / 2
      }
      midpoint = this.formLonLat(mid)
      distance = parseFloat(Cesium.Cartesian3.distance(start, end).toFixed(2))
    }

    return { midPoint: midpoint, distance }
  }
})

export default measureLabelMethods


