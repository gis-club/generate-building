import {
  GeometryRecovered,
  GeometryBRecovered,
  GEManageRecovered
} from '../mbs-sdk-exports-core.ts'

import type { RecoveredRuntimeContext } from '../recovered-sdk-types.ts'

export interface GEPickRecovered extends RecoveredRuntimeContext {}

export class GEPickRecovered {
  constructor() {}

  fillColor(options) {
    this.pickedPrimitive = options.pickedPrimitive
    this.pickedColor = options.pickedColor
    this.oldPicked = options.oldPicked

    const pickedPrimitive = this.pickedPrimitive
    const pickedColor = this.pickedColor
    const oldPicked = this.oldPicked

    if (
      typeof pickedPrimitive.id === 'string' &&
      pickedPrimitive.primitive.geometryInstances.length > 1
    ) {
      if (oldPicked.id != null) {
        const oldAttributes = pickedPrimitive.primitive.getGeometryInstanceAttributes(oldPicked.id)
        oldAttributes.color = oldPicked.color
      }

      if (pickedPrimitive.id != null) {
        const attributes = pickedPrimitive.primitive.getGeometryInstanceAttributes(pickedPrimitive.id)
        this.oldPicked.color = attributes.color
        attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
          Cesium.Color.fromCssColorString(pickedColor)
        )
      }
    }
  }

  outCircle(options) {
    this.pickedPrimitive = options.pickedPrimitive
    this.pickedColor = options.pickedColor
    this.oldPicked = options.oldPicked
    this.pos = options.pos
    this.myViewer = options.viewer

    const pickedPrimitive = this.pickedPrimitive
    const pickedColor = this.pickedColor
    const oldPicked = this.oldPicked
    const pos = this.pos
    const myViewer = this.myViewer
    const geometry = new GeometryRecovered()
    const manage = new GEManageRecovered(myViewer)

    if (
      typeof pickedPrimitive.id === 'string' &&
      pickedPrimitive.primitive.geometryInstances.length > 1
    ) {
      if (oldPicked.id != null) {
        manage.removePrimitiveCollection('mbs-sphere_mbs_pick')
      }

      const instances = pickedPrimitive.primitive.geometryInstances
      let radius = 0
      for (let index = 0; index < instances.length; index += 1) {
        if (instances[index].id === pickedPrimitive.id) {
          radius = instances[index].geometry.boundingSphere.radius
          break
        }
      }

      geometry.sphere({
        viewer: myViewer,
        signStr: 'mbs_pick',
        size: radius,
        translucent: true,
        shadows: false,
        instancesArr: [{ pos, color: pickedColor, id: '1' }]
      })
    }
  }

  dynamicWall(options) {
    if (options.ripple == null) options.ripple = 1
    if (options.speed == null) options.speed = 1
    if (options.dir == null) options.dir = 1
    if (options.clockwise == null) options.clockwise = 1

    this.pickedPrimitive = options.pickedPrimitive
    this.pickedColor = options.pickedColor
    this.pickedHeight = options.pickedHeight
    this.oldPicked = options.oldPicked
    this.pos = options.pos
    this.myViewer = options.viewer
    this.ripple = options.ripple
    this.speed = options.speed
    this.dir = options.dir
    this.clockwise = options.clockwise

    const pickedColor = this.pickedColor
    const pickedHeight = this.pickedHeight
    const oldPicked = this.oldPicked
    const pos = this.pos
    const myViewer = this.myViewer
    const geometryB = new GeometryBRecovered()
    const manage = new GEManageRecovered(myViewer)

    if (oldPicked.id != null) {
      manage.removePrimitiveCollection('mbs-baseWall_mbs_pick')
    }

    if (pos != null) {
      geometryB.baseWall({
        viewer: myViewer,
        signStr: 'mbs_pick',
        translucent: true,
        geo: {
          pos,
          color: pickedColor,
          maxHeight: pickedHeight,
          num: this.ripple,
          speed: this.speed,
          dir: this.dir,
          clockwise: this.clockwise
        }
      })
    }
  }
}

export default GEPickRecovered

