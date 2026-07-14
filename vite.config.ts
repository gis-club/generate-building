import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

const cesiumCommonJsDeps = [
  'autolinker',
  'bitmap-sdf',
  'draco3d/draco_decoder_nodejs.js',
  'earcut',
  'grapheme-splitter',
  'lerc',
  'mersenne-twister',
  'nosleep.js',
  'pako/lib/inflate.js',
  'protobufjs/dist/minimal/protobuf.js',
  'urijs',
]

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites from /<repository>/ instead of the domain root.
  // Keep the local development default at / and let CI provide BASE_PATH.
  base: process.env.BASE_PATH || '',
  plugins: [vue(), cesium()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@zip.js/zip.js/lib/zip-no-worker.js': fileURLToPath(
        new URL('./node_modules/@zip.js/zip.js/index.js', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    include: cesiumCommonJsDeps,
    needsInterop: cesiumCommonJsDeps,
    exclude: ['cesium', '@cesium/engine', '@cesium/widgets', '@zip.js/zip.js'],
  },
  server: {
    host: '127.0.0.1',
    port: 5006,
    strictPort: true,
    proxy: {
      '/sam-api': {
        target: 'https://model-zoo.metademolab.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sam-api/, '/predictions'),
      },
    },
  },
})
