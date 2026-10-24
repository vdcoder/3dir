// Faces for files in the world, drawn once into texture atlases: binder spine
// labels and page thumbnails carry the file type's icon and short code, the
// same conventions as the explorer, so a file reads as a spreadsheet or a PDF
// without a color legend. Folder boxes get a folder label.

import * as THREE from 'three'
import type { FileKind } from '../model/types'
import { FILE_FOLD, FILE_KINDS, FILE_SHAPE, FOLDER_BACK, FOLDER_FRONT, GLYPHS, SHORT } from '../ui/glyphs'
import { KIND_STYLE } from '../ui/kinds'

export const kindCell = (k: FileKind) => Math.max(0, FILE_KINDS.indexOf(k))
export const CELLS = FILE_KINDS.length

const FONT = 'Inter Variable, Inter, system-ui, sans-serif'

function drawIcon(g: CanvasRenderingContext2D, kind: FileKind, x: number, y: number, size: number) {
  g.save()
  g.translate(x, y)
  g.scale(size / 20, size / 20)
  g.fillStyle = KIND_STYLE[kind].color
  g.fill(new Path2D(FILE_SHAPE))
  g.globalAlpha = 0.45
  g.fillStyle = '#fff'
  g.fill(new Path2D(FILE_FOLD))
  g.globalAlpha = 1
  const glyph = GLYPHS[kind]
  if (glyph?.text) {
    g.fillStyle = '#fff'
    g.font = `700 5.2px ${FONT}`
    g.textAlign = 'center'
    g.fillText(glyph.text, 10, 14.6)
  } else if (glyph?.d) {
    const p = new Path2D(glyph.d)
    if (glyph.stroke) {
      g.strokeStyle = '#fff'
      g.lineWidth = glyph.stroke
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.stroke(p)
    } else {
      g.fillStyle = '#fff'
      g.fill(p)
    }
  }
  g.restore()
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

/** Binder spine labels: icon on top, the type code running down the spine. Cells 64 x 256. */
function drawSpines(g: CanvasRenderingContext2D) {
  FILE_KINDS.forEach((kind, i) => {
    const x = i * 64
    g.fillStyle = '#f6f3ec'
    roundRect(g, x + 5, 4, 54, 248, 6)
    g.fill()
    drawIcon(g, kind, x + 8, 10, 48)
    g.save()
    g.translate(x + 32, 160)
    g.rotate(-Math.PI / 2)
    g.fillStyle = KIND_STYLE[kind].color
    g.font = `800 30px ${FONT}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(SHORT[kind], 0, 1)
    g.restore()
  })
}

/** Page thumbnails seen from above: a header band with the type, and a hint of the content. Cells 128 x 168. */
function drawPages(g: CanvasRenderingContext2D) {
  FILE_KINDS.forEach((kind, i) => {
    const x = i * 128
    const c = KIND_STYLE[kind].color
    g.fillStyle = '#fbfaf6'
    g.fillRect(x + 2, 2, 124, 164)
    g.fillStyle = c
    g.fillRect(x + 2, 2, 124, 30)
    g.fillStyle = '#fff'
    g.font = `800 19px ${FONT}`
    g.textBaseline = 'middle'
    g.fillText(SHORT[kind], x + 12, 18)
    const ink = 'rgba(60,64,72,0.55)'
    const lines = (n: number, indent = (_: number) => 0, w = (k: number) => 96 - (k % 3) * 14) => {
      g.fillStyle = ink
      for (let k = 0; k < n; k++) g.fillRect(x + 14 + indent(k), 46 + k * 14, w(k), 5)
    }
    g.strokeStyle = c
    g.lineWidth = 2
    switch (kind) {
      case 'spreadsheet': {
        g.fillStyle = 'rgba(46,139,87,0.16)'
        g.fillRect(x + 12, 42, 104, 16)
        g.strokeStyle = 'rgba(46,139,87,0.55)'
        g.lineWidth = 1.5
        for (let r = 0; r <= 7; r++) { g.beginPath(); g.moveTo(x + 12, 42 + r * 16); g.lineTo(x + 116, 42 + r * 16); g.stroke() }
        for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(x + 12 + k * 26, 42); g.lineTo(x + 12 + k * 26, 154); g.stroke() }
        break
      }
      case 'presentation': {
        g.strokeRect(x + 14, 46, 100, 70)
        g.fillStyle = c
        g.fillRect(x + 24, 92, 14, 18)
        g.fillRect(x + 46, 76, 14, 34)
        g.fillRect(x + 68, 84, 14, 26)
        lines(2, () => 0, (k) => 80 - k * 24)
        break
      }
      case 'image': {
        g.fillStyle = '#cfe0ef'
        g.fillRect(x + 12, 44, 104, 100)
        g.fillStyle = '#e7b74f'
        g.beginPath(); g.arc(x + 88, 66, 9, 0, Math.PI * 2); g.fill()
        g.fillStyle = '#6f8f5a'
        g.beginPath(); g.moveTo(x + 12, 144); g.lineTo(x + 50, 92); g.lineTo(x + 76, 122); g.lineTo(x + 92, 104); g.lineTo(x + 116, 144); g.fill()
        break
      }
      case 'code': {
        g.fillStyle = '#23303b'
        g.fillRect(x + 8, 38, 112, 120)
        const cols = ['#7fd1c8', '#e6c07b', '#c3a6ff', '#9ad18b']
        for (let k = 0; k < 8; k++) { g.fillStyle = cols[k % 4]; g.fillRect(x + 16 + [0, 10, 20, 20, 10, 0, 10, 20][k], 48 + k * 13, 40 + (k * 17) % 50, 5) }
        break
      }
      case 'design': {
        g.lineWidth = 3
        g.beginPath(); g.arc(x + 44, 80, 20, 0, Math.PI * 2); g.stroke()
        g.beginPath(); g.moveTo(x + 84, 60); g.lineTo(x + 108, 104); g.lineTo(x + 60, 104); g.closePath(); g.stroke()
        g.strokeRect(x + 24, 116, 80, 28)
        break
      }
      case 'archive': {
        g.fillStyle = 'rgba(139,106,69,0.18)'
        g.fillRect(x + 12, 42, 104, 112)
        g.fillStyle = c
        for (let k = 0; k < 7; k++) g.fillRect(x + 58 + (k % 2) * 6, 44 + k * 12, 6, 7)
        g.strokeRect(x + 55, 128, 18, 20)
        break
      }
      case 'executable':
      case 'system': {
        g.strokeRect(x + 14, 46, 100, 76)
        g.fillStyle = c
        g.fillRect(x + 14, 46, 100, 12)
        lines(2, () => 6, (k) => 60 - k * 20)
        break
      }
      case 'pdf':
        lines(8, () => 0, (k) => (k === 0 ? 64 : 96 - (k % 3) * 14))
        g.fillStyle = 'rgba(192,57,43,0.18)'
        g.fillRect(x + 14, 150, 60, 8)
        break
      default:
        lines(8)
    }
  })
}

/** Label on the front of a closed folder box. */
function drawBoxLabel(g: CanvasRenderingContext2D) {
  g.fillStyle = '#f3efe6'
  g.fillRect(0, 0, 256, 128)
  g.strokeStyle = 'rgba(120,90,50,0.35)'
  g.lineWidth = 4
  g.strokeRect(6, 6, 244, 116)
  g.save()
  g.translate(16, 18)
  g.scale(4.6, 4.6)
  g.fillStyle = KIND_STYLE.folder.color
  g.fill(new Path2D(FOLDER_BACK))
  g.fillStyle = '#F2C766'
  g.fill(new Path2D(FOLDER_FRONT))
  g.restore()
  g.fillStyle = 'rgba(70,60,45,0.55)'
  g.fillRect(124, 42, 104, 10)
  g.fillRect(124, 66, 80, 10)
  g.fillRect(124, 90, 92, 10)
}

function atlas(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d')!
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const paint = () => { g.clearRect(0, 0, w, h); draw(g); tex.needsUpdate = true }
  paint()
  // Repaint with the real font once it has loaded.
  void document.fonts?.ready.then(() => { paint(); onRepaint() })
  return tex
}

let onRepaint = () => {}
/** Called after atlases repaint with the web font (to draw a new frame). */
export function setRepaintHook(fn: () => void) { onRepaint = fn }

let cache: { spines: THREE.CanvasTexture; pages: THREE.CanvasTexture; box: THREE.CanvasTexture } | null = null
export function fileFaces() {
  return (cache ??= {
    spines: atlas(64 * CELLS, 256, drawSpines),
    pages: atlas(128 * CELLS, 168, drawPages),
    box: atlas(256, 128, drawBoxLabel),
  })
}

/**
 * A standard material that reads one atlas cell per instance: the instanced
 * geometry carries `decalCell` (cell index); cells run left to right.
 */
export function atlasMaterial(map: THREE.Texture, cells: number, opts: THREE.MeshStandardMaterialParameters = {}) {
  const m = new THREE.MeshStandardMaterial({ map, roughness: 0.85, ...opts })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.decalCells = { value: cells }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float decalCell;\nuniform float decalCells;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vec2((vMapUv.x + decalCell) / decalCells, vMapUv.y);\n#endif')
  }
  m.customProgramCacheKey = () => `atlas-${cells}`
  return m
}
