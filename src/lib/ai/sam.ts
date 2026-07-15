import samRequestMethods from './sam-request.ts'
import samRenderMethods from './sam-render.ts'
import samLonLatMethods from './sam-lonlat.ts'
import type { RecoveredMethods, RecoveredRuntimeContext } from '../recovered-sdk-types.ts'

type SAMAssignedMethods = RecoveredMethods<typeof samRequestMethods> &
  RecoveredMethods<typeof samRenderMethods> &
  RecoveredMethods<typeof samLonLatMethods>

export interface SAMRecovered extends RecoveredRuntimeContext, SAMAssignedMethods {}

export class SAMRecovered {
  constructor(options) {
    samRequestMethods.constructor.call(this, options)
  }
}

Object.assign(SAMRecovered.prototype, samRequestMethods, samRenderMethods, samLonLatMethods)

export default SAMRecovered

