/**
 * Cesium GroundPolyline / GroundPolygon 封装。
 */

import PrimitiveManagerRecovered from '../widget/widget-primitive-manager.ts'
import GeometryPrimitives from './geometry-primitives.ts'

type GeometryOptions = Record<string, any>

export class GeometryGround extends GeometryPrimitives {
  groundLine(options) {
    const primitive = this.commonGroundLineGeo(options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(
      `mbs-groundLine_${options.signStr}`,
      primitive,
      'PrimitiveCollection'
    )
  }

  commonGroundLineGeo(options) {
    const viewer = options.viewer.viewer
    viewer.scene.postProcessStages.fxaa.enabled = true

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      const geometry = new Cesium.GroundPolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(item.pos.flat(2)),
        width: item.width
      })

      item.color = item.color || this.getRandomHexColor()
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )

      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          attributes: { color },
          id: item.id
        })
      )
    }

    const shadows = options.shadows ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED
    let material
    const styleItem = options.instancesArr[0]
    if (styleItem.lineStyle === 0) {
      material = Cesium.Material.fromType('Color', {
        color: this.hexToRgba(styleItem.color, styleItem.alpha)
      })
    } else if (styleItem.lineStyle === 1) {
      material = Cesium.Material.fromType('PolylineGlow', {
        glowPower: 0.25,
        taperPower: 1,
        color: this.hexToRgba(styleItem.color, styleItem.alpha)
      })
    } else if (styleItem.lineStyle === 2) {
      material = Cesium.Material.fromType('PolylineDash', {
        color: this.hexToRgba(styleItem.color, styleItem.alpha)
      })
    } else if (styleItem.lineStyle === 3) {
      material = Cesium.Material.fromType('PolylineOutline', {
        color: this.hexToRgba(styleItem.color, styleItem.alpha),
        outlineColor: this.hexToRgba('#ffffff', 1),
        outlineWidth: 5
      })
    }

    return new Cesium.GroundPolylinePrimitive({
      geometryInstances: instances,
      appearance: new Cesium.PolylineMaterialAppearance({ material }),
      asynchronous: false,
      releaseGeometryInstances: false
    })
  }

  groundLine2(options) {
    const primitive = this.commonGroundLineGeo2(options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.nextLine2Primitive = primitive
    this.GEManage.addPrimitive(
      `mbs-groundLine2_${options.signStr}`,
      primitive,
      'PrimitiveCollection'
    )
  }

  updateGroundLine2(options) {
    if (this.nextLine2Primitive.ready) {
      this.GEManage.removePrimitive(`mbs-groundLine2_${options.signStr}`, 'mask')
      this.nextLine2Primitive.show = true
      this.groundLine2(options)
    }
  }

  commonGroundLineGeo2(options) {
    const viewer = options.viewer.viewer
    viewer.scene.postProcessStages.fxaa.enabled = true

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      const geometry = new Cesium.PolylineGeometry({
        vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
        positions: Cesium.Cartesian3.fromDegreesArray(item.pos.flat(2)),
        width: item.width
      })

      item.color = item.color || this.getRandomHexColor()
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )

      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          attributes: { color },
          id: item.id
        })
      )
    }

    const shadows = options.shadows ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED
    const styleItem = options.instancesArr[0]
    let material
    if (styleItem.lineStyle === 0) {
      material = Cesium.Material.fromType('Color', {
        color: this.hexToRgba(styleItem.color, styleItem.alpha)
      })
    } else if (styleItem.lineStyle === 1) {
      material = Cesium.Material.fromType('PolylineGlow', {
        glowPower: 0.25,
        taperPower: 1,
        color: this.hexToRgba(styleItem.color, styleItem.alpha)
      })
    } else if (styleItem.lineStyle === 2) {
      material = Cesium.Material.fromType('PolylineDash', {
        color: this.hexToRgba(styleItem.color, styleItem.alpha)
      })
    } else if (styleItem.lineStyle === 3) {
      material = Cesium.Material.fromType('PolylineOutline', {
        color: this.hexToRgba(styleItem.color, styleItem.alpha),
        outlineColor: this.hexToRgba('#ffffff', 1),
        outlineWidth: 5
      })
    }

    const primitive = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PolylineMaterialAppearance({ material }),
      asynchronous: false,
      releaseGeometryInstances: false,
      shadows
    })
    ;(primitive as unknown as GeometryOptions).id = 'mask'
    return primitive
  }

  groundPolygon(options) {
    const primitive = this.commonGroundGeo(options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(
      `mbs-groundPolygon_${options.signStr}`,
      primitive,
      'PrimitiveCollection'
    )
  }

  commonGroundGeo(options) {
    const viewer = options.viewer.viewer
    viewer.scene.postProcessStages.fxaa.enabled = true

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      const geometry = new Cesium.PolygonGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray([73, 53, 73, 0, 135, 0, 135, 53]),
          [new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(item.pos.flat(2)))]
        ),
        extrudedHeight: 10,
        height: 0
      })

      item.color = item.color || this.getRandomHexColor()
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )

      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          attributes: { color },
          id: item.id
        })
      )
    }

    return new Cesium.GroundPrimitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: options.translucent,
        flat: false
      }),
      asynchronous: false,
      releaseGeometryInstances: false
    })
  }

  groundPolygon2(options) {
    const primitive = this.commonGroundGeo2(options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.nextPoly2Primitive = primitive
    this.GEManage.addPrimitive(
      `mbs-groundPolygon2_${options.signStr}`,
      primitive,
      'PrimitiveCollection'
    )
  }

  updateGroundPolygon2(options) {
    if (this.nextPoly2Primitive.ready) {
      this.GEManage.removePrimitive(`mbs-groundPolygon2_${options.signStr}`, 'mask')
      this.nextPoly2Primitive.show = true
      this.groundPolygon2(options)
    }
  }

  commonGroundGeo2(options) {
    const viewer = options.viewer.viewer
    viewer.scene.postProcessStages.fxaa.enabled = true

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      const geometry = new Cesium.PolygonGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(item.pos.flat(2))
        ),
        extrudedHeight: item.height,
        height: 0
      })

      item.color = item.color || `${this.getRandomHexColor()}50`
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )

      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          attributes: { color },
          id: item.id
        })
      )
    }

    const primitive = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: options.translucent,
        flat: false
      }),
      asynchronous: false,
      releaseGeometryInstances: false,
      shadows: options.shadows ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED
    })
    ;(primitive as unknown as GeometryOptions).id = 'mask'
    return primitive
  }
}

export default GeometryGround


