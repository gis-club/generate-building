# 建筑白模工具

基于 Vue 3、TypeScript、Vite 和 Cesium 的建筑白模生成工具。

## 在线访问

GitHub Pages：<https://gis-club.github.io/generate-building/>

每次向 `main` 分支推送代码后，GitHub Actions 会自动构建并发布站点。也可以在 Actions 页面手动运行 `Deploy to GitHub Pages` 工作流。

> GitHub Pages 是纯静态托管。AI 图像识别功能依赖开发服务器的 `/sam-api` 代理，因此在线站点默认不提供该功能；地图绘制、编辑和建筑生成等纯前端功能可以正常使用。

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
