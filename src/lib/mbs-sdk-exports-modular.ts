import {
  ViewerRecovered,
  LayerRecovered,
  GeometryRecovered,
  GeometryBRecovered,
  MaskTraceRecovered,
  GEManageRecovered,
  GELabelRecovered,
  MeasureRecovered,
  PrimitiveManagerRecovered
} from './mbs-sdk-exports-core.ts'
import GEPickRecovered from './ge/ge-pick.ts'
import BaseWidgetRecovered from './widget/widget-base-ui.ts'
import SAMRecovered from './ai/sam.ts'

export {
  ViewerRecovered,
  LayerRecovered,
  GeometryRecovered,
  GeometryBRecovered,
  MaskTraceRecovered,
  GEManageRecovered,
  GELabelRecovered,
  GEPickRecovered,
  BaseWidgetRecovered,
  MeasureRecovered,
  PrimitiveManagerRecovered,
  SAMRecovered
}

export const T0RecoveredModular = {
  Viewer: ViewerRecovered,
  Layer: LayerRecovered,
  Geometry: GeometryRecovered,
  GeometryB: GeometryBRecovered,
  MaskTrace: MaskTraceRecovered,
  GE: {
    GEManage: GEManageRecovered,
    GELabel: GELabelRecovered,
    GEPick: GEPickRecovered
  },
  Widget: {
    BaseWidget: BaseWidgetRecovered,
    Measure: MeasureRecovered,
    PrimitiveManager: PrimitiveManagerRecovered
  },
  AI: {
    SAM: SAMRecovered
  }
}

T0RecoveredModular.Viewer.Layer = LayerRecovered
T0RecoveredModular.Geometry.GeometryB = GeometryBRecovered

export default T0RecoveredModular

