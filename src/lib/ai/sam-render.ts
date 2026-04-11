/**
 * 负责解析 SAM 返回数据，并生成轮廓与渲染中间结果。
 */

import {
  MaskTraceRecovered,
  GeometryRecovered
} from '../mbs-sdk-exports-core.ts'

export const samRenderMethods = {
  handleAllModelResults(results, imageHeight, context) {
    const tracer = new MaskTraceRecovered()
    const polygons = results.map((item) => {
      const decoded = LZString.decompressFromEncodedURIComponent(item.encodedMask)
      return {
        svg: tracer.traceCompressedRLeStringToSVG(decoded, imageHeight),
        point_coord: item.point_coord
      }
    })

    context.samLonlats = tracer.canvasToLonlats(context.viewer, polygons)
    context.myGeometry = new GeometryRecovered()

    if (context.drawGeoShow) {
      context.updateMyGeometry(0)
    }

    if (context.drawCanvasShow) {
      const oldCanvas = document.getElementById('sam_canvas')
      if (oldCanvas) {
        oldCanvas.remove()
      }

      const canvas = document.createElement('canvas')
      canvas.id = 'sam_canvas'
      canvas.style = 'position: absolute; top: 0; right: 0;'
      canvas.width = window.realWidth
      canvas.height = window.realHeight
      document.body.appendChild(canvas)

      const canvasContext = canvas.getContext('2d')
      canvasContext.lineWidth = 2

      for (let groupIndex = 0; groupIndex < polygons.length; groupIndex += 1) {
        canvasContext.strokeStyle = tracer.getRandomColor()
        const svgList = polygons[groupIndex].svg

        for (let svgIndex = 0; svgIndex < svgList.length; svgIndex += 1) {
          const parts = svgList[svgIndex].split(' ')
          for (let index = 0; index < parts.length; index += 2) {
            if (index === 0) {
              canvasContext.beginPath()
              canvasContext.moveTo(parts[0].split('M')[1], parts[1])
            } else if (index === 2) {
              canvasContext.lineTo(parts[2].split('L')[1], parts[3])
            } else if (index === parts.length - 2) {
              canvasContext.lineTo(parts[index], parts[index + 1])
              canvasContext.stroke()
            } else {
              canvasContext.lineTo(parts[index], parts[index + 1])
            }
          }
        }
      }
    }

    tracer.loadingHtml(false)
  },

  handleImageScale(image) {
    const width = image.naturalWidth
    const height = image.naturalHeight
    let scale
    let uploadScale

    if (height < width) {
      scale = 500 / height
      if (height * scale > 1333) {
        scale = 1333 / height
      }
      uploadScale = 680 / width
    } else {
      scale = 500 / width
      if (width * scale > 1333) {
        scale = 1333 / width
      }
      uploadScale = 680 / height
    }

    return { height, width, scale, uploadScale }
  },

  async getFile(url) {
    const blob = await (await fetch(url)).blob()
    return new File([blob], 'image.jpeg')
  }
}

export default samRenderMethods


