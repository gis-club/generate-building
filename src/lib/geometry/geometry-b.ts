import geometryBuildMethods from './geometry-build.ts'
import geometryUtilsMethods from './geometry-utils.ts'
export { MaskTraceRecovered } from './geometry-mask-trace.ts'

export class GeometryBRecovered {
  constructor() {
    if (typeof geometryBuildMethods.constructor === 'function') {
      geometryBuildMethods.constructor.call(this)
    }
  }
}

Object.assign(GeometryBRecovered.prototype, geometryBuildMethods, geometryUtilsMethods)

export default GeometryBRecovered

