import ViewerRecovered from './viewer/viewer.ts'
import LayerRecovered from './viewer/layer.ts'
import GeometryRecovered from './geometry/geometry.ts'
import GeometryBRecovered, { MaskTraceRecovered } from './geometry/geometry-b.ts'
import GEManageRecovered from './ge/ge-manage.ts'
import GELabelRecovered from './ge/ge-label.ts'
import MeasureRecovered from './widget/measure.ts'
import PrimitiveManagerRecovered from './widget/widget-primitive-manager.ts'

export {
  ViewerRecovered,
  LayerRecovered,
  GeometryRecovered,
  GeometryBRecovered,
  MaskTraceRecovered,
  GEManageRecovered,
  GELabelRecovered,
  MeasureRecovered,
  PrimitiveManagerRecovered
}

export const T0RecoveredCore = {
  Viewer: ViewerRecovered,
  Layer: LayerRecovered,
  Geometry: GeometryRecovered,
  GeometryB: GeometryBRecovered,
  MaskTrace: MaskTraceRecovered,
  GE: {
    GEManage: GEManageRecovered,
    GELabel: GELabelRecovered
  },
  Widget: {
    Measure: MeasureRecovered,
    PrimitiveManager: PrimitiveManagerRecovered
  }
}

T0RecoveredCore.Viewer.Layer = LayerRecovered
T0RecoveredCore.Geometry.GeometryB = GeometryBRecovered

export default T0RecoveredCore

