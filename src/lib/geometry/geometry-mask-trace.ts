/**
 * SAM 掩码追踪工具：负责 RLE 解码、SVG 轮廓提取与坐标转换。
 */

export class MaskTraceRecovered {
  getLineBreakpoints(encoded, width) {
    const breakpoints = []
    const current = { line: -1, points: [] }
    let cursor = 0

    const flush = () => {
      if (current.points.length > 0) {
        breakpoints.push({ line: current.line, points: current.points })
        current.points = []
      }
    }

    for (let index = 1; index < encoded.length; index += 2) {
      cursor += encoded[index - 1]
      const startX = cursor % width
      const startLine = Math.floor(cursor / width)
      cursor += encoded[index]
      const endX = cursor % width
      const endLine = Math.floor(cursor / width)

      if (current.line !== startLine) {
        flush()
        current.line = startLine
      }

      if (startLine === endLine) {
        current.points.push(startX, endX)
        continue
      }

      current.points.push(startX, width)
      flush()
      current.line = endLine

      for (let line = startLine + 1; line < endLine; line += 1) {
        breakpoints.push({ line, points: [0, width] })
      }

      if (endX > 0) {
        current.points.push(0, endX)
      }
    }

    flush()
    return breakpoints
  }

  traceCompressedRLeStringToSVG(encodedString, width) {
    const rle = this.rleFrString(encodedString)
    return this.filterSmallSVGRegions(this.traceRleToSVG(rle, width))
  }

  rleFrString(value) {
    const output = []
    let index = 0
    while (index < value.length) {
      let result = 0
      let shift = 0
      let hasNext = 1
      while (hasNext) {
        const charCode = value.charCodeAt(index) - 48
        result |= (charCode & 31) << (5 * shift)
        hasNext = charCode & 32
        index += 1
        shift += 1
        if (!hasNext && charCode & 16) {
          result |= -1 << (5 * shift)
        }
      }
      if (output.length > 2) {
        result += output[output.length - 2]
      }
      output.push(result)
    }
    return output
  }

  traceRleToSVG(rle, width) {
    return this.convertSegmentsToSVG(this.generatePolygonSegments(rle, width))
  }

  filterSmallSVGRegions(regions, threshold = 100) {
    const filtered = regions.filter((region) => Math.abs(this.areaOfSVGPolygon(region)) > threshold)
    if (filtered.length > 0) {
      return filtered
    }

    const areas = regions.map((region) => this.areaOfSVGPolygon(region))
    const largestIndex = areas.indexOf(Math.max(...areas))
    return [regions[largestIndex]]
  }

  areaOfSVGPolygon(path) {
    const parts = path.split(' ')
    if (parts.length < 4 || parts.length % 2 !== 0) {
      return 0
    }

    let area = 0
    let prevX = this.svgCoordToInt(parts[parts.length - 2])
    let prevY = this.svgCoordToInt(parts[parts.length - 1])

    for (let index = 0; index < parts.length; index += 2) {
      const x = this.svgCoordToInt(parts[index])
      const y = this.svgCoordToInt(parts[index + 1])
      area += this.areaUnderLine(prevX, prevY, x, y)
      prevX = x
      prevY = y
    }

    return area
  }

  svgCoordToInt(value) {
    return value.charAt(0) === 'L' || value.charAt(0) === 'M'
      ? parseInt(value.slice(1), 10)
      : parseInt(value, 10)
  }

  areaUnderLine(x1, y1, x2, y2) {
    if (x1 === x2) {
      return 0
    }
    const minY = Math.min(y1, y2)
    const rectangle = (x2 - x1) * minY
    const maxY = Math.max(y1, y2)
    const triangle = Math.trunc(((x2 - x1) * (maxY - minY)) / 2)
    return rectangle + triangle
  }

  splitPointKey(value) {
    return value.split(' ').map((item) => parseInt(item, 10))
  }

  generatePolygonSegments(rle, width) {
    const lines = this.getLineBreakpoints(rle, width)
    if (lines.length === 0) {
      return new Map()
    }

    const graph = new Map()
    let previousLine = -1
    let previousPoints = []
    const openSegments = new Map()

    const addEdge = (start, end) => {
      const startKey = `${start.x} ${start.y}`
      const endKey = `${end.x} ${end.y}`
      if (!graph.has(startKey)) {
        graph.set(startKey, new Set())
      }
      graph.get(startKey).add(endKey)
      if (!graph.has(endKey)) {
        graph.set(endKey, new Set())
      }
      graph.get(endKey).add(startKey)
    }

    const closeVertical = (line, x) => {
      if (x !== openSegments.get(line)) {
        addEdge({ x: openSegments.get(line), y: line }, { x, y: line })
        openSegments.delete(line)
      }
    }

    const connect = (x1, y1, x2, y2) => {
      if (y1 === y2) {
        if (!openSegments.has(y1)) {
          openSegments.set(y1, x1)
        }
        return
      }

      let merged = false
      const maxX = Math.max(x1, x2)
      if (openSegments.has(y1)) {
        closeVertical(y1, maxX)
        merged = true
      }
      if (openSegments.has(y2)) {
        closeVertical(y2, maxX)
        merged = true
      }

      if (merged) {
        addEdge({ x: maxX, y: y1 }, { x: maxX, y: y2 })
      } else {
        addEdge({ x: x1, y: y1 }, { x: x2, y: y2 })
      }
    }

    const finalizeLine = (line, points) => {
      for (const point of points) {
        connect(line, point, line + 1, point)
      }
      for (let index = 1; index < points.length; index += 2) {
        connect(line + 1, points[index - 1], line + 1, points[index])
      }
    }

    for (const { line, points } of lines) {
      if (line !== previousLine + 1) {
        finalizeLine(previousLine, previousPoints)
        previousLine = line - 1
        previousPoints = []
      }

      let activeLine = previousPoints.length && previousPoints[0] <= points[0] ? previousLine : line
      let activePoint = activeLine === previousLine ? previousPoints[0] : points[0]
      let prevIndex = activeLine === previousLine ? 1 : 0
      let nextIndex = activeLine === previousLine ? 0 : 1
      let drawing = true

      while (prevIndex < previousPoints.length || nextIndex < points.length) {
        let nextLine
        let nextPoint
        if (prevIndex === previousPoints.length || points[nextIndex] < previousPoints[prevIndex]) {
          nextLine = line
          nextPoint = points[nextIndex]
          nextIndex += 1
        } else {
          nextLine = previousLine
          nextPoint = previousPoints[prevIndex]
          prevIndex += 1
        }

        if (drawing) {
          if (activeLine === previousLine && nextLine === previousLine) {
            connect(previousLine, activePoint, line, activePoint)
            connect(previousLine, nextPoint, line, nextPoint)
            connect(line, activePoint, line, nextPoint)
          } else {
            connect(activeLine, activePoint, nextLine, nextPoint)
          }
        }

        drawing = !drawing
        activeLine = nextLine
        activePoint = nextPoint
      }

      previousLine = line
      previousPoints = points
    }

    finalizeLine(previousLine, previousPoints)

    return new Map(
      [...graph].sort((a, b) => {
        const [ax, ay] = this.splitPointKey(a[0])
        const [bx, by] = this.splitPointKey(b[0])
        return ax === bx ? ay - by : ax - bx
      })
    )
  }

  convertSegmentsToSVG(segments) {
    const polygons = []
    while (segments.size) {
      let [key, neighbors] = segments.entries().next().value
      const startKey = key
      const polygon = [this.splitPointKey(startKey)]
      let nextKey = null

      while (nextKey !== startKey) {
        nextKey = neighbors.values().next().value
        polygon.push(this.splitPointKey(nextKey))
        neighbors.delete(nextKey)
        if (neighbors.size === 0) {
          segments.delete(key)
        }

        const reverseNeighbors = segments.get(nextKey)
        reverseNeighbors.delete(key)
        if (reverseNeighbors.size === 0) {
          segments.delete(nextKey)
          break
        }

        key = nextKey
        neighbors = reverseNeighbors
      }

      polygons.push(polygon)
    }

    const filledPaths = []
    const svgPaths = []
    const context = document.createElement('canvas').getContext('2d')

    for (const polygon of polygons) {
      let reverse = false
      const [x, y] = polygon[0]
      for (const path of filledPaths) {
        if (context && context.isPointInPath(path, x + 0.5, y + 0.5)) {
          reverse = !reverse
        }
      }
      if (reverse) {
        polygon.reverse()
      }

      const body = polygon
        .slice(1)
        .map(([px, py]) => `${px} ${py}`)
        .join(' ')
      const svgPath = `M${polygon[0][0]} ${polygon[0][1]} L${body}`
      svgPaths.push(svgPath)

      const path = new Path2D(svgPath)
      if (context) {
        context.fill(path)
      }
      filledPaths.push(path)
    }

    return svgPaths
  }

  getRandomColor() {
    const red = Math.floor(Math.random() * 256)
    const green = Math.floor(Math.random() * 256)
    const blue = Math.floor(Math.random() * 256)
    return `rgb(${red},${green},${blue})`
  }

  loadingHtml(show) {
    if (show) {
      const wrapper = document.createElement('div')
      wrapper.id = 'loading-sam'
      document.body.appendChild(wrapper)
      wrapper.style = `
        position: absolute;
        top: 0px;
        right: 0px;
        background: rgba(0, 0, 0, 0.6);
        z-index: 2;
        width: 100%;
        height: 100%;
      `

      const text = document.createElement('span')
      wrapper.appendChild(text)
      text.innerHTML = '妯″瀷璇嗗埆涓?..'
      text.style = `
        color: rgb(0, 0, 0);
        font-size: 36px;
        line-height: ${window.innerHeight}px;
        margin-left: 42%;
        background: rgb(255, 255, 255);
        padding: 8px 60px;
        letter-spacing: 2px;
      `
      return
    }

    const loading = document.getElementById('loading-sam')
    if (loading) {
      loading.remove()
    }
  }

  canvasToLonlats(viewer, results) {
    const lonlatGroups = []
    for (let resultIndex = 0; resultIndex < results.length; resultIndex += 1) {
      const svgList = results[resultIndex].svg
      for (let svgIndex = 0; svgIndex < svgList.length; svgIndex += 1) {
        const parts = svgList[svgIndex].split(' ')
        for (let index = 0; index < parts.length; index += 2) {
          if (parts[index].indexOf('M') === -1 && parts[index].indexOf('L') === -1) {
            parts[index] = `L${parts[index]}`
          }
        }

        const commands = this.parsePath(parts.join(' '))
        const points = this.extractPoints(commands)
        const simplified = this.simplify(points, 1)
        const optimized = this.optimizePos(viewer, simplified)
        lonlatGroups.push(optimized.lonlats)
      }
    }
    return lonlatGroups
  }

  updateMyGeometry(lines, polygons) {
    this.myGeometry.groundLine2({
      viewer: { viewer: this.viewer },
      signStr: 'sam',
      translucent: true,
      instancesArr: lines
    })
    this.myGeometry.groundPolygon2({
      viewer: { viewer: this.viewer },
      signStr: 'sam_poly',
      translucent: true,
      instancesArr: polygons
    })
  }

  screenToLonlats(viewer, x, y) {
    const realX = (window.innerWidth / window.realWidth) * x
    const realY = (window.innerHeight / window.realHeight) * y
    const ray = viewer.camera.getPickRay(new Cesium.Cartesian2(realX, realY))
    const picked = viewer.scene.globe.pick(ray, viewer.scene)
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(picked)
    const lon = parseFloat(Cesium.Math.toDegrees(cartographic.longitude).toFixed(6))
    const lat = parseFloat(Cesium.Math.toDegrees(cartographic.latitude).toFixed(6))
    return [lon, lat]
  }

  optimizePos(viewer, points) {
    const lonlats = []
    for (let index = 0; index < points.length; index += 1) {
      lonlats.push(this.screenToLonlats(viewer, points[index][0], points[index][1]))
    }
    return { svg: points, lonlats: JSON.parse(JSON.stringify(lonlats)) }
  }

  parsePath(path) {
    const commands = []
    const matcher = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g
    let match
    while ((match = matcher.exec(path))) {
      commands.push({
        command: match[1],
        params: match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number)
      })
    }
    return commands
  }

  extractPoints(commands) {
    const points = []
    commands.forEach((command) => {
      if (command.command === 'M' || command.command === 'L') {
        points.push([command.params[0], command.params[1]])
      }
    })
    return points
  }

  simplify(points, tolerance) {
    if (points.length < 3) {
      return points
    }

    let maxDistance = 0
    let index = -1
    for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
      const distance = this.perpendicularDistance(
        points[pointIndex],
        points[0],
        points[points.length - 1]
      )
      if (distance > maxDistance) {
        maxDistance = distance
        index = pointIndex
      }
    }

    if (maxDistance > tolerance) {
      const left = this.simplify(points.slice(0, index + 1), tolerance)
      const right = this.simplify(points.slice(index), tolerance)
      return left.slice(0, -1).concat(right)
    }

    return [points[0], points[points.length - 1]]
  }

  perpendicularDistance(point, start, end) {
    if (start[0] === end[0] && start[1] === end[1]) {
      return Math.sqrt((point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2)
    }

    const numerator = Math.abs(
      (end[1] - start[1]) * point[0] -
        (end[0] - start[0]) * point[1] +
        end[0] * start[1] -
        end[1] * start[0]
    )
    const denominator = Math.sqrt((end[1] - start[1]) ** 2 + (end[0] - start[0]) ** 2)
    return numerator / denominator
  }

  removeEmptyArrays(arrays) {
    return arrays.filter((item) => Array.isArray(item) && item.length > 0)
  }

  unique2DArray(arrays) {
    const set = new Set()
    for (const item of arrays) {
      set.add(JSON.stringify(item))
    }
    const output = []
    for (const item of set) {
      output.push(JSON.parse(item))
    }
    return output
  }
}

export default MaskTraceRecovered


