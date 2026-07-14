import geometryPrimitiveMethods from './geometry-primitives.ts'
import geometryGroundMethods from './geometry-ground.ts'
import geometryUtilsMethods from './geometry-utils.ts'
import type { RecoveredMethods, RecoveredRuntimeContext } from '../recovered-sdk-types.ts'

type GeometryAssignedMethods = RecoveredMethods<typeof geometryPrimitiveMethods> &
  RecoveredMethods<typeof geometryGroundMethods> &
  RecoveredMethods<typeof geometryUtilsMethods>

export interface GeometryRecovered extends RecoveredRuntimeContext, GeometryAssignedMethods {}

export class GeometryRecovered {
  declare static GeometryB: typeof import('./geometry-b.ts').default

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

