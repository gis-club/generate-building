# 建筑白模工具

基于 Vue 3、TypeScript、Vite 和 Cesium 的建筑白模生成工具。

## AI 模型供应商

AI 模块采用类似 Dify 的“供应商 → 模型”配置方式：

- 可同时新增和启用多个供应商，每个供应商可维护多个模型。
- 支持 OpenAI Responses、OpenAI Compatible、Anthropic Messages、Google Gemini、Azure OpenAI 和本地 SAM 协议。
- 内置 OpenAI、Claude、Gemini、阿里云百炼、火山方舟、智谱、OpenRouter、硅基流动、Ollama 等配置模板；其他服务可通过自定义 OpenAI Compatible 接入。
- 支持从供应商在线获取模型列表，也可手工配置模型 ID、显示名称、视觉能力和启用状态。
- Endpoint、API Key 与自定义请求头均在前端动态配置。当前选中的视觉模型会统一输出归一化建筑轮廓，再投影到 Cesium 场景并生成可编辑建筑。
- 原有 `/sam-api` 自动分割服务作为内置供应商保留。

在左侧“工具 → 智能处理”中选择当前视觉模型；点击设置按钮进入供应商管理。

### 密钥与部署安全

API Key 默认仅写入 `sessionStorage`，关闭标签页后失效；只有主动勾选“长期保存在此浏览器”才会写入 `localStorage`。

纯前端直连可能受供应商 CORS 策略限制，也会让密钥存在于用户浏览器。生产环境建议配置自己的后端 AI 网关，由网关保存密钥、限制可用模型与来源域名；前端将该网关配置为 OpenAI Compatible 服务。

## 在线访问

GitHub Pages：<https://gis-club.github.io/generate-building/>

每次向 `main` 分支推送代码后，GitHub Actions 会自动构建并发布站点，也可以在 Actions 页面手动运行 `Deploy to GitHub Pages` 工作流。

> GitHub Pages 是纯静态托管。本地 SAM 依赖开发服务器的 `/sam-api` 代理；其他浏览器可直连且允许 CORS 的模型供应商仍可在静态站点中配置使用。

## 本地开发

```bash
npm ci
npm run dev
```

开发服务器默认运行于 <http://127.0.0.1:5176>。

## 生产构建

```bash
npm run build
npm run preview
```

部署到子路径时可设置 `BASE_PATH`，例如：

```bash
BASE_PATH=/generate-building/ npm run build
```
