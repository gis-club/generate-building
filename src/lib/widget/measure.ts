import measureDrawMethods from './widget-measure-draw.ts'
import measureLabelMethods from './widget-measure-labels.ts'
import type { RecoveredMethods, RecoveredRuntimeContext } from '../recovered-sdk-types.ts'

type MeasureAssignedMethods = RecoveredMethods<typeof measureDrawMethods> &
  RecoveredMethods<typeof measureLabelMethods>

export interface MeasureRecovered extends RecoveredRuntimeContext, MeasureAssignedMethods {}

export class MeasureRecovered {
  constructor() {
    if (typeof measureDrawMethods.constructor === 'function') {
      measureDrawMethods.constructor.call(this)
    }
  }
}

Object.assign(MeasureRecovered.prototype, measureDrawMethods, measureLabelMethods)

export default MeasureRecovered

