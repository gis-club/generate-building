/// <reference types="vite/client" />

declare global {
  interface Window {
    __MBS_RECOVERED_PREVIEW__: boolean
    CESIUM_BASE_URL?: string
    yge: (url: string, payload?: unknown) => Promise<any>
    O9: <T>(value: T) => T
    Mx: (options?: { type?: string; title?: string; message?: string }) => void
    realWidth?: number
    realHeight?: number
    myViewer?: any
    Cesium: any
    turf: any
    decomp: any
    LZString: any
    proj4: any
  }

  const myViewer: any
  const Cesium: any
  const turf: any
  const decomp: any
  const LZString: any
  const proj4: any
}

export {}
