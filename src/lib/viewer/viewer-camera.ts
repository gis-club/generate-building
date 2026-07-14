/**
 * Viewer 相机与坐标换算能力。
 */

import { defineRecoveredMethods } from '../recovered-sdk-types.ts'

export const viewerCameraMethods = defineRecoveredMethods({
  locationCenter(options) {
    const viewer = this.viewer
    if (options.pos[2] == null) {
      options.pos[2] = 0
    }

    const destination = Cesium.Cartesian3.fromDegrees(options.pos[0], options.pos[1], options.pos[2])
    if (Cesium.defined(destination)) {
      let distance = Cesium.Cartesian3.distance(destination, viewer.scene.camera.positionWC)
      if (options.distance != null) {
        distance = options.distance
      }

      const heading = Cesium.Math.toRadians(options.headingAngle)
      const pitch = Cesium.Math.toRadians(options.pitchAngle)
      viewer.scene.camera.lookAt(destination, new Cesium.HeadingPitchRange(heading, pitch, distance))
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
    }
  },

  flyToBoundingSphere(options) {
    const viewer = this.viewer
    const sphere = new Cesium.BoundingSphere(
      Cesium.Cartesian3.fromDegrees(options.pos[0], options.pos[1], options.pos[2]),
      options.distance
    )
    const heading = Cesium.Math.toRadians(options.headingAngle)
    const pitch = Cesium.Math.toRadians(options.pitchAngle)
    const distance = sphere.radius / Math.sin(viewer.camera.frustum.fov / 2)

    viewer.camera.flyToBoundingSphere(sphere, {
      duration: 2,
      offset: new Cesium.HeadingPitchRange(heading, pitch, distance)
    })
  },

  getBoundingSphere(points) {
    const cartesianPoints = []
    for (let index = 0; index < points.length; index += 2) {
      cartesianPoints.push(Cesium.Cartesian3.fromDegrees(points[index], points[index + 1]))
    }
    return Cesium.BoundingSphere.fromPoints(cartesianPoints)
  },

  createCustomCamera(options) {
    const scene = this.viewer.scene
    const camera = new Cesium.Camera(scene)

    camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(options.pos[0], options.pos[1], options.pos[2]),
      orientation: {
        heading: Cesium.Math.toRadians(options.headingAngle),
        pitch: Cesium.Math.toRadians(options.pitchAngle),
        roll: Cesium.Math.toRadians(options.rollAngle)
      }
    })

    camera.frustum = new Cesium.PerspectiveFrustum({
      fov: Cesium.Math.toRadians(options.frustum.fov),
      aspectRatio: 1,
      near: options.frustum.near,
      far: options.frustum.far
    })

    new Cesium.DebugCameraPrimitive({ camera, color: Cesium.Color.RED, show: true })
    return camera
  },

  createReflectorCamera() {
    const scene = this.viewer.scene
    const mainCamera = this.viewer.scene.camera
    const lonlat = this.toLonLat(mainCamera.position)
    const reflectedHeight = 1000 - (lonlat[2] - 1000)
    const reflectedPosition = this.formLonLat([lonlat[0], lonlat[1], reflectedHeight])
    const camera = new Cesium.Camera(scene)

    camera.setView({
      destination: reflectedPosition,
      orientation: {
        heading: mainCamera.heading,
        pitch: mainCamera.pitch,
        roll: mainCamera.roll
      }
    })
    camera.frustum = mainCamera.frustum

    const primitive = new Cesium.DebugCameraPrimitive({
      camera,
      color: Cesium.Color.RED,
      show: true
    })
    scene.primitives.add(primitive)
    return camera
  },

  toLonLat(cartesian) {
    const cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian)
    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude),
      cartographic.height
    ]
  },

  formLonLat(lonlat) {
    return Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], lonlat[2])
  }
})

export default viewerCameraMethods


