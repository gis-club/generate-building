import measureDrawMethods from './widget-measure-draw.ts'
import measureLabelMethods from './widget-measure-labels.ts'

export class MeasureRecovered {
  constructor() {
    if (typeof measureDrawMethods.constructor === 'function') {
      measureDrawMethods.constructor.call(this)
    }
  }
}

Object.assign(MeasureRecovered.prototype, measureDrawMethods, measureLabelMethods)

export default MeasureRecovered

