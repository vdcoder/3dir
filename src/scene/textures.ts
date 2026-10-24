import * as THREE from 'three'

// Small procedural textures (drawn once on a canvas) that add material
// richness without downloads. Sampled in world space so tiles keep their size.

function canvas(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  draw(g, size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)
}

const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex)
  c.offsetHSL(0, 0, k)
  return '#' + c.getHexString()
}

/** Wooden planks: rows of boards with staggered joints and slight tone variation. */
export function planks(base: string, seed = 1, boards = 8): THREE.CanvasTexture {
  return canvas(512, (g, s) => {
    const r = rng(seed)
    const h = s / boards
    for (let i = 0; i < boards; i++) {
      let x = -r() * s * 0.5
      while (x < s) {
        const w = s * (0.35 + r() * 0.4)
        g.fillStyle = shade(base, (r() - 0.5) * 0.06)
        g.fillRect(x, i * h, w, h)
        g.fillStyle = 'rgba(60,40,20,0.18)'
        g.fillRect(x, i * h, 1.5, h)
        x += w
      }
      g.fillStyle = 'rgba(60,40,20,0.22)'
      g.fillRect(0, i * h, s, 1.5)
    }
    // Fine grain.
    for (let k = 0; k < 2200; k++) {
      g.fillStyle = `rgba(80,55,30,${0.03 + r() * 0.04})`
      g.fillRect(r() * s, r() * s, 6 + r() * 30, 0.8)
    }
  })
}

/** Square stone paving with soft joints. */
export function paving(base: string, seed = 2, tiles = 6): THREE.CanvasTexture {
  return canvas(512, (g, s) => {
    const r = rng(seed)
    const t = s / tiles
    g.fillStyle = shade(base, -0.06)
    g.fillRect(0, 0, s, s)
    for (let i = 0; i < tiles; i++) {
      for (let j = 0; j < tiles; j++) {
        g.fillStyle = shade(base, (r() - 0.5) * 0.05)
        g.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3)
      }
    }
    for (let k = 0; k < 1500; k++) {
      g.fillStyle = `rgba(90,80,60,${r() * 0.05})`
      g.fillRect(r() * s, r() * s, 2, 2)
    }
  })
}

/** Soft mottled grass. */
export function grass(base: string, seed = 3): THREE.CanvasTexture {
  return canvas(512, (g, s) => {
    const r = rng(seed)
    g.fillStyle = base
    g.fillRect(0, 0, s, s)
    for (let k = 0; k < 900; k++) {
      const x = r() * s
      const y = r() * s
      const rad = 6 + r() * 26
      const grd = g.createRadialGradient(x, y, 0, x, y, rad)
      const c = shade(base, (r() - 0.5) * 0.08)
      grd.addColorStop(0, c)
      grd.addColorStop(1, c + '00')
      g.fillStyle = grd
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
  })
}

/** Polished terrazzo / concrete speckle. */
export function terrazzo(base: string, seed = 4): THREE.CanvasTexture {
  return canvas(512, (g, s) => {
    const r = rng(seed)
    g.fillStyle = base
    g.fillRect(0, 0, s, s)
    for (let k = 0; k < 2600; k++) {
      g.fillStyle = shade(base, (r() - 0.5) * 0.18)
      const d = 1 + r() * 3
      g.beginPath()
      g.arc(r() * s, r() * s, d, 0, Math.PI * 2)
      g.fill()
    }
  })
}

/**
 * A standard material whose map is sampled from world X/Z (works for
 * instanced meshes), so floors and grounds tile seamlessly at a fixed scale.
 */
export function worldMapMaterial(map: THREE.Texture, metersPerTile: number, params: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ map, roughness: 0.85, ...params })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWorldTile = { value: 1 / metersPerTile }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWorldTile;')
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        {
          vec4 wp = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #endif
          wp = modelMatrix * wp;
          vMapUv = wp.xz * uWorldTile;
        }`,
      )
  }
  m.customProgramCacheKey = () => 'worldmap'
  return m
}

/** A sign face: text on a colored plate, as a texture. */
export function signTexture(title: string, sub: string | undefined, bg: string, fg = '#fdfaf3'): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = bg
  g.fillRect(0, 0, c.width, c.height)
  g.strokeStyle = 'rgba(255,255,255,0.35)'
  g.lineWidth = 6
  g.strokeRect(14, 14, c.width - 28, c.height - 28)
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let size = 112
  g.font = `650 ${size}px "Inter Variable", "Segoe UI", sans-serif`
  while (g.measureText(title).width > c.width - 90 && size > 40) {
    size -= 4
    g.font = `650 ${size}px "Inter Variable", "Segoe UI", sans-serif`
  }
  g.fillText(title, c.width / 2, sub ? 108 : c.height / 2 + 4)
  if (sub) {
    g.globalAlpha = 0.8
    g.font = `500 44px "Inter Variable", "Segoe UI", sans-serif`
    g.fillText(sub, c.width / 2, 196)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
