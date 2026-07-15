# GeoBuild · 建筑白模工具

[中文](README.md) | [English](README.en.md)

GeoBuild 是一个运行在浏览器中的 GIS 建筑白模工作台。项目基于 Vue 3、TypeScript、Vite 和 Cesium，可在卫星影像上绘制或导入建筑轮廓，编辑建筑参数，生成三维白模，并通过可配置的多模态 AI 模型识别当前地图画面中的建筑轮廓。

在线体验：<https://gis-club.github.io/generate-building/>

## 当前项目状态

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 地图浏览与定位 | 可用 | Cesium 地球、ArcGIS 卫星影像、回正北、坐标定位、场景切换 |
| 建筑绘制与编辑 | 可用 | 绘制多边形、增删/拖动顶点、整体高度调整、样式与颜色编辑 |
| 建筑预览 | 可用 | 实体、线框、隐藏三种显示模式 |
| GeoJSON 导入导出 | 可用 | 导入项目兼容的 Polygon FeatureCollection，导出完整或局部坐标数据 |
| 多供应商 AI 识别 | 可用 | Dify 风格供应商/模型管理，统一识别结果并绘制到 Cesium |
| 本地 SAM | 仅开发环境 | 依赖 Vite 的 `/sam-api` 代理，GitHub Pages 不提供该代理 |
| glTF 导出 | 实验性 | 保留自旧工程恢复的 Three.js 导出链路，仍需继续做运行时兼容性验证 |
| 全仓 TypeScript 检查 | 可用 | `npm run type-check` 与生产构建均可通过 |

## 主要功能

### GIS 建筑工作台

- 基于 Cesium 的卫星地图浏览与三维场景。
- 在地图上逐点绘制建筑多边形，双击结束绘制。
- 编辑轮廓顶点，包括拖动、插入和删除。
- 修改建筑名称、基础高度、拉伸高度、颜色和渲染样式。
- 批量升高或降低全部建筑。
- 在实体预览、顶点/线框编辑和隐藏模型之间切换。
- 添加自定义在线影像图层并按经纬度定位。

### 数据导入导出

- 导入 `.json` 或 `.geojson` 文件。
- 导出包含 EPSG:4326 建筑轮廓和建模参数的 JSON/GeoJSON。
- 导出以场景中心为原点的局部米制坐标数据。
- 实验性导出 glTF 三维模型。

当前导入器主要面向本项目导出的 `Polygon` FeatureCollection。建议保留以下属性：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 0,
        "name": "Building 1",
        "height": 0,
        "extrudeHeight": 40,
        "minHeight": 0,
        "style": "1",
        "color": "#ffffff",
        "panelShow": false
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[113.73, 34.77, 0], [113.731, 34.77, 0], [113.731, 34.771, 0], [113.73, 34.77, 0]]]
      }
    }
  ]
}
```

## AI 供应商与模型

AI 模块使用“供应商实例 → 模型目录 → 当前视觉模型”的配置结构。供应商保存协议、Endpoint、API Key 和自定义请求头，一个供应商可以维护任意数量的模型；建筑识别流程只依赖统一视觉接口，不绑定具体厂商或模型名称。

### 支持的协议

| 协议 | 用途 |
| --- | --- |
| Local SAM | 调用开发服务器代理的 Segment Anything 自动分割服务 |
| OpenAI Responses | OpenAI 原生多模态 Responses API |
| OpenAI Compatible | 兼容 Chat Completions 图像输入的厂商、网关和本地服务 |
| Anthropic Messages | Claude 多模态 Messages API |
| Google Gemini | Gemini `generateContent` 图像理解接口 |
| Azure OpenAI | 通过 Azure 部署 Endpoint 调用视觉模型 |

界面内置 OpenAI、Anthropic Claude、Google Gemini、Azure OpenAI、阿里云百炼/Qwen、火山方舟、智谱 AI、OpenRouter、硅基流动、Ollama 和自定义 OpenAI Compatible 模板。模板只提供协议和 Endpoint 起点，实际模型 ID、权限和可用区域以供应商账户为准。

### 配置和使用

1. 点击左侧竖向活动栏的“AI”按钮，直接打开“AI 模型供应商”窗口；也可从“处理 → 智能处理 → 模型供应商”进入。
2. 选择模板并新增供应商，填写 Endpoint、API Key 和可选自定义请求头。
3. 点击“获取模型”同步供应商模型列表，或手动添加模型 ID。
4. 启用需要使用的模型并标记其视觉能力，然后选择当前模型。
5. 返回地图，将目标建筑置于当前画面，点击“AI 建筑识别”。
6. 模型返回的归一化轮廓会被校验、投影到当前 Cesium 场景、采样地形高度，并追加为可编辑建筑。

识别精度取决于影像清晰度、视角、模型视觉能力和提示遵循程度。生成结果应由用户复核，尤其是在轮廓被树木、阴影或已有三维模型遮挡时。

### API Key 与生产安全

- 默认情况下，API Key 仅写入 `sessionStorage`，关闭标签页后失效。
- 只有主动勾选“长期保存在此浏览器”时，密钥才会写入 `localStorage`。
- 纯前端直连会让 API Key 存在于用户浏览器，并可能受到供应商 CORS 策略限制。
- 生产环境建议使用自己的后端 AI 网关保存密钥、限制来源域名和可用模型，再将该网关作为 OpenAI Compatible 服务接入。
- 不要在代码、README、提交记录或公开部署配置中写入真实 API Key。

## 技术栈

- Vue 3 + Options API
- TypeScript 6
- Vite 8
- Cesium 1.140
- Element Plus
- Turf.js
- Three.js
- `poly-decomp`、`proj4`、`lz-string`

## 本地开发

### 环境要求

- Node.js 22（与 GitHub Actions 一致）
- npm
- 支持 WebGL 的现代浏览器

### 启动

```bash
npm ci
npm run dev
```

开发服务器固定运行在 <http://127.0.0.1:5006>。

### 生产构建

```bash
npm run build
npm run preview
```

`npm run build` 会先执行 Vite 构建，再运行 `scripts/fix-cesium-base.mjs` 修正 Cesium 静态资源路径。使用 `npm run check` 可依次执行全量类型检查与生产构建。

## 部署

项目使用 GitHub Actions 自动部署 GitHub Pages。向 `main` 分支推送后，工作流会使用 Node.js 22 安装依赖、设置 `BASE_PATH=/generate-building/`、构建 `dist` 并发布。

部署到其他子路径时可自行设置 `BASE_PATH`：

```bash
BASE_PATH=/your-base-path/ npm run build
```

PowerShell 示例：

```powershell
$env:BASE_PATH='/your-base-path/'
npm run build
```

静态部署注意事项：

- Cesium 资源路径必须与 `BASE_PATH` 一致。
- `/sam-api` 只存在于本地 Vite 开发服务器。
- 远程 AI 服务只有在允许浏览器跨域请求时才能由静态站点直接调用。
- 若需要可靠的 AI 能力和密钥保护，应同时部署后端网关。

## 项目结构

```text
src/
├─ App.vue                          # 应用根组件
├─ components/workspace/            # 工作台顶栏、侧栏、检查器与对话框组件
├─ views/HomeView.vue               # GIS 工作台页面编排与状态协调
├─ views/home/                      # 地图、绘制、导入导出、AI 页面逻辑
├─ styles/workspace.css             # 工作台共享主题与布局样式
├─ types/workspace.ts               # 工作台组件契约
├─ lib/ai/                          # SAM 与多供应商视觉模型适配
├─ lib/viewer/                      # Cesium Viewer 与相机/地形/图层
├─ lib/geometry/                    # 建筑、地面几何和轮廓追踪
├─ lib/widget/                      # 绘制与测量控件
└─ main.ts                          # Vue、Cesium 与全局运行依赖入口

scripts/fix-cesium-base.mjs         # 构建后修正 Cesium 基础路径
.github/workflows/deploy-pages.yml  # GitHub Pages 自动部署
```

## 已知限制

- Viewer、Geometry、Measure 与 SAM 已改为显式类继承和独立模块导入；升级 Cesium、Three.js 等依赖时仍需执行完整类型检查。
- 通用视觉大模型输出的是近似建筑轮廓，不等同于专业测绘或经过训练的分割模型。
- 导入器不是完整的通用 GeoJSON 编辑器，主要支持本项目的数据结构和 Polygon 建筑面。
- 超大场景、复杂多边形和大量模型尚未进行系统性能基准测试。
- 项目已提供 `npm run type-check` 和 `npm run check`，但尚未配置自动化单元测试。
