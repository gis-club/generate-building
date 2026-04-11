/**
 * 生成本地预览用的示例建筑数据。
 * 在没有授权服务、没有外部数据文件时，也能直接展示完整界面和编辑能力。
 */
function createPreviewMockFinalData() {
  return [
    {
      id: 0,
      name: 'Sample Building 1',
      height: 0,
      extrudeHeight: 36,
      style: '1',
      color: '#42d392',
      lonlats: [
        [113.7362, 34.7694, 0],
        [113.737, 34.7694, 0],
        [113.737, 34.7701, 0],
        [113.7362, 34.7701, 0],
        [113.7362, 34.7694, 0]
      ],
      panelShow: true,
      minHeight: 0
    },
    {
      id: 1,
      name: 'Sample Building 2',
      height: 0,
      extrudeHeight: 52,
      style: '1',
      color: '#647eff',
      lonlats: [
        [113.7373, 34.7689, 0],
        [113.7381, 34.7689, 0],
        [113.7381, 34.7698, 0],
        [113.7373, 34.7698, 0],
        [113.7373, 34.7689, 0]
      ],
      panelShow: true,
      minHeight: 0
    }
  ]
}

/**
 * 首页状态工厂。
 * 所有页面响应式字段都从这里集中生成，便于后续迁移到组合式 API 时统一梳理。
 */
export function createHomeViewRecoveredData() {
  const finalData = window.__MBS_RECOVERED_PREVIEW__ ? createPreviewMockFinalData() : []

  return {
    /**
     * 地图授权通过后才显示主界面。
     * 纯 Vite 预览模式下会在 mounted 时直接置为 true。
     */
    checkFlag: false,
    errShow1: false,
    infoShow1: false,
    infoShow2: false,
    infoShow3: false,
    infoShow4: false,
    leftShow1: false,
    leftShow2: false,
    posForm: { lon: null, lat: null },
    layerForm: { url: '', name: '' },
    styles: [
      { value: '1', label: '自下而上渐变' },
      { value: '2', label: '纯色' },
      { value: '3', label: '透明' }
    ],
    predefineColors: [
      '#E63415',
      '#FF6600',
      '#FFDE0A',
      '#1EC79D',
      '#14CCCC',
      '#4167F0',
      '#6222C9',
      '#ff4500',
      '#ff8c00',
      '#ffd700',
      '#90ee90',
      '#00ced1',
      '#1e90ff',
      '#c71585'
    ],
    mapDivHeight: window.innerHeight,
    bodyDivWidth: window.innerWidth,
    /**
     * 当前场景中的所有几何体数据。
     * 右侧面板、绘制结果、GeoJSON 导入和 AI 识别结果都会写入这里。
     */
    finalData,
    currId: finalData.length,
    /**
     * 绘制状态与 AI 状态分别独立维护，避免两个流程同时操作 `finalData`。
     */
    drawingActive: false,
    drawingDraftId: null,
    aiRunning: false,
    aiError: '',
    samMinHeightResult: [],
    sceneFlag: true,
    homePos: { pos: [113.73, 34.77], heading: 0, pitch: -90, distance: 4000 },
    modelMode: undefined,
    oldPickedPrimitive: {},
    allPanelShow: true,
    currUserId: '000000',
    currUserEndTime: '1970-01-01 23:59',
    currUserIsTry: '试用',
    currUserErrorMsg: '',
    downloadProgress: 0,
    downloadProgressColors: [
      { color: '#f56c6c', percentage: 20 },
      { color: '#e6a23c', percentage: 40 },
      { color: '#5cb87a', percentage: 60 },
      { color: '#1989fa', percentage: 80 },
      { color: '#6f7ad3', percentage: 100 }
    ]
  }
}
