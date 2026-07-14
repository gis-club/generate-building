<template>
  <div class="home-view" @click="showInfo($event, 0)">
    <div class="home-view__ambient home-view__ambient--teal" />
    <div class="home-view__ambient home-view__ambient--violet" />
    <div class="home-view__mesh" />
    <div id="posList" />
    <input id="fileInput" type="file" accept=".json,.geojson" hidden />

    <template v-if="checkFlag">
      <div id="map" ref="imgBox" class="map-layer" :style="{ height: `${mapDivHeight}px`, width: '100%' }" />
      <div
        id="threeContainer"
        ref="threeContainer"
        class="model-layer"
        :style="{ height: `${mapDivHeight}px`, width: '100%' }"
      />

      <header class="studio-header" @click.stop>
        <div class="studio-brand">
          <div class="studio-brand__mark"><span>G</span></div>
          <div class="studio-brand__copy">
            <strong>GeoBuild</strong>
            <span>空间建模工作台</span>
          </div>
        </div>

        <div class="studio-breadcrumb">
          <span>工作空间</span>
          <b>/</b>
          <strong>建筑白模生成</strong>
          <span class="studio-save-state"><i /> 已保存</span>
        </div>

        <div class="studio-header__summary">
          <span><b>{{ finalData.length }}</b> 个建筑</span>
          <span><b>{{ pointCount }}</b> 个轮廓点</span>
          <span>{{ sceneModeLabel }}</span>
        </div>

        <div class="studio-header__actions">
          <button class="studio-header-btn" @click="openImportDialog">
            <el-icon><Upload /></el-icon>
            导入
          </button>
          <button class="studio-header-btn studio-header-btn--primary" @click="exportJson(0)">
            <el-icon><Download /></el-icon>
            导出
          </button>
          <button class="studio-icon-btn" title="帮助" @click="showInfo($event, 1)">
            <el-icon><HelpFilled /></el-icon>
          </button>
          <button class="studio-icon-btn" title="关于" @click="showInfo($event, 2)">
            <el-icon><InfoFilled /></el-icon>
          </button>
        </div>
      </header>

      <nav class="studio-rail" aria-label="工作区导航" @click.stop>
        <div class="studio-rail__main">
          <button
            :class="{ 'is-active': activeWorkspacePanel === 'layers' }"
            title="数据与图层"
            @click="activeWorkspacePanel = 'layers'"
          >
            <el-icon><Files /></el-icon>
            <span>图层</span>
          </button>
          <button
            :class="{ 'is-active': activeWorkspacePanel === 'tools' }"
            title="处理工具"
            @click="activeWorkspacePanel = 'tools'"
          >
            <el-icon><Operation /></el-icon>
            <span>处理</span>
          </button>
          <button title="切换场景" @click="updateView()">
            <el-icon><View /></el-icon>
            <span>视图</span>
          </button>
          <button :class="{ 'is-active': aiRunning }" title="AI 辅助" @click="handleAIAssist">
            <el-icon><MagicStick /></el-icon>
            <span>AI</span>
          </button>
        </div>
        <div class="studio-rail__bottom">
          <button title="工作台说明" @click="showInfo($event, 4)">
            <el-icon><InfoFilled /></el-icon>
            <span>说明</span>
          </button>
        </div>
      </nav>

      <aside class="left-toolbar studio-sidebar" @click.stop>
        <div class="studio-sidebar__header">
          <div>
            <span class="studio-panel-kicker">Workspace</span>
            <h1>{{ activeWorkspacePanel === 'layers' ? '数据与图层' : '空间处理工具' }}</h1>
          </div>
          <span class="studio-count-badge">{{ activeWorkspacePanel === 'layers' ? finalData.length + 1 : 15 }}</span>
        </div>

        <div class="studio-sidebar__tabs">
          <button
            :class="{ 'is-active': activeWorkspacePanel === 'layers' }"
            @click="activeWorkspacePanel = 'layers'"
          >
            图层
          </button>
          <button
            :class="{ 'is-active': activeWorkspacePanel === 'tools' }"
            @click="activeWorkspacePanel = 'tools'"
          >
            工具
          </button>
        </div>

        <label class="studio-search">
          <el-icon><Search /></el-icon>
          <input v-model="toolSearch" :placeholder="activeWorkspacePanel === 'layers' ? '搜索图层' : '搜索处理工具'" />
          <kbd>/</kbd>
        </label>

        <div v-if="activeWorkspacePanel === 'layers'" class="studio-sidebar__scroll">
          <section class="studio-section">
            <div class="studio-section__heading">
              <span>地图内容</span>
              <button title="添加图层" @click="toggleLayerPanel"><el-icon><Plus /></el-icon></button>
            </div>

            <div v-show="matchesSearch('ArcGIS 卫星影像 底图')" class="studio-layer-row is-basemap">
              <span class="studio-layer-thumb studio-layer-thumb--imagery" />
              <div>
                <strong>ArcGIS 卫星影像</strong>
                <small>影像底图 · 在线</small>
              </div>
              <span class="studio-layer-tag">底图</span>
            </div>

            <div
              v-for="item in finalData"
              v-show="matchesSearch(item.name || `建筑 ${item.id + 1}`)"
              :key="`layer-${item.id}`"
              class="studio-layer-row"
              @click="updatePanel(item.id)"
            >
              <span class="studio-layer-thumb" :style="{ background: item.color }">
                <el-icon><Box /></el-icon>
              </span>
              <div>
                <strong>{{ item.name || `建筑 ${item.id + 1}` }}</strong>
                <small>面要素 · {{ Math.max(item.lonlats.length - 1, 0) }} 个节点</small>
              </div>
              <span class="studio-layer-dot" />
            </div>

            <div v-if="finalData.length === 0" class="studio-empty-layer">
              <el-icon><Box /></el-icon>
              <strong>还没有建筑图层</strong>
              <p>绘制区域或导入 GeoJSON 开始建模</p>
              <button @click="handleDrawArea">绘制第一个区域</button>
            </div>
          </section>

          <section class="studio-section studio-section--actions">
            <div class="studio-section__heading"><span>数据源</span></div>
            <button class="studio-action-row" @click="openImportDialog">
              <span><el-icon><Upload /></el-icon></span>
              <div><strong>导入本地数据</strong><small>GeoJSON / JSON</small></div>
            </button>
            <button class="studio-action-row" @click="toggleLayerPanel">
              <span><el-icon><MapLocation /></el-icon></span>
              <div><strong>连接在线图层</strong><small>XYZ / WMTS 服务</small></div>
            </button>
          </section>
        </div>

        <div v-else class="studio-sidebar__scroll studio-toolbox">
          <section v-show="matchesSearch('绘制区域 导入 GeoJSON')" class="studio-section">
            <div class="studio-section__heading"><span>最近使用</span></div>
            <div class="studio-recent-grid">
              <button @click="handleDrawArea"><el-icon><EditPen /></el-icon><span>绘制区域</span></button>
              <button @click="openImportDialog"><el-icon><Upload /></el-icon><span>导入数据</span></button>
            </div>
          </section>

          <section v-show="matchesSearch('回到正北 初始位置 自定义位置 图层控制')" class="studio-section">
            <div class="studio-section__heading"><span>地图导航</span><small>4</small></div>
            <button v-show="matchesSearch('回到正北')" class="studio-tool-row" @click="handleGoNorth">
              <span><el-icon><Aim /></el-icon></span><div><strong>回到正北</strong><small>校正地图方向</small></div><kbd>N</kbd>
            </button>
            <button v-show="matchesSearch('初始位置')" class="studio-tool-row" @click="handleResetHome">
              <span><el-icon><Refresh /></el-icon></span><div><strong>初始位置</strong><small>回到默认视角</small></div><kbd>H</kbd>
            </button>
            <button v-show="matchesSearch('自定义位置')" class="studio-tool-row" @click="togglePositionPanel">
              <span><el-icon><Location /></el-icon></span><div><strong>定位到坐标</strong><small>WGS84 经纬度</small></div>
            </button>
            <button v-show="matchesSearch('图层控制')" class="studio-tool-row" @click="showComingSoon('图层控制')">
              <span><el-icon><MapLocation /></el-icon></span><div><strong>图层控制</strong><small>可见性与顺序</small></div>
            </button>
          </section>

          <section v-show="matchesSearch('导入 导出 GeoJSON glTF 自定义图层')" class="studio-section">
            <div class="studio-section__heading"><span>数据管理</span><small>4</small></div>
            <button v-show="matchesSearch('导入 GeoJSON')" class="studio-tool-row" @click="openImportDialog">
              <span><el-icon><Upload /></el-icon></span><div><strong>导入 GeoJSON</strong><small>添加本地矢量数据</small></div>
            </button>
            <button v-show="matchesSearch('自定义图层')" class="studio-tool-row" @click="toggleLayerPanel">
              <span><el-icon><Plus /></el-icon></span><div><strong>添加在线图层</strong><small>连接地图服务</small></div>
            </button>
            <button v-show="matchesSearch('导出 GeoJSON')" class="studio-tool-row" @click="exportJson(0)">
              <span><el-icon><Download /></el-icon></span><div><strong>导出 GeoJSON</strong><small>保存矢量结果</small></div>
            </button>
            <button v-show="matchesSearch('导出 glTF')" class="studio-tool-row" @click="exportGltf()">
              <span><el-icon><Download /></el-icon></span><div><strong>导出 glTF</strong><small>保存三维模型</small></div>
            </button>
          </section>

          <section v-show="matchesSearch('场景 高度 模型 线框 隐藏 折叠')" class="studio-section">
            <div class="studio-section__heading"><span>三维建模</span><small>7</small></div>
            <button v-show="matchesSearch('切换场景')" class="studio-tool-row" @click="updateView()">
              <span><el-icon><Operation /></el-icon></span><div><strong>切换场景</strong><small>{{ sceneModeLabel }}</small></div>
            </button>
            <button v-show="matchesSearch('降低整体高度')" class="studio-tool-row" @click="adjustAllHeight(-5)">
              <span><el-icon><ArrowDown /></el-icon></span><div><strong>降低整体高度</strong><small>全部建筑 -5m</small></div>
            </button>
            <button v-show="matchesSearch('升高整体高度')" class="studio-tool-row" @click="adjustAllHeight(5)">
              <span><el-icon><ArrowUp /></el-icon></span><div><strong>升高整体高度</strong><small>全部建筑 +5m</small></div>
            </button>
            <button v-show="matchesSearch('实体预览 模型')" class="studio-tool-row" :class="{ 'is-active': selectedVisualMode === 'preview' }" @click="setVisualMode('preview')">
              <span><el-icon><View /></el-icon></span><div><strong>实体预览</strong><small>显示建筑模型</small></div>
            </button>
            <button v-show="matchesSearch('线框预览 模型')" class="studio-tool-row" :class="{ 'is-active': selectedVisualMode === 'wireframe' }" @click="setVisualMode('wireframe')">
              <span><el-icon><Grid /></el-icon></span><div><strong>线框预览</strong><small>查看模型拓扑</small></div>
            </button>
            <button v-show="matchesSearch('隐藏模型')" class="studio-tool-row" :class="{ 'is-active': selectedVisualMode === 'hidden' }" @click="setVisualMode('hidden')">
              <span><el-icon><Hide /></el-icon></span><div><strong>隐藏模型</strong><small>仅保留底图</small></div>
            </button>
            <button v-show="matchesSearch('折叠 参数')" class="studio-tool-row" @click="toggleAllPanels">
              <span><el-icon><Fold /></el-icon></span><div><strong>折叠参数面板</strong><small>整理对象检查器</small></div>
            </button>
          </section>

          <section v-show="matchesSearch('AI 智能 建筑识别')" class="studio-section">
            <div class="studio-section__heading"><span>智能处理</span><small>Beta</small></div>
            <div class="studio-ai-model-picker">
              <el-select
                v-model="aiActiveModelKey"
                size="small"
                placeholder="选择视觉模型"
                @change="onActiveAIModelChange"
              >
                <el-option-group
                  v-for="provider in aiProviders.filter((item) => item.enabled)"
                  :key="provider.id"
                  :label="provider.name"
                >
                  <el-option
                    v-for="model in provider.models.filter((item) => item.enabled && item.vision)"
                    :key="`${provider.id}::${model.id}`"
                    :label="model.name || model.id"
                    :value="`${provider.id}::${model.id}`"
                  />
                </el-option-group>
              </el-select>
              <button title="管理模型供应商" @click="openAIProviderManager">
                <el-icon><Setting /></el-icon>
              </button>
            </div>
            <button class="studio-tool-row studio-tool-row--ai" :class="{ 'is-active': aiRunning }" @click="handleAIAssist">
              <span><el-icon><MagicStick /></el-icon></span><div><strong>{{ aiRunning ? 'AI 识别中' : 'AI 建筑识别' }}</strong><small>从影像提取建筑轮廓</small></div>
            </button>
          </section>
        </div>

        <div class="studio-sidebar__footer">
          <span class="studio-online-dot" />
          <div><strong>本地工作区</strong><small>{{ currUserIsTry }} · 自动保存</small></div>
        </div>
      </aside>

      <div class="map-commandbar" @click.stop>
        <button title="初始位置" @click="handleResetHome"><el-icon><Refresh /></el-icon></button>
        <button title="回到正北" @click="handleGoNorth"><el-icon><Aim /></el-icon></button>
        <span />
        <button :class="{ 'is-active': drawingActive }" title="绘制区域" @click="handleDrawArea"><el-icon><EditPen /></el-icon></button>
        <button title="定位到坐标" @click="togglePositionPanel"><el-icon><Location /></el-icon></button>
      </div>

      <div class="map-overview-card" @click.stop>
        <span class="map-overview-card__icon"><el-icon><Box /></el-icon></span>
        <div><strong>{{ finalData.length }} 个建筑对象</strong><small>{{ visualModeLabel }} · 平均高度 {{ averageExtrudeHeight }}m</small></div>
      </div>

      <footer class="studio-statusbar" @click.stop>
        <div><span class="studio-online-dot" /> 就绪</div>
        <div class="studio-statusbar__center">
          <span>对象 {{ finalData.length }}</span>
          <span>节点 {{ pointCount }}</span>
          <span>场景 {{ sceneModeLabel }}</span>
        </div>
        <div><span>EPSG:4326</span><span>WGS 84</span><span>100%</span></div>
      </footer>
    </template>

    <div v-if="infoShow1" class="top-info" @click.stop>
      <div class="top">帮助</div>
      <div class="bottom">
        <div class="help-columns">
          <div class="help-column">
            <p>漫游地图：鼠标左键按下拖动</p>
            <p>缩放地图：滚轮控制缩放</p>
            <p>倾斜视角：鼠标中键按下拖动</p>
          </div>
          <div class="help-column">
            <p>绘制区域：左键逐点绘制，双击结束</p>
            <p>编辑顶点：选中点后拖动，右键删除</p>
            <p>插入顶点：单击线段附近插入新点</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="infoShow2" class="top-info" @click.stop>
      <div class="top">关于</div>
      <div class="bottom">
        <p>GIS 工作台用于快速完成地图浏览、区域绘制、参数调整、AI 辅助识别与模型导出。</p>
        <p>当前项目运行于纯前端预览模式，适合本地联调、界面演示与交互优化。</p>
      </div>
    </div>

    <div v-if="infoShow3" class="top-info" @click.stop>
      <div class="top">定价</div>
      <div class="bottom">
        <ul class="price-list">
          <li>
            <span>离线预览版</span>
            <strong>当前可用</strong>
          </li>
          <li>
            <span>专业版</span>
            <strong>待接入</strong>
          </li>
          <li>
            <span>企业版</span>
            <strong>待接入</strong>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="infoShow4" class="top-info" @click.stop>
      <div class="top">说明</div>
      <div class="bottom">
        <p>当前界面重点围绕白模高频工作流进行重构，预留的业务入口可继续挂接真实服务。</p>
        <p>如需进一步升级，下一步建议补齐图层管理、对象筛选和多视图联动能力。</p>
      </div>
    </div>






    <div v-if="errShow1" class="top-info top-info--warning" @click.stop>
      <div class="top">重要提示</div>
      <div class="bottom">{{ currUserErrorMsg }}</div>
    </div>

    <div
      v-if="downloadProgress > 0 && downloadProgress < 100"
      class="top-info top-info--warning"
      @click.stop
    >
      <div class="top">下载进度</div>
      <div class="bottom">
        <el-progress
          :text-inside="true"
          :stroke-width="20"
          :percentage="downloadProgress"
          :color="downloadProgressColors"
        />
      </div>
    </div>

    <div v-if="leftShow1" class="side-dialog" @click.stop>
      <div class="top">自定义位置</div>
      <div class="bottom">
        <el-form :model="posForm" label-width="92px">
          <el-form-item label="经度[WGS84]">
            <el-input v-model="posForm.lon" placeholder="请输入经度">
              <template #prepend>lon</template>
            </el-input>
          </el-form-item>
          <el-form-item label="纬度[WGS84]">
            <el-input v-model="posForm.lat" placeholder="请输入纬度">
              <template #prepend>lat</template>
            </el-input>
          </el-form-item>
          <el-form-item class="form-actions">
            <el-button type="primary" @click="posFormSubmit">确定</el-button>
            <el-button @click="posFormCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div v-if="leftShow2" class="side-dialog" @click.stop>
      <div class="top">添加自定义图层</div>
      <div class="bottom">
        <el-form :model="layerForm" label-width="70px">
          <el-form-item label="地址">
            <el-input v-model="layerForm.url" placeholder="请输入在线图层地址">
              <template #prepend>url</template>
            </el-input>
          </el-form-item>
          <el-form-item label="图层名称">
            <el-input v-model="layerForm.name" placeholder="请输入图层名称" />
          </el-form-item>
          <el-form-item class="form-actions">
            <el-button type="primary" @click="layerFormSubmit">添加</el-button>
            <el-button @click="layerFormCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <aside
      ref="scrollContainer"
      class="tool-panel right-toolbar"
      :style="{ height: `${mapDivHeight - 70}px` }"
      @click.stop
    >
      <div class="right-toolbar__header">
        <div class="right-toolbar__title">
          <span class="right-toolbar__eyebrow">Inspector</span>
          <strong>对象检查器</strong>
        </div>
        <button class="right-toolbar__toggle" @click="toggleAllPanels">{{ panelToggleText }}</button>
      </div>

      <div class="right-toolbar__stats">
        <div class="right-stat-card">
          <span>建筑</span>
          <strong>{{ finalData.length }}</strong>
        </div>
        <div class="right-stat-card">
          <span>轮廓点</span>
          <strong>{{ pointCount }}</strong>
        </div>
        <div class="right-stat-card">
          <span>平均高度</span>
          <strong>{{ averageExtrudeHeight }}m</strong>
        </div>
      </div>

      <div v-if="finalData.length === 0" class="inspector-empty">
        <span><el-icon><Setting /></el-icon></span>
        <strong>未选择空间对象</strong>
        <p>从左侧图层面板导入数据，或使用绘制工具创建新的建筑轮廓。</p>
        <button @click="handleDrawArea"><el-icon><EditPen /></el-icon> 绘制区域</button>
      </div>

      <div v-for="item in finalData" :key="item.id" class="geometry-card">
        <div
          class="geometry-card__title"
          :style="
            item.panelShow
              ? {
                  background: `linear-gradient(135deg, ${item.color}, rgba(109, 125, 255, 0.92))`,
                  borderColor: item.color,
                  color: '#ffffff'
                }
              : {}
          "
          @click="updatePanel(item.id)"
        >
          <div class="geometry-card__title-copy">
            <span class="geometry-card__serial">#{{ item.id + 1 }}</span>
            <div>
              <strong>{{ item.name || `几何体 ${item.id + 1}` }}</strong>
              <small>{{ Math.max(item.lonlats.length - 1, 0) }} 个轮廓点</small>
            </div>
          </div>
          <button class="geometry-card__delete" @click.stop="deleteSingle(item.id)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <div v-show="item.panelShow" class="geometry-card__body">
          <div class="tool-content">
            <div class="tool-content__head">
              <h4 class="tool-content__tag">基础信息</h4>
              <span class="tool-content__meta">坐标（{{ item.lonlats.length }} 个）</span>
            </div>
            <el-input v-model="item.name" size="small" placeholder="请输入建筑名称" @change="updateAll">
              <template #prepend>名称</template>
            </el-input>
          </div>

          <div class="tool-content tool-content--params">
            <div class="tool-content__head">
              <h4 class="tool-content__tag">参数设置</h4>
              <span class="tool-content__meta">实时刷新</span>
            </div>
            <div class="params-row">
              <span>底部高度</span>
              <el-input-number
                v-model="item.height"
                :precision="0"
                :step="1"
                :max="1000"
                size="small"
                @change="updateAll"
                @input="updateAllInput"
              />
            </div>

            <div class="params-row">
              <span>顶部高度</span>
              <el-input-number
                v-model="item.extrudeHeight"
                :precision="2"
                :step="1"
                :max="1000"
                size="small"
                @change="updateAll"
                @input="updateAllInput"
              />
            </div>

            <div class="params-row">
              <span>选择颜色</span>
              <div class="params-row__color">
                <span class="color-dot" :style="{ background: item.color }" />
                <el-color-picker
                  v-model="item.color"
                  :predefine="predefineColors"
                  size="small"
                  @change="updateAll"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <el-dialog
      v-model="aiProviderDialogVisible"
      title="AI 模型供应商"
      width="min(980px, 94vw)"
      class="ai-provider-dialog"
      append-to-body
      destroy-on-close
      @closed="saveAIProviderSettings(false)"
    >
      <div class="ai-provider-intro">
        <div>
          <strong>像 Dify 一样管理供应商与模型</strong>
          <p>一个供应商可配置多个模型；建筑识别只调用当前选中的视觉模型。</p>
        </div>
        <el-tag type="warning" effect="plain">浏览器直连</el-tag>
      </div>

      <div class="ai-provider-addbar">
        <el-select v-model="aiNewProviderTemplate" filterable>
          <el-option
            v-for="template in aiProviderTemplates"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          />
        </el-select>
        <el-button type="primary" @click="addAIProvider"><el-icon><Plus /></el-icon>新增供应商</el-button>
      </div>

      <div class="ai-provider-list">
        <article
          v-for="provider in aiProviders"
          :id="`ai-provider-${provider.id}`"
          :key="provider.id"
          class="ai-provider-card"
          :class="{ 'is-disabled': !provider.enabled }"
        >
          <header>
            <div class="ai-provider-card__identity">
              <span><el-icon><MagicStick /></el-icon></span>
              <div>
                <el-input v-model="provider.name" :disabled="provider.builtin" @change="saveAIProviderSettings(false)" />
                <small>{{ provider.protocol }}</small>
              </div>
            </div>
            <div class="ai-provider-card__header-actions">
              <el-switch v-model="provider.enabled" @change="saveAIProviderSettings(false)" />
              <el-button v-if="!provider.builtin" text type="danger" @click="removeAIProvider(provider)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </header>

          <template v-if="provider.protocol !== 'local-sam'">
            <div class="ai-provider-form-grid">
              <label>
                <span>接口协议</span>
                <el-select v-model="provider.protocol" @change="saveAIProviderSettings(false)">
                  <el-option label="OpenAI Responses" value="openai-responses" />
                  <el-option label="OpenAI Compatible / Chat Completions" value="openai-compatible" />
                  <el-option label="Anthropic Messages" value="anthropic" />
                  <el-option label="Google Gemini" value="gemini" />
                  <el-option label="Azure OpenAI" value="azure-openai" />
                </el-select>
              </label>
              <label>
                <span>API Endpoint</span>
                <el-input v-model="provider.baseUrl" placeholder="https://api.example.com/v1" @change="saveAIProviderSettings(false)" />
              </label>
              <label>
                <span>API Key</span>
                <el-input v-model="provider.apiKey" type="password" show-password placeholder="sk-..." @change="saveAIProviderSettings(false)" />
              </label>
              <label class="ai-provider-remember">
                <span>密钥存储</span>
                <el-checkbox v-model="provider.rememberApiKey" @change="saveAIProviderSettings(false)">
                  长期保存在此浏览器
                </el-checkbox>
              </label>
              <label class="ai-provider-headers">
                <span>自定义请求头（JSON，可选）</span>
                <el-input
                  v-model="provider.headersText"
                  type="textarea"
                  :rows="2"
                  placeholder='{"X-Project-ID":"..."}'
                  @change="saveAIProviderSettings(false)"
                />
              </label>
            </div>

            <div class="ai-provider-actions">
              <el-button
                :loading="aiProviderBusyId === provider.id"
                :disabled="Boolean(aiProviderBusyId)"
                @click="testAIProvider(provider)"
              >测试连接</el-button>
              <el-button
                :loading="aiProviderBusyId === provider.id"
                :disabled="Boolean(aiProviderBusyId)"
                @click="discoverAIModels(provider)"
              >获取模型</el-button>
            </div>
          </template>

          <div class="ai-model-list">
            <div class="ai-model-list__heading">
              <span>模型目录 <b>{{ provider.models.length }}</b></span>
              <el-button v-if="!provider.builtin" text type="primary" @click="addAIModel(provider)">
                <el-icon><Plus /></el-icon>手动添加模型
              </el-button>
            </div>
            <div v-if="provider.models.length" class="ai-model-table">
              <div class="ai-model-table__head"><span>当前</span><span>模型 ID</span><span>显示名称</span><span>视觉</span><span>启用</span><span /></div>
              <div v-for="(model, modelIndex) in provider.models" :key="`${provider.id}-${modelIndex}`" class="ai-model-row">
                <el-radio v-model="aiActiveModelKey" :label="`${provider.id}::${model.id}`" :disabled="!provider.enabled || !model.enabled || !model.id" @change="onActiveAIModelChange"><span /></el-radio>
                <el-input v-model="model.id" placeholder="model-id" :disabled="provider.builtin" @change="saveAIProviderSettings(false)" />
                <el-input v-model="model.name" placeholder="显示名称" :disabled="provider.builtin" @change="saveAIProviderSettings(false)" />
                <el-switch v-model="model.vision" :disabled="provider.builtin" @change="saveAIProviderSettings(false)" />
                <el-switch v-model="model.enabled" :disabled="provider.builtin" @change="saveAIProviderSettings(false)" />
                <el-button v-if="!provider.builtin" text type="danger" @click="removeAIModel(provider, modelIndex)"><el-icon><Delete /></el-icon></el-button>
              </div>
            </div>
            <div v-else class="ai-model-empty">还没有模型，可在线获取或手动添加模型 ID。</div>
          </div>
        </article>
      </div>

      <div class="ai-provider-security">
        API Key 默认仅保存在当前标签会话；勾选“长期保存”后才写入 localStorage。纯前端直连可能受供应商 CORS 限制，生产环境建议通过自己的后端网关转发并保管密钥。
      </div>

      <template #footer>
        <div class="ai-provider-footer">
          <label>最多识别 <el-input-number v-model="aiMaxBuildings" :min="1" :max="100" size="small" /> 个建筑</label>
          <div>
            <el-button @click="aiProviderDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveAIProviderSettings(); aiProviderDialogVisible = false">保存配置</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import {
  Aim,
  ArrowDown,
  ArrowUp,
  Box,
  Delete,
  Download,
  EditPen,
  Files,
  Fold,
  Grid,
  HelpFilled,
  Hide,
  InfoFilled,
  Location,
  MagicStick,
  MapLocation,
  Operation,
  Plus,
  Refresh,
  Search,
  Setting,
  Upload,
  View
} from '@element-plus/icons-vue'
import homeViewOptions from './HomeView.logic.ts'
import { listActiveVisionModels } from '../lib/ai/vision-provider-registry.ts'

/**
 * 读取组合后的基础状态工厂。
 * 这里保留 Options API 写法，避免一次性重构过大影响现有 Cesium / Three 逻辑。
 */
const createBaseData = homeViewOptions.data

export default {
  ...homeViewOptions,
  components: {
    ...(homeViewOptions.components || {}),
    Aim,
    ArrowDown,
    ArrowUp,
    Box,
    Delete,
    Download,
    EditPen,
    Files,
    Fold,
    Grid,
    HelpFilled,
    Hide,
    InfoFilled,
    Location,
    MagicStick,
    MapLocation,
    Operation,
    Plus,
    Refresh,
    Search,
    Setting,
    Upload,
    View
  },
  data() {
    /**
     * 先获取逻辑层提供的原始状态，再在视图层补充仅用于界面高亮的字段。
     * `selectedVisualMode` 只负责按钮状态，不直接参与底层几何生成。
     */
    const baseData = typeof createBaseData === 'function' ? createBaseData.call(this) : {}
    return {
      ...baseData,
      selectedVisualMode: 'preview',
      activeWorkspacePanel: 'layers',
      toolSearch: ''
    }
  },
  computed: {
    aiModelOptions() {
      return listActiveVisionModels(this.aiProviders || [])
    },
    activeAIModelLabel() {
      return this.aiModelOptions.find((item) => item.key === this.aiActiveModelKey)?.modelName || '未选择模型'
    },
    pointCount() {
      if (!Array.isArray(this.finalData)) return 0
      return this.finalData.reduce((total, item) => total + Math.max((item.lonlats?.length || 1) - 1, 0), 0)
    },
    averageExtrudeHeight() {
      if (!Array.isArray(this.finalData) || this.finalData.length === 0) return 0
      const total = this.finalData.reduce((sum, item) => sum + Number(item.extrudeHeight || 0), 0)
      return Math.round(total / this.finalData.length)
    },
    visualModeLabel() {
      if (this.selectedVisualMode === 'wireframe') return '线框预览'
      if (this.selectedVisualMode === 'hidden') return '隐藏模型'
      return '实体预览'
    },
    sceneModeLabel() {
      return this.sceneFlag ? '地球场景' : '纯净背景'
    },
    panelToggleText() {
      return this.allPanelShow ? '全部收起' : '展开全部'
    }
  },
  methods: {
    ...(homeViewOptions.methods || {}),
    matchesSearch(...labels) {
      const keyword = String(this.toolSearch || '').trim().toLowerCase()
      if (!keyword) return true
      return labels.some((label) => String(label || '').toLowerCase().includes(keyword))
    },
    /**
     * 关闭顶部说明类浮层。
     * 左侧工具面板切换前统一调用，避免多个面板叠在一起。
     */
    closeFloatPanels() {
      this.infoShow1 = false
      this.infoShow2 = false
      this.infoShow3 = false
      this.infoShow4 = false
    },
    triggerResize() {
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },
    /**
     * 相机快速回正北方向，方便用户重新建立方向感。
     */
    handleGoNorth() {
      const homePos = this.baseWidgetObject?.homePos || this.homePos
      if (!window.myViewer?.locationCenter || !homePos?.pos) return

      window.myViewer.locationCenter({
        pos: homePos.pos,
        headingAngle: 0,
        pitchAngle: homePos.pitch ?? -90,
        distance: homePos.distance ?? 4000
      })
    },
    /**
     * 回到初始视角。
     * 优先使用运行时小部件记录的位置，其次退回页面默认 homePos。
     */
    handleResetHome() {
      const homePos = this.baseWidgetObject?.homePos || this.homePos
      if (!window.myViewer?.locationCenter || !homePos?.pos) return

      window.myViewer.locationCenter({
        pos: homePos.pos,
        headingAngle: homePos.heading ?? 0,
        pitchAngle: homePos.pitch ?? -90,
        distance: homePos.distance ?? 4000
      })
    },
    /**
     * 展开/收起“自定义位置”面板。
     */
    togglePositionPanel() {
      this.closeFloatPanels()
      this.leftShow1 = !this.leftShow1
      this.leftShow2 = false
      this.triggerResize()
    },
    /**
     * 展开/收起“自定义图层”面板。
     */
    toggleLayerPanel() {
      this.closeFloatPanels()
      this.leftShow1 = false
      this.leftShow2 = !this.leftShow2
      this.triggerResize()
    },
    /**
     * 触发隐藏文件输入框，导入 GeoJSON。
     */
    openImportDialog() {
      const fileInput = document.getElementById('fileInput')
      if (fileInput) fileInput.click()
    },
    /**
     * 统一消息提示出口，兼容旧逻辑中的 `window.Mx`。
     */
    notify(message, type = 'info') {
      if (typeof window.Mx === 'function') {
        window.Mx({ type, message })
      }
    },
    /**
     * 绘制区域按钮逻辑：
     * - 再次点击时取消当前绘制；
     * - 首次点击时进入多边形测绘状态。
     */
    handleDrawArea() {
      if (this.drawingActive) {
        this.cancelCurrentDrawing?.()
        return
      }

      this.closeFloatPanels()
      this.leftShow1 = false
      this.leftShow2 = false
      this.update?.(0)
      this.notify('左键逐点绘制，双击完成区域', 'success')
    },
    /**
     * AI 辅助入口。
     * 如果 AI 正在处理，则仅做提示，避免重复发起请求。
     */
    handleAIAssist() {
      if (this.aiRunning) {
        this.notify('AI识别进行中，请稍候', 'info')
        return
      }

      this.closeFloatPanels()
      this.leftShow1 = false
      this.leftShow2 = false
      this.useActiveAIModel?.()
    },
    /**
     * 一键折叠/展开右侧所有几何配置卡片。
     */
    toggleAllPanels() {
      const next = !this.allPanelShow
      this.fold(next)
      this.allPanelShow = next
    },
    /**
     * 切换模型显示模式。
     * `preview`：正常实体
     * `wireframe`：线框
     * `hidden`：隐藏建筑，仅保留底图与编辑数据
     */
    setVisualMode(mode) {
      this.selectedVisualMode = mode

      if (mode === 'preview') {
        this.modelMode = undefined
        this.highlightButton?.('预览模型')
        this.genBuild?.()
        return
      }

      if (mode === 'wireframe') {
        this.modelMode = 'vertex'
        this.highlightButton?.('线框化')
        this.vertexBuild?.()
        return
      }

      this.modelMode = 'hidden'
      this.highlightButton?.('隐藏模型')
      this.updateAll?.()
    },
    /**
     * 暂未接入的按钮统一提示。
     */
    showComingSoon(label) {
      if (typeof window.Mx === 'function') {
        window.Mx({ type: 'info', message: `${label} 暂未接入，当前先保留静态界面。` })
      }
    }
  }
}
</script>

<style>
html,
body,
#app {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.home-view {
  --home-text: #f7f9ff;
  --home-text-muted: #aebbd8;
  --home-panel: rgba(8, 16, 30, 0.78);
  --home-panel-soft: rgba(255, 255, 255, 0.05);
  --home-panel-border: rgba(255, 255, 255, 0.08);
  --home-accent: #74dbc8;
  --home-accent-strong: #7d8eff;
  --home-shadow: 0 28px 60px rgba(0, 0, 0, 0.26);
  --el-color-primary: #7d8eff;
  --el-text-color-primary: #f7f9ff;
  --el-text-color-regular: #dbe3f7;
  --el-text-color-secondary: #aebbd8;
  --el-border-color: rgba(255, 255, 255, 0.1);
  --el-border-color-light: rgba(255, 255, 255, 0.08);
  --el-border-color-lighter: rgba(255, 255, 255, 0.06);
  --el-fill-color-blank: rgba(255, 255, 255, 0.05);
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 12%, rgba(73, 210, 183, 0.14), transparent 30%),
    radial-gradient(circle at 88% 14%, rgba(125, 142, 255, 0.18), transparent 28%),
    linear-gradient(180deg, #07111f 0%, #091628 56%, #0a1831 100%);
  color: var(--home-text);
  font-family: Inter, 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.home-view__ambient,
.home-view__mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-view__ambient {
  filter: blur(90px);
}

.home-view__ambient--teal {
  top: -8%;
  left: -10%;
  width: 34vw;
  height: 34vw;
  background: radial-gradient(circle, rgba(73, 210, 183, 0.42), transparent 70%);
}

.home-view__ambient--violet {
  top: 8%;
  right: -6%;
  width: 28vw;
  height: 28vw;
  background: radial-gradient(circle, rgba(125, 142, 255, 0.32), transparent 70%);
}

.home-view__mesh {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.4), transparent 74%);
}

.map-layer,
.model-layer {
  position: absolute;
  inset: 0;
}

.model-layer {
  pointer-events: none;
}

.left-toolbar {
  position: absolute;
  top: 24px;
  left: 24px;
  bottom: 24px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: 220px;
  padding: 18px 14px;
  overflow-y: auto;
  border: 1px solid var(--home-panel-border);
  border-radius: 28px;
  background: var(--home-panel);
  box-shadow: var(--home-shadow);
  backdrop-filter: blur(20px);
}

.left-toolbar__brand {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 10px;
  padding: 6px 6px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.left-toolbar__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: linear-gradient(135deg, #42d392, #647eff 60%, #9b6dff);
  color: #07111f;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 1px;
  box-shadow: 0 18px 36px rgba(66, 211, 146, 0.2);
}

.left-toolbar__brand-copy span,
.top-panel__eyebrow,
.right-toolbar__eyebrow {
  color: var(--home-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.left-toolbar__brand-copy h1 {
  margin: 6px 0 8px;
  font-size: 22px;
  line-height: 1.25;
  color: var(--home-text);
}

.left-toolbar__brand-copy p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--home-text-muted);
}

.left-toolbar__section {
  margin: 16px 6px 8px;
  color: var(--home-text-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.left-tool-btn {
  min-height: 42px;
  margin-bottom: 8px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.045);
  color: var(--home-text);
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.left-tool-btn:hover,
.left-tool-btn.is-active {
  transform: translateY(-1px);
  border-color: rgba(125, 142, 255, 0.25);
  background: linear-gradient(135deg, rgba(116, 219, 200, 0.18), rgba(125, 142, 255, 0.22));
  color: #ffffff;
}

.top-panel {
  position: absolute;
  top: 24px;
  left: 268px;
  right: 24px;
  z-index: 28;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
  min-height: 108px;
  padding: 18px 22px;
  border: 1px solid var(--home-panel-border);
  border-radius: 28px;
  background: var(--home-panel);
  box-shadow: var(--home-shadow);
  backdrop-filter: blur(20px);
}

.top-panel__overview {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.top-panel__intro strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
  font-weight: 700;
}

.top-panel__stats {
  display: flex;
  gap: 10px;
}

.top-stat-chip {
  min-width: 96px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.top-stat-chip span {
  display: block;
  margin-bottom: 6px;
  color: var(--home-text-muted);
  font-size: 12px;
}

.top-stat-chip strong {
  font-size: 14px;
  color: var(--home-text);
}

.top-panel__links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-panel__links button {
  min-width: 72px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--home-text);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.top-panel__links button:hover {
  transform: translateY(-1px);
  border-color: rgba(125, 142, 255, 0.28);
  background: rgba(125, 142, 255, 0.16);
}

.top-info,
.side-dialog {
  position: absolute;
  z-index: 40;
  width: 400px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--home-panel-border);
  background: rgba(8, 16, 30, 0.86);
  box-shadow: var(--home-shadow);
  backdrop-filter: blur(20px);
}

.top-info {
  top: 148px;
  left: 268px;
}

.top-info--warning {
  right: 24px;
  left: auto;
  width: 360px;
}

.side-dialog {
  top: 148px;
  left: 268px;
  width: 430px;
}

.top-info .top,
.side-dialog .top {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(116, 219, 200, 0.24), rgba(125, 142, 255, 0.28));
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
}

.top-info .bottom,
.side-dialog .bottom {
  padding: 20px;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.8;
}

.help-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.help-column p,
.mbs-price-precautions p,
.top-info .bottom p {
  margin: 0 0 8px;
}

.price-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0 0 14px;
  list-style: none;
}

.price-list li {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  font-weight: 700;
}

.right-toolbar {
  position: absolute;
  top: 148px;
  right: 24px;
  z-index: 26;
  width: 340px;
  padding: 18px 18px 40px;
  overflow-y: auto;
  border: 1px solid var(--home-panel-border);
  border-radius: 28px;
  background: var(--home-panel);
  box-shadow: var(--home-shadow);
  backdrop-filter: blur(20px);
}

.right-toolbar__header,
.right-toolbar__title,
.right-toolbar__stats,
.geometry-card__title-copy,
.tool-content__head,
.params-row__color {
  display: flex;
}

.right-toolbar__header,
.tool-content__head {
  align-items: center;
  justify-content: space-between;
}

.right-toolbar__header {
  margin-bottom: 14px;
}

.right-toolbar__title {
  flex-direction: column;
  gap: 4px;
}

.right-toolbar__title strong {
  font-size: 20px;
}

.right-toolbar__toggle {
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--home-text);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.right-toolbar__stats {
  gap: 10px;
  margin-bottom: 16px;
}

.right-stat-card {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
}

.right-stat-card span {
  display: block;
  margin-bottom: 8px;
  color: var(--home-text-muted);
  font-size: 12px;
}

.right-stat-card strong {
  color: var(--home-text);
  font-size: 18px;
}

.geometry-card {
  margin-bottom: 14px;
}

.geometry-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--home-text);
  cursor: pointer;
}

.geometry-card__title-copy {
  align-items: center;
  gap: 12px;
}

.geometry-card__title-copy strong {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.geometry-card__title-copy small {
  color: rgba(255, 255, 255, 0.72);
}

.geometry-card__serial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 800;
}

.geometry-card__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 14px;
  background: #ff5b2e;
  color: #ffffff;
  cursor: pointer;
}

.geometry-card__body {
  margin-top: 12px;
}

.tool-content {
  margin-bottom: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.045);
}

.tool-content__tag {
  display: inline-block;
  margin: 0;
  color: var(--home-text);
  font-size: 14px;
  font-weight: 700;
}

.tool-content__meta {
  color: var(--home-text-muted);
  font-size: 12px;
}

.tool-content--params {
  padding-bottom: 6px;
}

.params-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--home-text);
  font-size: 15px;
  font-weight: 700;
}

.params-row__color {
  align-items: center;
  gap: 10px;
}

.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
}

.params-row .el-input-number {
  width: 126px;
}

.form-actions .el-form-item__content {
  justify-content: flex-end;
}

.home-view .el-input__wrapper,
.home-view .el-input-number,
.home-view .el-color-picker__trigger {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: none;
}

.home-view .el-input-group__prepend {
  background: rgba(255, 255, 255, 0.08);
  color: var(--home-text-muted);
  border-color: rgba(255, 255, 255, 0.08);
}

.home-view .el-form-item__label {
  color: var(--home-text-muted);
}

.home-view .el-button:not(.el-button--primary) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--home-text);
}

#mbs-widget1,
#mbs-widget2,
#mbs-widget {
  display: none !important;
}

@media (max-width: 1480px) {
  .top-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .top-panel__overview {
    width: 100%;
  }

  .top-panel__stats {
    flex-wrap: wrap;
  }
}

@media (max-width: 1280px) {
  .left-toolbar,
  .top-panel,
  .right-toolbar,
  .top-info,
  .side-dialog {
    left: 20px;
    right: 20px;
    width: auto;
  }

  .left-toolbar {
    top: 20px;
    bottom: auto;
    width: calc(100% - 40px);
    max-height: 320px;
  }

  .top-panel {
    top: 364px;
  }

  .top-info,
  .side-dialog {
    top: 500px;
  }

  .right-toolbar {
    top: 640px;
  }
}

@media (max-width: 960px) {
  .home-view {
    overflow-y: auto;
  }

  .top-panel__overview,
  .top-panel__stats,
  .right-toolbar__stats,
  .help-columns {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>

<style src="./HomeView.studio.css"></style>
