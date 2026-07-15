/**
 * PrimitiveCollection、Label 与 Billboard 集合管理器。
 */

import type { RecoveredRuntimeContext } from '../recovered-sdk-types.ts'

export interface PrimitiveManagerRecovered extends RecoveredRuntimeContext {}

export class PrimitiveManagerRecovered {
  constructor(options) {
    this.viewer = options.viewer
  }

  createPrimitiveCollection(name, type) {
    const viewer = this.viewer
    let collection:
      | InstanceType<typeof Cesium.PrimitiveCollection>
      | InstanceType<typeof Cesium.LabelCollection>
      | InstanceType<typeof Cesium.BillboardCollection> = new Cesium.PrimitiveCollection()

    switch (type) {
      case 'PrimitiveCollection':
        collection = new Cesium.PrimitiveCollection()
        break
      case 'LabelCollection':
        collection = new Cesium.LabelCollection()
        break
      case 'BillboardCollection':
        collection = new Cesium.BillboardCollection()
        break
    }

    const primitive = viewer.scene.primitives.add(collection)
    primitive.name = name
    return collection
  }

  containsByName(name) {
    const viewer = this.viewer
    let result = -1
    for (let index = 0; index < viewer.scene.primitives._primitives.length; index += 1) {
      if (viewer.scene.primitives.get(index).name === name) {
        result = index
      }
    }
    return result
  }

  containsByNameIndexOf(name) {
    const viewer = this.viewer
    const indexes = []
    for (let index = 0; index < viewer.scene.primitives._primitives.length; index += 1) {
      const primitiveName = viewer.scene.primitives.get(index).name
      if (primitiveName != null && primitiveName.indexOf(name) !== -1) {
        indexes.push(index)
      }
    }
    return indexes
  }

  addPrimitive(name, primitive, type) {
    const viewer = this.viewer
    const index = this.containsByName(name)
    if (index === -1) {
      this.createPrimitiveCollection(name, type).add(primitive)
    } else {
      viewer.scene.primitives.get(index).add(primitive)
    }
  }

  removeAllPrimitive() {
    this.viewer.scene.primitives.removeAll()
  }

  removeInstance(name, instanceId) {
    const viewer = this.viewer
    const index = this.containsByName(name)
    if (index === -1) {
      return
    }

    for (let primitiveIndex = 0; primitiveIndex < viewer.scene.primitives.get(index).length; primitiveIndex += 1) {
      const primitive = viewer.scene.primitives.get(index).get(primitiveIndex)
      if (primitive._instanceIds == null) {
        continue
      }

      let targetIndex = 0
      for (let geometryIndex = 0; geometryIndex < primitive.geometryInstances.length; geometryIndex += 1) {
        if (primitive.geometryInstances[geometryIndex].id === instanceId) {
          targetIndex = geometryIndex
          break
        }
      }
      primitive.geometryInstances.splice(targetIndex, 1)
    }
  }

  removePrimitive(name, prefix) {
    const viewer = this.viewer
    const index = this.containsByName(name)
    if (index === -1) {
      return
    }

    for (let primitiveIndex = 0; primitiveIndex < viewer.scene.primitives.get(index).length; primitiveIndex += 1) {
      const primitive = viewer.scene.primitives.get(index).get(primitiveIndex)
      let primitivePrefix

      if (primitive._instanceIds != null && primitive.id !== 'mask') {
        primitivePrefix = primitive.geometryInstances.id.split('#')[0].split('_')[0]
      } else {
        primitivePrefix = primitive.id.split('#')[0].split('_')[0]
      }

      if (prefix === primitivePrefix) {
        viewer.scene.primitives.get(index).remove(primitive)
        break
      }
    }
  }

  removePrimitiveCollection(name) {
    const viewer = this.viewer
    const index = this.containsByName(name)
    const primitive = viewer.scene.primitives.get(index)
    viewer.scene.primitives.remove(primitive)
  }

  removePrimitiveCollectionIndexOf(name) {
    const viewer = this.viewer
    const indexes = this.containsByNameIndexOf(name)
    for (let index = indexes.length - 1; index >= 0; index -= 1) {
      viewer.scene.primitives.remove(viewer.scene.primitives.get(indexes[index]))
    }
  }
}

export default PrimitiveManagerRecovered


