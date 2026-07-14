import { defineRecoveredMethods } from '../recovered-sdk-types.ts'

export const geometryUtilsMethods = defineRecoveredMethods({
  getRandomHexColor() {
    const red = Math.floor(Math.random() * 256).toString(16)
    const green = Math.floor(Math.random() * 256).toString(16)
    const blue = Math.floor(Math.random() * 256).toString(16)
    return `#${red.padStart(2, '0')}${green.padStart(2, '0')}${blue.padStart(2, '0')}`
  },

  updateMatrix(options) {
    const rx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(options.rx))
    const ry = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(options.ry))
    const rz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(options.rz))
    const matrixX = Cesium.Matrix4.fromRotationTranslation(rx)
    const matrixY = Cesium.Matrix4.fromRotationTranslation(ry)
    const matrixZ = Cesium.Matrix4.fromRotationTranslation(rz)
    const position = Cesium.Cartesian3.fromDegrees(options.tx, options.ty, options.tz)
    const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(position)

    Cesium.Matrix4.multiply(matrix, matrixX, matrix)
    Cesium.Matrix4.multiply(matrix, matrixY, matrix)
    Cesium.Matrix4.multiply(matrix, matrixZ, matrix)

    const scale = Cesium.Matrix4.fromScale(
      new Cesium.Cartesian3(options.scaleX, options.scaleY, options.scaleZ)
    )
    return Cesium.Matrix4.multiply(matrix, scale, matrix)
  },

  hexToRgba(hex, alpha) {
    let value = hex
    if (value.slice(0, 1) === '#') {
      value = value.slice(1)
    }

    if (value.length !== 6) {
      throw new Error('Invalid hex color format')
    }

    const red = parseInt(value.slice(0, 2), 16)
    const green = parseInt(value.slice(2, 4), 16)
    const blue = parseInt(value.slice(4, 6), 16)
    return new Cesium.Color(red / 255, green / 255, blue / 255, alpha)
  }
})

export default geometryUtilsMethods
