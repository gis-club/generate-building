# GeoBuild · Building Massing Tool

[中文](README.md) | [English](README.en.md)

GeoBuild is a browser-based GIS workspace for creating simple 3D building massing models. Built with Vue 3, TypeScript, Vite, and Cesium, it lets users draw or import building footprints on satellite imagery, edit building parameters, generate 3D massing, and detect visible building outlines with configurable multimodal AI models.

Live demo: <https://gis-club.github.io/generate-building/>

## Project status

| Module | Status | Notes |
| --- | --- | --- |
| Map navigation and positioning | Available | Cesium globe, ArcGIS satellite imagery, north reset, coordinate positioning, and scene switching |
| Building drawing and editing | Available | Polygon drawing, vertex insertion/deletion/dragging, bulk height changes, styles, and colors |
| Building preview | Available | Solid, wireframe, and hidden display modes |
| GeoJSON import and export | Available | Imports compatible Polygon FeatureCollections and exports full or local-coordinate data |
| Multi-provider AI recognition | Available | Dify-style provider/model management with a unified Cesium drawing pipeline |
| Local SAM | Development only | Depends on the Vite `/sam-api` proxy, which is not available on GitHub Pages |
| glTF export | Experimental | The recovered Three.js export path still needs additional runtime compatibility testing |
| Repository-wide TypeScript checks | Available | Both `npm run type-check` and production builds pass |

## Features

### GIS building workspace

- Cesium-powered satellite map and 3D globe.
- Point-by-point building polygon drawing; double-click to finish.
- Footprint vertex dragging, insertion, and deletion.
- Editable building name, base height, extrusion height, color, and rendering style.
- Bulk height adjustment for all buildings.
- Solid preview, vertex/wireframe editing, and hidden-model modes.
- Custom online imagery layers and longitude/latitude positioning.

### Data import and export

- Import `.json` and `.geojson` files.
- Export JSON/GeoJSON with EPSG:4326 footprints and modeling properties.
- Export local coordinates in meters relative to the scene center.
- Experimental glTF model export.

The current importer is designed primarily for `Polygon` FeatureCollections exported by this project. Keep the following properties for full round-trip compatibility:

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

## AI providers and models

The AI module follows a “provider instance → model catalog → active vision model” structure. A provider stores its protocol, endpoint, API key, and custom headers, and can expose any number of models. The building-recognition workflow depends on a unified vision interface rather than a specific vendor or model name.

### Supported protocols

| Protocol | Use |
| --- | --- |
| Local SAM | Calls the Segment Anything automatic-mask service through the development proxy |
| OpenAI Responses | Native multimodal OpenAI Responses API |
| OpenAI Compatible | Providers, gateways, and local services compatible with image input in Chat Completions |
| Anthropic Messages | Claude multimodal Messages API |
| Google Gemini | Gemini `generateContent` image-understanding API |
| Azure OpenAI | Vision-model deployments exposed through an Azure endpoint |

Built-in templates are provided for OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, Alibaba Model Studio/Qwen, Volcengine Ark, Zhipu AI, OpenRouter, SiliconFlow, Ollama, and custom OpenAI-compatible services. Templates only provide protocol and endpoint starting points; actual model IDs, permissions, and regional availability depend on the provider account.

### Configuration and usage

1. Click **AI** in the vertical activity bar to open **AI Model Providers** directly. The same window is available under **Processing → Intelligent Processing → Model Providers**.
2. Choose a template, add a provider, and enter its endpoint, API key, and optional custom headers.
3. Click **Fetch Models** to synchronize the provider catalog, or add a model ID manually.
4. Enable the models you want to use, mark vision capability, and select the active model.
5. Return to the map, frame the target buildings in the current view, and click **AI Building Recognition**.
6. The normalized outlines returned by the model are validated, projected into the Cesium scene, assigned sampled terrain heights, and appended as editable buildings.

Recognition quality depends on imagery resolution, camera angle, the selected model, and prompt compliance. Results should be reviewed by a user, especially when roofs are obscured by trees, shadows, or existing 3D objects.

### API key and production security

- API keys are stored in `sessionStorage` by default and expire when the tab is closed.
- A key is written to `localStorage` only when **Remember in this browser** is explicitly enabled.
- Direct browser calls expose credentials to the client and may be blocked by provider CORS policies.
- For production, use a backend AI gateway to keep secrets, restrict origins and allowed models, and expose that gateway as an OpenAI-compatible service.
- Never commit real API keys to source code, documentation, Git history, or public deployment configuration.

## Technology stack

- Vue 3 with the Options API
- TypeScript 6
- Vite 8
- Cesium 1.140
- Element Plus
- Turf.js
- Three.js
- `poly-decomp`, `proj4`, and `lz-string`

## Local development

### Requirements

- Node.js 22, matching GitHub Actions
- npm
- A modern WebGL-capable browser

### Start the development server

```bash
npm ci
npm run dev
```

The development server runs at <http://127.0.0.1:5006> and uses a fixed port.

### Production build

```bash
npm run build
npm run preview
```

`npm run build` runs Vite and then `scripts/fix-cesium-base.mjs` to correct Cesium asset paths. Run `npm run check` to execute the repository-wide type check followed by a production build.

## Deployment

GitHub Actions deploys the project to GitHub Pages. A push to `main` installs dependencies with Node.js 22, sets `BASE_PATH=/generate-building/`, builds `dist`, and publishes the artifact.

Set `BASE_PATH` when deploying under a different subpath:

```bash
BASE_PATH=/your-base-path/ npm run build
```

PowerShell example:

```powershell
$env:BASE_PATH='/your-base-path/'
npm run build
```

Static-deployment considerations:

- Cesium asset paths must match `BASE_PATH`.
- `/sam-api` exists only in the local Vite development server.
- A remote AI API can be called from a static site only when it permits browser cross-origin requests.
- Deploy a backend gateway as well when reliable AI access and credential protection are required.

## Project structure

```text
src/
├─ App.vue                          # Application root component
├─ components/workspace/            # Header, sidebars, inspector, and dialog components
├─ views/HomeView.vue               # GIS workspace composition and state coordination
├─ views/home/                      # Map, drawing, import/export, and AI view logic
├─ styles/workspace.css             # Shared workspace theme and layout styles
├─ types/workspace.ts               # Workspace component contracts
├─ lib/ai/                          # SAM and multi-provider vision adapters
├─ lib/viewer/                      # Cesium viewer, camera, terrain, and layers
├─ lib/geometry/                    # Building/ground geometry and mask tracing
├─ lib/widget/                      # Drawing and measurement widgets
└─ main.ts                          # Vue/Cesium bootstrap and legacy compatibility

scripts/fix-cesium-base.mjs         # Post-build Cesium base-path correction
.github/workflows/deploy-pages.yml  # GitHub Pages deployment
```

## Known limitations

- The app still contains dynamically mixed-in SDK code recovered from a legacy project; several modules do not have complete type declarations.
- General-purpose vision models produce approximate outlines and are not a replacement for professional surveying or a trained segmentation model.
- The importer is not a general-purpose GeoJSON editor; it primarily supports the project schema and Polygon building features.
- Very large scenes, complex polygons, and large model catalogs have not been systematically benchmarked.
- `npm run type-check` and `npm run check` are available; automated unit tests are not configured yet.
