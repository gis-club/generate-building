# `src/lib` 模块划分说明

## Viewer

- `src/lib/viewer/viewer-core.ts`
- `src/lib/viewer/viewer-logo.ts`
- `src/lib/viewer/viewer-terrain.ts`
- `src/lib/viewer/viewer-camera.ts`
- `src/lib/viewer/viewer.ts`
- `src/lib/viewer/layer.ts`

## Geometry

- `src/lib/geometry/geometry-primitives.ts`
- `src/lib/geometry/geometry-ground.ts`
- `src/lib/geometry/geometry-build.ts`
- `src/lib/geometry/geometry-mask-trace.ts`
- `src/lib/geometry/geometry-utils.ts`
- `src/lib/geometry/geometry.ts`
- `src/lib/geometry/geometry-b.ts`

## GE

- `src/lib/ge/ge-manage.ts`
- `src/lib/ge/ge-label.ts`
- `src/lib/ge/ge-pick.ts`

## Widget

- `src/lib/widget/widget-base-ui.ts`
- `src/lib/widget/widget-primitive-manager.ts`
- `src/lib/widget/widget-measure-draw.ts`
- `src/lib/widget/widget-measure-labels.ts`
- `src/lib/widget/measure.ts`

## AI

- `src/lib/ai/sam-request.ts`
- `src/lib/ai/sam-render.ts`
- `src/lib/ai/sam-lonlat.ts`
- `src/lib/ai/sam.ts`

## 导入方式

- Viewer、Geometry、Measure、SAM 等能力直接从各自模块导入。
- 各能力通过显式类继承组合，不再使用 `Object.assign` 修改原型。
- 不再提供 `T0` 或 `mbs-sdk-exports*` 兼容聚合对象。

## 当前状态

- 旧的 Electron 与 recovered 入口文件已从运行链路中移除。
- 当前 `src/lib` 下保留的是纯前端运行所需的 TS 文件。
- 页面逻辑通过 `src/views/home/home-view-lib.ts` 直接转出所需的独立模块。
