import { access, rename } from 'node:fs/promises'
import path from 'node:path'

const basePath = process.env.BASE_PATH

// vite-plugin-cesium includes Vite's base path in both the public URL and the
// output directory. A Pages artifact is already mounted at that public base,
// so the copied Cesium directory must stay at the artifact root.
if (basePath && basePath !== '/' && basePath !== './') {
  const baseSegments = basePath.split('/').filter(Boolean)

  if (baseSegments.some((segment) => segment === '..' || segment === '.')) {
    throw new Error(`Unsafe BASE_PATH: ${basePath}`)
  }

  const outputRoot = path.resolve('dist')
  const nestedCesiumPath = path.resolve(outputRoot, ...baseSegments, 'cesium')
  const targetCesiumPath = path.resolve(outputRoot, 'cesium')

  if (!nestedCesiumPath.startsWith(`${outputRoot}${path.sep}`)) {
    throw new Error(`Cesium output path is outside dist: ${nestedCesiumPath}`)
  }

  await access(nestedCesiumPath)
  await rename(nestedCesiumPath, targetCesiumPath)
  console.log(`Moved Cesium assets to ${path.relative(process.cwd(), targetCesiumPath)}`)
}
