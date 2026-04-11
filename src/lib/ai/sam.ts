import samRequestMethods from './sam-request.ts'
import samRenderMethods from './sam-render.ts'
import samLonLatMethods from './sam-lonlat.ts'

export class SAMRecovered {
  constructor(options) {
    samRequestMethods.constructor.call(this, options)
  }
}

Object.assign(SAMRecovered.prototype, samRequestMethods, samRenderMethods, samLonLatMethods)

export default SAMRecovered

