import geometryPrimitiveMethods from './geometry-primitives.ts'
import geometryGroundMethods from './geometry-ground.ts'
import geometryUtilsMethods from './geometry-utils.ts'

export class GeometryRecovered {
  constructor() {
    if (typeof geometryPrimitiveMethods.constructor === 'function') {
      geometryPrimitiveMethods.constructor.call(this)
    }
  }
}

Object.assign(
  GeometryRecovered.prototype,
  geometryPrimitiveMethods,
  geometryGroundMethods,
  geometryUtilsMethods
)

export default GeometryRecovered

