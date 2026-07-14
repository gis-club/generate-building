import type { VisionProviderConfig, VisionProviderTemplate } from '@/lib/ai/vision-provider-registry'

export type WorkspacePanel = 'layers' | 'tools'
export type VisualMode = 'preview' | 'wireframe' | 'hidden'

export interface BuildingGeometry {
  id: number
  name?: string
  color: string
  height: number
  extrudeHeight: number
  minHeight?: number
  panelShow: boolean
  lonlats: number[][]
  [key: string]: unknown
}

export interface PositionForm {
  lon: string | number
  lat: string | number
}

export interface LayerForm {
  url: string
  name: string
}

export type { VisionProviderConfig, VisionProviderTemplate }
