/**
 * 自定义地形相关辅助方法。
 */

export const viewerTerrainMethods = {
  noiseTerrainProvider(viewer) {
    const terrainProvider = new Cesium.CustomHeightmapTerrainProvider({
      width: 32,
      height: 32,
      callback(x, y, level) {
        function fract(value) {
          return value - Math.floor(value)
        }
        function smooth(value) {
          return value * value * (3 - 2 * value)
        }
        function random(nx, ny) {
          const px = 50 * fract(nx * 0.3183099 + 0.71)
          const py = 50 * fract(ny * 0.3183099 + 0.113)
          return -1 + 2 * fract(px * py * (px + py))
        }
        function lerp(a, b, t) {
          return a * (1 - t) + b * t
        }
        function noise(nx, ny) {
          const fx = Math.floor(nx)
          const fy = Math.floor(ny)
          const tx = fract(nx)
          const ty = fract(ny)
          const sx = smooth(tx)
          const sy = smooth(ty)
          const c00 = random(fx, fy)
          const c10 = random(fx + 1, fy)
          const c01 = random(fx, fy + 1)
          const c11 = random(fx + 1, fy + 1)
          return lerp(lerp(c00, c10, sx), lerp(c01, c11, sx), sy)
        }
        function octave(nx, ny) {
          let value = 0.5 * noise(nx * 1, ny * 1)
          value += 0.25 * noise(nx * 0.4, ny * 2.8)
          value += 0.125 * noise(nx * -2.72, ny * 4.96)
          value += 0.0625 * noise(nx * -10.3, ny * 4.67)
          value += 0.03125 * noise(nx * -22.09, ny * -4.89)
          value += 0.015625 * noise(nx * -29.48, ny * -34.33)
          return value
        }
        function height(nx, ny) {
          let value = octave(nx, ny)
          value = Math.pow(value * 0.5 + 0.5, 2)
          return value
        }

        const data = new Float32Array(32 * 32)
        for (let row = 0; row < 32; row += 1) {
          for (let col = 0; col < 32; col += 1) {
            const lon = (x + col / 31) / Math.pow(2, level)
            const lat = (y + row / 31) / Math.pow(2, level)
            data[row * 32 + col] = 9000 * height(lon * 1750 - 10, lat * 1500)
          }
        }
        return data
      }
    })

    viewer.terrainProvider = terrainProvider
  },

  sineTerrainProviderY(viewer) {
    const terrainProvider = new Cesium.CustomHeightmapTerrainProvider({
      width: 32,
      height: 32,
      callback(x, y, level) {
        const data = new Float32Array(1024)
        for (let row = 0; row < 32; row += 1) {
          for (let col = 0; col < 32; col += 1) {
            const lat = (y + row / 31) / Math.pow(2, level)
            data[row * 32 + col] = 4000 * (Math.sin(8000 * lat) * 0.5 + 0.5)
          }
        }
        return data
      }
    })

    viewer.terrainProvider = terrainProvider
  },

  sineTerrainProviderXY(viewer) {
    const terrainProvider = new Cesium.CustomHeightmapTerrainProvider({
      width: 32,
      height: 32,
      callback(x, y, level) {
        const data = new Float32Array(1024)
        for (let row = 0; row < 32; row += 1) {
          for (let col = 0; col < 32; col += 1) {
            const lon = (x + col / 31) / Math.pow(2, level)
            const lat = (y + row / 31) / Math.pow(2, level)
            data[row * 32 + col] =
              4000 * (Math.sin(8000 * lat) * Math.sin(8000 * lon) * 0.5 + 0.5)
          }
        }
        return data
      }
    })

    viewer.terrainProvider = terrainProvider
  }
}

export default viewerTerrainMethods


