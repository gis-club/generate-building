/**
 * Viewer 中的品牌 Logo 与文字精灵绘制。
 */

const DEFAULT_LOGO_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

import ViewerCore from './viewer-core.ts'

export class ViewerLogo extends ViewerCore {
  addLogo(viewer) {
    const textImage = this.drawLogo()
    const logoImage = DEFAULT_LOGO_DATA_URL
    const quad = new Cesium.ViewportQuad()
    const left = Math.random() * window.innerWidth
    const top = Math.random() * window.innerHeight

    quad.rectangle = new Cesium.BoundingRectangle(left, top, 150, 40)

    const startTime = performance.now()
    quad.material = new Cesium.Material({
      fabric: {
        type: 'DynamicGlowingText',
        uniforms: {
          image: textImage,
          time: (performance.now() - startTime) / 1000,
          scrollSpeed: 0.2,
          glowIntensity: 1,
          logo: logoImage
        }
      }
    })

    quad.material.shaderSource = `
      uniform sampler2D image_0;
      uniform float time_1;
      uniform float scrollSpeed_2;
      uniform float glowIntensity_3;
      uniform sampler2D logo_4;

      czm_material czm_getMaterial(czm_materialInput materialInput) {
        czm_material material = czm_getDefaultMaterial(materialInput);
        vec2 st = materialInput.st;

        float offset = mod(time_1 * scrollSpeed_2, 1.0);
        vec2 scrollSt = vec2(mod(st.x + offset, 1.0), st.y);
        vec4 texColor = texture(image_0, scrollSt);

        vec2 scrollSt1 = vec2(mod(st.x * 4.2 + offset * 4.2, 4.2), st.y * 1.2 - 0.1);
        vec4 logoColor = texture(logo_4, scrollSt1);

        vec3 glowColor = mix(vec3(0.0, 0.8, 0.0), vec3(0.0, 0.0, 0.6), abs(sin(time_1)));
        float dist = 1.0 - texColor.a;
        float glow = glowIntensity_3 * exp(-dist * 10.0);

        material.diffuse = texColor.rgb + 0.3 * glowColor.rgb + logoColor.rgb;
        material.alpha = (texColor.a + logoColor.a) > 1.0 ? 1.0 : (texColor.a + logoColor.a);
        return material;
      }
    `

    viewer.scene.primitives.add(quad)
    viewer.scene.preRender.addEventListener(() => {
      quad.material.uniforms.time += 0.01
    })
  }

  drawLogo() {
    const canvas = document.createElement('canvas')
    canvas.width = 150
    canvas.height = 40

    const context = canvas.getContext('2d')
    context.fillStyle = 'rgba(0, 0, 0, 0.0)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.font = 'italic bold 18px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, '#42d392')
    gradient.addColorStop(1, '#647eff')

    context.fillStyle = gradient
    context.strokeStyle = 'rgba(0, 255, 0, 0.7)'
    context.lineWidth = 80
    context.shadowColor = 'rgba(0, 255, 0, 0.9)'
    context.shadowBlur = 10
    context.fillText('鍥剧晫mbs', canvas.width / 2 + 4, canvas.height / 2 + 1)

    const image = new Image()
    image.src = canvas.toDataURL('image/png')
    return image
  }
}

export default ViewerLogo


