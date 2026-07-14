import viewerCoreMethods from './viewer-core.ts'
import viewerLogoMethods from './viewer-logo.ts'
import viewerTerrainMethods from './viewer-terrain.ts'
import viewerCameraMethods from './viewer-camera.ts'
import type { RecoveredMethods, RecoveredRuntimeContext } from '../recovered-sdk-types.ts'

type ViewerAssignedMethods = RecoveredMethods<typeof viewerCoreMethods> &
  RecoveredMethods<typeof viewerLogoMethods> &
  RecoveredMethods<typeof viewerTerrainMethods> &
  RecoveredMethods<typeof viewerCameraMethods>

export interface ViewerRecovered extends RecoveredRuntimeContext, ViewerAssignedMethods {}

export class ViewerRecovered {
  declare static Layer: typeof import('./layer.ts').default

  constructor(container, options) {
    viewerCoreMethods.constructor.call(this, container, options)
  }
}

Object.assign(
  ViewerRecovered.prototype,
  viewerCoreMethods,
  viewerLogoMethods,
  viewerTerrainMethods,
  viewerCameraMethods
)

export default ViewerRecovered

