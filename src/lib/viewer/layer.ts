const BAIDU_VECTOR_URL =
  'http://online{s}.map.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&scaler=1&udt='
const BAIDU_ROAD_URL =
  'http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl'
const BAIDU_SATELLITE_URL =
  'https://maponline3.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=sl&scaler=1&udt='

export class LayerRecovered {
  constructor() {}

  addTianDiTu(options) {
    const viewer = options.viewer.viewer
    const layer = options.layer
    if (options.layerName == null) {
      options.layerName = `${layer}_layer`
    }

    const provider = new Cesium.WebMapTileServiceImageryProvider({
      url:
        `http://t0.tianditu.com/${layer}_w/wmts?service=wmts&request=GetTile&version=1.0.0` +
        `&LAYER=${layer}&style=default&format=tiles&tileMatrixSet=w` +
        `&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&tk=${options.tiandituTk}`,
      layer,
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible'
    })

    const imagery = viewer.imageryLayers.addImageryProvider(provider)
    imagery.name = options.layerName
    return imagery
  }

  addOnLineMap(options) {
    const viewer = options.viewer.viewer
    const type = options.type
    const layer = options.layer
    if (options.layerName == null) {
      options.layerName = `${type}_${layer}`
    }

    const urls = {
      gaode: {
        矢量: 'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
        卫星: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        路网: 'https://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
      },
      baidu: {
        矢量: BAIDU_VECTOR_URL,
        卫星: BAIDU_SATELLITE_URL,
        路网: BAIDU_ROAD_URL
      },
      arcgis: {
        矢量:
          'https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png',
        卫星:
          'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png'
      },
      osm: {
        地形: 'http://s0.outdooractive.com/osm/OSMSummer/{z}/{x}/{y}.png',
        矢量: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        热力: 'https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png'
      },
      google: {
        矢量: 'http://gac-geo.googlecnapps.club/maps/vt?lyrs=m&x={x}&y={y}&z={z}',
        卫星: 'https://gmaps.botanicgarden.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}',
        地形: 'http://gac-geo.googlecnapps.club/maps/vt?lyrs=t&x={x}&y={y}&z={z}',
        注记地形: 'http://gac-geo.googlecnapps.club/maps/vt?lyrs=p&x={x}&y={y}&z={z}',
        卫星注记: 'http://gac-geo.googlecnapps.club/maps/vt?lyrs=y&x={x}&y={y}&z={z}'
      },
      google_in: {
        卫星: 'http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali'
      }
    }

    const typeMap = urls[type] || {}
    const url = typeMap[layer] || typeMap.矢量 || typeMap.卫星
    const provider = new Cesium.UrlTemplateImageryProvider({ url })
    const imagery = viewer.imageryLayers.addImageryProvider(provider)
    imagery.name = options.layerName
    return imagery
  }

  addOnLineMapCustom(options) {
    const viewer = options.viewer.viewer
    const provider = new Cesium.UrlTemplateImageryProvider({ url: options.url })
    const imagery = viewer.imageryLayers.addImageryProvider(provider)
    imagery.name = options.layerName
    return imagery
  }

  addImageLayer(options) {
    const viewer = options.viewer.viewer
    if (options.layerName == null) {
      options.layerName = `image_${options.layer}`
    }

    const provider = new Cesium.SingleTileImageryProvider({
      url: options.url,
      tileWidth: 0,
      tileHeight: 0,
      rectangle: Cesium.Rectangle.fromDegrees(
        options.bounds[0],
        options.bounds[1],
        options.bounds[2],
        options.bounds[3]
      )
    })

    const imagery = viewer.imageryLayers.addImageryProvider(provider)
    imagery.name = options.layerName
    return imagery
  }
}

export default LayerRecovered
