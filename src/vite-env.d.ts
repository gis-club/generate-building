/// <reference types="vite/client" />

interface LegacyApiResponse<T = unknown> {
  code: number
  data?: T
  message?: string
}

interface LegacyLicenseData {
  id?: string
  endTime?: string
  isTry?: boolean | number
  errorCode?: string
  error?: string
}

type LegacyMessageType = 'success' | 'warning' | 'info' | 'error' | 'primary'

interface LegacyMessageOptions {
  type?: LegacyMessageType
  title?: string
  message?: string
}

declare global {
  interface Window {
    __MBS_RECOVERED_PREVIEW__: boolean
    CESIUM_BASE_URL?: string
    yge: (url: string, payload?: unknown) => Promise<LegacyApiResponse<LegacyLicenseData>>
    O9: <T>(value: T) => T
    Mx: (options?: LegacyMessageOptions) => void
    realWidth?: number
    realHeight?: number
    myViewer?: import('./lib/viewer/viewer.ts').Viewer
    Cesium: typeof import('cesium')
    turf: typeof import('@turf/turf')
    decomp: typeof import('poly-decomp')
    LZString: typeof import('lz-string').default
    proj4: typeof import('proj4').default
  }

  const yge: Window['yge']
  const O9: Window['O9']
  const Mx: Window['Mx']
  const myViewer: import('./lib/viewer/viewer.ts').Viewer
  const Cesium: Window['Cesium']
  const turf: Window['turf']
  const decomp: Window['decomp']
  const LZString: Window['LZString']
  const proj4: Window['proj4']
}

export {}
