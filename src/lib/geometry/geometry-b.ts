import geometryBuildMethods from './geometry-build.ts'
import geometryUtilsMethods from './geometry-utils.ts'
import type { RecoveredMethods, RecoveredRuntimeContext } from '../recovered-sdk-types.ts'
export { MaskTraceRecovered } from './geometry-mask-trace.ts'

type GeometryBAssignedMethods = RecoveredMethods<typeof geometryBuildMethods> &
  RecoveredMethods<typeof geometryUtilsMethods>

export interface GeometryBRecovered extends RecoveredRuntimeContext, GeometryBAssignedMethods {}

export class GeometryBRecovered {
  constructor() {
    if (typeof geometryBuildMethods.constructor === 'function') {
      geometryBuildMethods.constructor.call(this)
    }
  }
}

Object.assign(GeometryBRecovered.prototype, geometryBuildMethods, geometryUtilsMethods)

export default GeometryBRecovered

