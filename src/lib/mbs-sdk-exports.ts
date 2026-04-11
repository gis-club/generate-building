import {
  ViewerRecovered,
  LayerRecovered,
  GeometryRecovered,
  GeometryBRecovered,
  GEManageRecovered,
  GELabelRecovered,
  GEPickRecovered,
  BaseWidgetRecovered,
  MeasureRecovered,
  SAMRecovered
} from './mbs-sdk-exports-modular.ts'

ViewerRecovered.Layer = LayerRecovered
GeometryRecovered.GeometryB = GeometryBRecovered

export const T0 = {
  Viewer: ViewerRecovered,
  Geometry: GeometryRecovered,
  GE: {
    GELabel: GELabelRecovered,
    GEManage: GEManageRecovered,
    GEPick: GEPickRecovered
  },
  Widget: {
    BaseWidget: BaseWidgetRecovered,
    Measure: MeasureRecovered
  },
  AI: {
    SAM: SAMRecovered
  }
}

export default T0

