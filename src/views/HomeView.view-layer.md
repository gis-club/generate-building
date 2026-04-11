# `HomeView.vue` 视图层说明

## 入口关系

- `src/views/HomeView.vue`
  - 页面模板与样式入口。
  - 只保留视图层交互，核心逻辑从 `src/views/HomeView.logic.ts` 注入。

- `src/views/HomeView.logic.ts`
  - 页面逻辑总装配文件。
  - 聚合 `src/views/home/home-view-logic-core.ts` 与 `src/views/home/home-view-logic-features.ts`。

- `src/views/home/home-view-logic-core.ts`
  - 负责 `data`、生命周期和基础 API 逻辑。

- `src/views/home/home-view-logic-features.ts`
  - 负责功能分组聚合：`mapInit`、`drawEdit`、`export`、`ai`。

- `src/views/home/home-view-lib.ts`
  - 页面层到 `src/lib/mbs-sdk-exports-modular.ts` 的桥接层。

## 主要状态来源

- `checkFlag` / `mapDivHeight` / `leftShow1` / `leftShow2`
  - 定义于 `src/views/home/home-view-data.ts`
  - 控制主界面、左侧面板和地图区域显示。

- `finalData`
  - 定义于 `src/views/home/home-view-data.ts`
  - 存放当前所有建筑区域，是右侧面板和模型刷新的统一数据源。

- `drawingActive` / `drawingDraftId`
  - 定义于 `src/views/home/home-view-data.ts`
  - 控制“绘制区域”流程。

- `aiRunning` / `aiError`
  - 定义于 `src/views/home/home-view-data.ts`
  - 控制 AI 辅助状态和错误信息。

## 主要方法来源

- `initMapAll` / `initMap` / `operate` / `resizeWindow`
  - 来自 `src/views/home/home-view-map-init.ts`

- `updateAll` / `updatePanel` / `update` / `setLonlats`
  - 来自 `src/views/home/home-view-draw-edit.ts`

- `exportJson` / `convertDefaultJson` / `exportGltf`
  - 来自 `src/views/home/home-view-export.ts`

- `useSAM` / `waitForSamLonlats` / `getRealHeight`
  - 来自 `src/views/home/home-view-ai.ts`

## `finalData` 的写入入口

- 手工绘制：`src/views/home/home-view-draw-edit.ts`
- 导入 GeoJSON：`src/views/home/home-view-export.ts`
- AI 辅助识别：`src/views/home/home-view-ai.ts`

## 关键 DOM / ref

- `ref="imgBox"`：Cesium 地图容器引用
- `ref="threeContainer"`：Three.js 容器引用
- `ref="scrollContainer"`：右侧建筑列表滚动容器
- `id="map"`：Cesium 挂载点
- `id="posList"`：测绘控件输出临时坐标的隐藏容器
- `id="fileInput"`：GeoJSON 文件导入输入框
