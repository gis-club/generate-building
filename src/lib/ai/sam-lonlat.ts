/**
 * 将 SAM 返回的轮廓结果投射回 Cesium 场景。
 */

import {
  PrimitiveManagerRecovered,
  GELabelRecovered
} from '../mbs-sdk-exports-core.ts'
import { defineRecoveredMethods } from '../recovered-sdk-types.ts'

const SAM_MARKER_ICON = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#1677ff" d="M24 2c-8.284 0-15 6.716-15 15 0 10.5 15 29 15 29s15-18.5 15-29c0-8.284-6.716-15-15-15z"/><circle cx="24" cy="17" r="6.5" fill="#ffffff"/></svg>',
)}`

export const samLonLatMethods = defineRecoveredMethods({
  updateMyGeometry(mode) {
    const labelManager = new GELabelRecovered()

    if (mode === 1) {
      const primitiveManager = new PrimitiveManagerRecovered({ viewer: this.viewer })
      primitiveManager.removePrimitiveCollection('mbs-marker-label_fx')
      primitiveManager.removePrimitiveCollection('mbs-marker-billboard_fx')
      primitiveManager.removePrimitiveCollection('mbs-guideline_fx')
    }

    const lineInstances = []
    const polygonInstances = []
    for (let index = 0; index < this.samLonlats.length; index += 1) {
      const lonlats = this.samLonlats[index]
      lineInstances.push({
        pos: lonlats,
        color: '#ffa500',
        id: `${index}_mask`,
        alpha: 1,
        width: 3,
        lineStyle: 0
      })
      polygonInstances.push({
        pos: lonlats,
        height: 0.01,
        id: `${index}_mask`
      })

      if (labelManager) {
        labelManager.addMarker({
          viewer: { viewer: this.viewer },
          collectionId: 'fx',
          id: `label-${index}`,
          position: [lonlats[0][0], lonlats[0][1], 50],
          lineColor: '#0000ff',
          lineWidth: 2,
          icon: SAM_MARKER_ICON,
          text: `点${index}`,
          iconScale: 0.9
        })
      }
    }

    if (mode === 0) {
      this.myGeometry.groundLine2({
        viewer: { viewer: this.viewer },
        signStr: 'sam',
        translucent: true,
        instancesArr: lineInstances
      })
      this.myGeometry.groundPolygon2({
        viewer: { viewer: this.viewer },
        signStr: 'sam_poly',
        translucent: true,
        instancesArr: polygonInstances
      })
      return
    }

    this.myGeometry.updateGroundLine2({
      viewer: { viewer: this.viewer },
      signStr: 'sam',
      translucent: true,
      instancesArr: lineInstances
    })
    this.myGeometry.updateGroundPolygon2({
      viewer: { viewer: this.viewer },
      signStr: 'sam_poly',
      translucent: true,
      instancesArr: polygonInstances
    })
  }
})

export default samLonLatMethods


