import viewerCoreMethods from './viewer-core.ts'
import viewerLogoMethods from './viewer-logo.ts'
import viewerTerrainMethods from './viewer-terrain.ts'
import viewerCameraMethods from './viewer-camera.ts'

export class ViewerRecovered {
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

