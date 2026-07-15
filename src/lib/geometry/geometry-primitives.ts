/**
 * Cesium 基础 Primitive 构造工具。
 */

import PrimitiveManagerRecovered from '../widget/widget-primitive-manager.ts'
import GeometryUtils from './geometry-utils.ts'

export class GeometryPrimitives extends GeometryUtils {
  constructor() {
    super()
  }

  box(options) {
    const size = options.size
    const geometry = Cesium.BoxGeometry.createGeometry(
      new Cesium.BoxGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        maximum: new Cesium.Cartesian3(size[0], size[1], size[2]),
        minimum: new Cesium.Cartesian3(-size[0], -size[1], -size[2])
      })
    )

    const primitive = this.commonGeo(geometry, options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(`mbs-box_${options.signStr}`, primitive, 'PrimitiveCollection')
  }

  sphere(options) {
    const geometry = Cesium.SphereGeometry.createGeometry(
      new Cesium.SphereGeometry({
        radius: options.size,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      })
    )

    const primitive = this.commonGeo(geometry, options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(`mbs-sphere_${options.signStr}`, primitive, 'PrimitiveCollection')
  }

  cylinder(options) {
    const size = options.size
    const geometry = Cesium.CylinderGeometry.createGeometry(
      new Cesium.CylinderGeometry({
        length: size[2],
        topRadius: size[0],
        bottomRadius: size[1],
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      })
    )

    const primitive = this.commonGeo(geometry, options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(`mbs-cylinder_${options.signStr}`, primitive, 'PrimitiveCollection')
  }

  plane(options) {
    const geometry = Cesium.PlaneGeometry.createGeometry(
      new Cesium.PlaneGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      })
    )

    const primitive = this.commonGeo(geometry, options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(`mbs-plane_${options.signStr}`, primitive, 'PrimitiveCollection')
  }

  polyline(options) {
    const positions = []
    for (let index = 0; index < options.pos.length; index += 1) {
      positions.push(options.pos[index][0], options.pos[index][1])
    }

    const geometry = Cesium.PolylineGeometry.createGeometry(
      new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        width: options.width
      })
    )

    const primitive = this.commonGeo(geometry, options, '1')
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(`mbs-polyline_${options.signStr}`, primitive, 'PrimitiveCollection')
  }

  commonGeo(geometry, options, polylineFlag = null) {
    const viewer = options.viewer.viewer
    viewer.scene.postProcessStages.fxaa.enabled = true

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      item.scale = item.scale || [1, 1, 1]

      let matrix
      if (item.pos != null) {
        matrix = this.updateMatrix({
          scaleX: item.scale[0],
          scaleY: item.scale[1],
          scaleZ: item.scale[2],
          tx: item.pos[0],
          ty: item.pos[1],
          tz: item.pos[2],
          rx: 0,
          ry: 0,
          rz: 0
        })
      } else {
        matrix = Cesium.Matrix4.IDENTITY.clone()
      }

      item.color = item.color || this.getRandomHexColor()
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )

      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          modelMatrix: matrix,
          attributes: { color },
          id: item.id
        })
      )
    }

    const shadows = options.shadows ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED
    const appearance =
      polylineFlag === '1'
        ? new Cesium.PolylineMaterialAppearance({
            material: Cesium.Material.fromType('Color')
          })
        : new Cesium.PerInstanceColorAppearance({
            translucent: options.translucent,
            flat: false
          })

    return new Cesium.Primitive({
      geometryInstances: instances,
      appearance,
      asynchronous: false,
      releaseGeometryInstances: false,
      shadows
    })
  }
}

export default GeometryPrimitives


