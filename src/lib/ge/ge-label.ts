import GEManageRecovered from './ge-manage.ts'

import type { RecoveredRuntimeContext } from '../recovered-sdk-types.ts'

export interface GELabelRecovered extends RecoveredRuntimeContext {}

export class GELabelRecovered {
  constructor() {}

  addMarker(options) {
    this.viewer = options.viewer.viewer
    this.myViewer = options.viewer

    this.guidePolylines(
      this.viewer,
      options.collectionId,
      `${options.id}`,
      {
        x: options.position[0],
        y: options.position[1],
        z: options.position[2],
        z0: options.position[3]
      },
      options.lineColor,
      options.lineWidth
    )

    this.noteLabels(
      this.viewer,
      options.collectionId,
      `${options.id}_text_${options.collectionId}`,
      { x: options.position[0], y: options.position[1], z: options.position[2] },
      options.icon,
      options.text,
      options.iconScale,
      options.offest,
      options.rotation,
      options.scaleByDistance
    )
  }

  addLabel(options) {
    this.viewer = options.viewer.viewer
    this.myViewer = options.viewer

    this.addLabelSon(
      this.viewer,
      options.collectionId,
      `${options.id}_text_${options.collectionId}`,
      { x: options.position[0], y: options.position[1], z: options.position[2] },
      options.icon,
      options.text,
      options.iconScale,
      options.offest,
      options.rotation,
      options.scaleByDistance
    )
  }

  addNoteLabel(options) {
    this.viewer = options.viewer.viewer
    this.myViewer = options.viewer

    this.noteLabels(
      this.viewer,
      options.collectionId,
      `${options.id}_text_${options.collectionId}`,
      { x: options.position[0], y: options.position[1], z: options.position[2] },
      options.icon,
      options.text,
      options.iconScale,
      options.offest,
      options.rotation,
      options.scaleByDistance
    )
  }

  guidePolylines(viewer, collectionId, id, position, lineColor, lineWidth) {
    const positions = [position.x, position.y, position.z0, position.x, position.y, position.z]
    const primitive = this.polylinePrimitive(
      `mbs-guideline_${collectionId}`,
      id,
      positions,
      lineColor,
      lineWidth
    )

    this.GEManage = new GEManageRecovered(this.myViewer)
    this.GEManage.addPrimitive(`mbs-guideline_${collectionId}`, primitive, 'PrimitiveCollection')
  }

  polylinePrimitive(collectionName, id, positions, color, width, materialConfig = null) {
    let vertexFormat
    let appearance

    if (materialConfig == null) {
      vertexFormat = Cesium.PolylineColorAppearance.VERTEX_FORMAT
      appearance = new Cesium.PolylineColorAppearance()
    } else {
      vertexFormat = Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
      appearance = new Cesium.PolylineMaterialAppearance({
        material: Cesium.Material.fromType(materialConfig.type, {
          color: Cesium.Color.fromCssColorString(materialConfig.color)
        })
      })
    }

    const geometry = new Cesium.PolylineGeometry({
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
      width,
      vertexFormat,
      arcType: Cesium.ArcType.NONE
    })

    const primitiveColor = Cesium.Color.fromCssColorString(color)
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: Cesium.PolylineGeometry.createGeometry(geometry),
      attributes: {
        color: new Cesium.ColorGeometryInstanceAttribute(
          primitiveColor.red,
          primitiveColor.green,
          primitiveColor.blue,
          primitiveColor.alpha
        )
      },
      id: `${id}#${collectionName}`
    })

    return new Cesium.Primitive({
      geometryInstances: geometryInstance,
      releaseGeometryInstances: false,
      appearance,
      asynchronous: false
    })
  }

  noteLabels(viewer, collectionId, id, position, icon, text, scale, offset, rotation, scaleByDistance) {
    this.addBillboardSon(
      viewer,
      collectionId,
      id,
      position,
      icon,
      text,
      scale,
      offset,
      rotation,
      scaleByDistance
    )

    this.addLabelSon(
      viewer,
      collectionId,
      id,
      position,
      icon,
      text,
      scale,
      offset,
      rotation,
      scaleByDistance
    )
  }

  addBillboardSon(viewer, collectionId, id, position, image, text, scale, offset, rotation, scaleByDistance) {
    const billboard: RecoveredRuntimeContext = {
      position: Cesium.Cartesian3.fromDegrees(position.x, position.y, position.z),
      id,
      image,
      scale,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER
    }

    if (rotation != null) {
      billboard.rotation = rotation
    }
    if (scaleByDistance != null) {
      billboard.scaleByDistance = scaleByDistance
    }

    this.GEManage = new GEManageRecovered(this.myViewer)
    this.GEManage.addPrimitive(
      `mbs-marker-billboard_${collectionId}`,
      billboard,
      'BillboardCollection'
    )
  }

  addLabelSon(
    viewer,
    collectionId,
    id,
    position,
    icon,
    text,
    scale = 1,
    offset = [0, 0],
    rotation = 0,
    scaleByDistance = null
  ) {
    const label = {
      id,
      position: Cesium.Cartesian3.fromDegrees(position.x, position.y, position.z),
      text,
      font: '18px Helvetica',
      fillColor: Cesium.Color.fromCssColorString('#ffffff'),
      showBackground: true,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(offset[0] || 0, offset[1] || 0),
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
      backgroundPadding: new Cesium.Cartesian2(12, 6),
      scale,
      outlineColor: Cesium.Color.WHITE.withAlpha(1),
      outlineWidth: 1,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE
    }

    this.GEManage = new GEManageRecovered(this.myViewer)
    this.GEManage.addPrimitive(`mbs-marker-label_${collectionId}`, label, 'LabelCollection')
  }
}

export default GELabelRecovered

