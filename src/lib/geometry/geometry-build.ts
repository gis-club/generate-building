/**
 * 建筑白模、线框和共享矩阵工具的底层几何实现。
 */

import PrimitiveManagerRecovered from '../widget/widget-primitive-manager.ts'

const WALL_PATTERN_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

export const geometryBuildMethods = {
  constructor() {},

  basePolygon(options) {
    if (options.polygonShow == null) {
      options.polygonShow = true
    }

    const primitive = this.basePolygonGeo(options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.nextBasePolygon = primitive
    this.GEManage.addPrimitive(
      `mbs-basePolygon_${options.signStr}`,
      primitive,
      'PrimitiveCollection'
    )
  },

  updateBasePolygon(options) {
    if (this.nextBasePolygon.ready) {
      this.GEManage.removePrimitiveCollection(`mbs-basePolygon_${options.signStr}`)
      this.nextBasePolygon.show = true
      this.basePolygon(options)
    }
  },

  basePolygonGeo(options) {
    const viewer = options.viewer.viewer
    viewer.scene.postProcessStages.fxaa.enabled = true

    let appearance
    let vertexFormat
    if (options.polygonShow) {
      appearance = new Cesium.PerInstanceColorAppearance({
        translucent: options.translucent,
        flat: false
      })
    }
    if (options.polygonOutlineShow) {
      appearance = new Cesium.PerInstanceColorAppearance({
        flat: true,
        renderState: { lineWidth: Math.min(2, viewer.scene.maximumAliasedLineWidth) }
      })
    }
    vertexFormat = Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    appearance = options.appearance || appearance
    vertexFormat = options.vertexFormat || vertexFormat

    let pointCollection
    if (options.pointVertexShow) {
      pointCollection = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection())
      pointCollection.name = 'mbs-basePolygon-pointVertex'
    }

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      let geometry
      if (options.polygonShow) {
        geometry = new Cesium.PolygonGeometry({
          vertexFormat,
          polygonHierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray(item.pos.flat(2))
          ),
          extrudedHeight: item.height,
          height: item.groundHeight
        })
      }
      if (options.polygonOutlineShow) {
        geometry = new Cesium.PolygonOutlineGeometry({
          vertexFormat,
          polygonHierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray(item.pos.flat(2))
          ),
          extrudedHeight: item.height,
          height: item.groundHeight
        })
      }

      if (options.pointVertexShow) {
        for (let pointIndex = 0; pointIndex < item.pos.length - 1; pointIndex += 1) {
          const point = item.pos[pointIndex]
          const groundPosition = Cesium.Cartesian3.fromDegrees(point[0], point[1], item.groundHeight)
          const roofPosition = Cesium.Cartesian3.fromDegrees(point[0], point[1], item.height)
          pointCollection.add({
            position: groundPosition,
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.fromCssColorString(item.color),
            outlineWidth: 2
          })
          pointCollection.add({
            position: roofPosition,
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.fromCssColorString(item.color),
            outlineWidth: 2
          })
        }
      }

      item.color = item.color || `${this.getRandomHexColor()}50`
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )

      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          attributes: { color },
          id: item.id
        })
      )
    }

    return new Cesium.Primitive({
      geometryInstances: instances,
      appearance,
      asynchronous: false,
      releaseGeometryInstances: false,
      shadows: options.shadows ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED
    })
  },

  basePolygon2(options) {
    const primitive = this.basePolygonGeo2(options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(
      `mbs-basePolygon_${options.signStr}`,
      primitive,
      'PrimitiveCollection'
    )
  },

  basePolygonGeo2(options) {
    const viewer = options.viewer.viewer
    viewer.scene.postProcessStages.fxaa.enabled = true

    const appearance = new Cesium.PerInstanceColorAppearance({
      translucent: options.translucent,
      flat: false
    })
    const vertexFormat = Cesium.PerInstanceColorAppearance.VERTEX_FORMAT

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      const geometry = new Cesium.PolygonGeometry({
        vertexFormat,
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArrayHeights(item.pos.flat(3))
        ),
        perPositionHeight: true,
        extrudedHeight: 0
      })

      item.color = item.color || `${this.getRandomHexColor()}50`
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )

      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          attributes: { color },
          id: item.id
        })
      )
    }

    return new Cesium.Primitive({
      geometryInstances: instances,
      appearance,
      asynchronous: false,
      releaseGeometryInstances: false,
      shadows: options.shadows ? Cesium.ShadowMode.ENABLED : Cesium.ShadowMode.DISABLED
    })
  },

  basePolyline(options) {
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    const primitive = this.basePolylineGeo(options)
    this.nextBasePolyline = primitive
    this.GEManage.addPrimitive(
      `mbs-basePolyline_${options.signStr}`,
      primitive,
      'PrimitiveCollection'
    )
  },

  updateBasePolyline(options) {
    if (this.nextBasePolyline != null && this.nextBasePolyline.ready) {
      this.GEManage.removePrimitiveCollection(`mbs-basePolyline_${options.signStr}`)
      this.nextBasePolyline.show = true
      this.basePolyline(options)
    } else {
      this.basePolyline(options)
    }
  },

  basePolylineGeo(options) {
    const viewer = options.viewer.viewer
    const appearance = new Cesium.PolylineColorAppearance()
    const vertexFormat = Cesium.PolylineColorAppearance.VERTEX_FORMAT

    let pointCollection
    if (
      options.pointVertexShow &&
      this.GEManage.containsByNameIndexOf('mbs-basePolyline-pointVertex').length === 0
    ) {
      pointCollection = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection())
      pointCollection.name = 'mbs-basePolyline-pointVertex'
    }

    const instances = []
    for (let index = 0; index < options.instancesArr.length; index += 1) {
      const item = options.instancesArr[index]
      const geometry = new Cesium.GroundPolylineGeometry({
        vertexFormat,
        positions: Cesium.Cartesian3.fromDegreesArray(item.pos.flat(2)),
        width: 3
      })

      if (pointCollection != null) {
        for (let pointIndex = 0; pointIndex < item.pos.length - 1; pointIndex += 1) {
          const point = item.pos[pointIndex]
          const position = Cesium.Cartesian3.fromDegrees(point[0], point[1], item.heights[pointIndex])
          pointCollection.add({
            position,
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.fromCssColorString(item.color),
            outlineWidth: 2,
            id: `${pointIndex}_${item.id}`
          })
        }
      }

      item.color = item.color || `${this.getRandomHexColor()}50`
      const color = Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(item.color)
      )
      instances.push(
        new Cesium.GeometryInstance({
          geometry,
          attributes: { color },
          id: item.id
        })
      )
    }

    return new Cesium.GroundPolylinePrimitive({
      geometryInstances: instances,
      appearance,
      asynchronous: false,
      releaseGeometryInstances: false
    })
  },

  baseWall(options) {
    const primitive = this.baseWallGeo(options)
    this.GEManage = new PrimitiveManagerRecovered(options.viewer)
    this.GEManage.addPrimitive(`mbs-baseWall_${options.signStr}`, primitive, 'PrimitiveCollection')
  },

  baseWallGeo(options) {
    const geo = options.geo
    if (geo.minHeight == null) {
      geo.minHeight = 0
    }

    const geometryInstance = new Cesium.GeometryInstance({
      geometry: Cesium.WallGeometry.fromConstantHeights({
        positions: Cesium.Cartesian3.fromDegreesArray(geo.pos),
        maximumHeight: geo.maxHeight,
        minimumHeights: geo.minHeight,
        vertexFormat: Cesium.MaterialAppearance.VERTEX_FORMAT
      })
    })

    const source = `
      czm_material czm_getMaterial(czm_materialInput materialInput) {
        czm_material material = czm_getDefaultMaterial(materialInput);
        vec2 st = materialInput.st * num;
        float axis = dir == 1.0 ? st.t : (dir == 2.0 ? st.s : (dir == 3.0 ? (st.s + st.t) : (st.t * 0.5 + st.s)));
        float flow = clockwise == 1.0 ? (axis - speed * czm_frameNumber * 0.005) : (axis + speed * czm_frameNumber * 0.005);
        vec4 colorImage = texture(image, vec2(fract(flow), axis));
        vec4 fragColor;
        fragColor.rgb = color.rgb;
        fragColor = czm_gammaCorrect(fragColor);
        material.alpha = colorImage.a * color.a;
        material.diffuse = (colorImage.rgb + color.rgb) / 2.0;
        material.emission = fragColor.rgb;
        return material;
      }
    `

    const material = new Cesium.Material({
      fabric: {
        type: 'PolylinePulseLink',
        uniforms: {
          color: Cesium.Color.fromCssColorString(geo.color),
          image: WALL_PATTERN_DATA_URL,
          speed: geo.speed,
          num: geo.num,
          dir: geo.dir,
          clockwise: geo.clockwise
        },
        source
      },
      translucent() {
        return true
      }
    })

    return new Cesium.Primitive({
      geometryInstances: [geometryInstance],
      appearance: new Cesium.MaterialAppearance({ material })
    })
  }
}

export default geometryBuildMethods


