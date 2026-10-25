// Standalone, labelled SVG drawings of placed layouts (top-down, north up).

import { area, fmt } from './geometry.ts'
import type { Rect } from './geometry.ts'
import type { Placed, Region } from './protocol.ts'
import { hash } from './rng.ts'

export interface Panel {
  title: string
  subtitle?: string
  root: Placed
  /** Region of the world to show (meters); defaults to the root's rectangle. */
  focus?: Rect
  /** Fixed scale in px per meter (to compare panels at the same scale). */
  scale?: number
  /** Dashed outlines (e.g. the part shown in the next zoom panel). */
  highlight?: { rect: Rect; label: string }[]
  /** Lines of text under the drawing (ledgers, metrics). */
  notes?: string[]
  /** Extra drawing in panel coordinates. */
  annotate?: (t: Transform) => string
  /** Draw children only this many levels below the root (default: all). */
  depth?: number
}

export interface Transform { X: (x: number) => number; Y: (y: number) => number; S: number }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const KIND: Record<string, { fill: string; stroke: string }> = {
  area: { fill: '#eef3e2', stroke: '#5f8547' },
  campus: { fill: '#e4f0ee', stroke: '#2f7f74' },
  building: { fill: '#f4efe7', stroke: '#8a6d4b' },
  room: { fill: '#ffffff', stroke: '#8f8578' },
  shelf: { fill: '#fbf7f0', stroke: '#b38b62' },
  book: { fill: 'none', stroke: 'none' },
  table: { fill: 'none', stroke: 'none' },
}

const ROLE: Record<string, string> = {
  boundary: '#dbe7cb', separator: '#d6d6d1', street: '#d4d4cf', path: '#eadfc7', courtyard: '#f5e3a8', plaza: '#f3dcae',
  wall: '#e4ded5', corridor: '#d6e6f5', entrance: '#fbe0cc', aisle: '#ebf3fa', spacing: '#f2eee7', clearance: '#f4f4ee',
  breathing: '#fff0c9', display: '#fde2bf', structure: '#7a5634', padding: '#eeeeea', open: '#f6f6f2',
}
const FAMILY: Record<string, string> = { highway: '#c4c4bf', street: '#d6d6d1', path: '#ece0c6', hedge: '#c9e0b8' }

const BOOK = ['#2e8b57', '#3e6db5', '#c0392b', '#d9732b', '#8559c4', '#23898c', '#8b6a45', '#667085']

function textW(s: string, size: number) { return s.length * size * 0.56 }

function label(x: number, y: number, s: string, size: number, opts: { weight?: number; fill?: string; anchor?: string; italic?: boolean } = {}) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" font-weight="${opts.weight ?? 400}" fill="${opts.fill ?? '#333'}"${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''}${opts.italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`
}

function regionLabel(g: Region): string {
  const t = g.axis === 'x' ? g.rect.w : g.axis === 'y' ? g.rect.d : Math.min(g.rect.w, g.rect.d)
  return `${g.label} ${fmt(t)} m`
}

function drawNode(n: Placed, t: Transform, depth: number, maxDepth: number, out: string[]) {
  const r = n.rect
  const px = { x: t.X(r.x), y: t.Y(r.y), w: r.w * t.S, h: r.d * t.S }
  if (px.w < 0.4 || px.h < 0.4) return
  const k = KIND[n.kind] ?? KIND.room
  const rr = (q: Rect, fill: string, stroke = 'none', sw = 0, extra = '') => `<rect x="${t.X(q.x).toFixed(2)}" y="${t.Y(q.y).toFixed(2)}" width="${Math.max(0, q.w * t.S).toFixed(2)}" height="${Math.max(0, q.d * t.S).toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`
  if (k.fill !== 'none') out.push(rr(r, k.fill))
  if (n.kind === 'shelf' && n.meta?.body) out.push(rr(n.meta.body as Rect, '#e9d8c0', '#7a5634', 0.8))
  // The container's own space.
  for (const g of n.regions) {
    const fill = g.family ? FAMILY[g.family] ?? ROLE.separator : ROLE[g.role] ?? ROLE.open
    out.push(rr(g.rect, fill, fill, 0.6))
  }
  for (const o of n.objects) {
    const fill = o.kind === 'book' ? BOOK[hash(o.label ?? '') % BOOK.length] : o.kind === 'table' ? '#d9b98a' : o.kind === 'file' ? '#ffffff' : o.kind === 'desk' ? '#a3acb6' : o.kind === 'sign' ? '#2f4a3a' : o.kind === 'door' || o.kind === 'gate' ? '#c25b2a' : '#999'
    out.push(rr(o.rect, fill, o.kind === 'file' ? '#9a8a70' : o.kind === 'table' ? '#8a6a40' : 'none', o.kind === 'file' || o.kind === 'table' ? 0.6 : 0))
    const ow = o.rect.w * t.S, oh = o.rect.d * t.S
    if ((o.kind === 'desk' || o.kind === 'sign') && o.label && ow > textW(o.label, 9) + 4 && oh > 11) {
      out.push(label(t.X(o.rect.x) + ow / 2, t.Y(o.rect.y) + oh / 2 + 3, o.label, 9, { anchor: 'middle', fill: o.kind === 'sign' ? '#fff' : '#333' }))
    }
  }
  if (depth < maxDepth) for (const c of n.children) drawNode(c, t, depth + 1, maxDepth, out)
  // Region labels (after children so they stay readable). Separator families are named once, on their largest piece.
  const fam = n.regions.filter((g) => g.family).sort((a, b) => area(b.rect) - area(a.rect))[0]
  for (const g of n.regions) {
    if (g.role === 'structure' || g.role === 'spacing') continue
    if (g.family && g !== fam) continue
    const w = g.rect.w * t.S, h = g.rect.d * t.S
    const s = g.family ? `${g.family} (≥ ${fmt(Number(n.meta?.P ?? 0))} m between children)` : regionLabel(g)
    const size = 9
    // Front bands carry the container's name on the left; their own label goes to the right.
    const front = g.role === 'entrance' || g.role === 'plaza'
    if (w > textW(s, size) + 6 && h > size + 4) {
      const x = front ? t.X(g.rect.x) + w - 6 : t.X(g.rect.x) + w / 2
      out.push(label(x, t.Y(g.rect.y) + h / 2 + size / 3, s, size, { anchor: front ? 'end' : 'middle', fill: '#6d675e', italic: true }))
    } else if (h > textW(s, size) + 6 && w > size + 4) out.push(`<text transform="translate(${(t.X(g.rect.x) + w / 2 + size / 3).toFixed(1)},${(t.Y(g.rect.y) + h / 2).toFixed(1)}) rotate(-90)" font-size="${size}" fill="#6d675e" font-style="italic" text-anchor="middle">${esc(s)}</text>`)
  }
  if (k.stroke !== 'none') out.push(rr(r, 'none', k.stroke, n.kind === 'area' ? 1.6 : n.kind === 'campus' ? 1.4 : 1))
  // Name and size.
  const name = n.kind === 'shelf' ? `${n.name} (shelf)` : n.name
  const size = `${fmt(r.w)} × ${fmt(r.d)} m` + (Math.abs(r.w - n.min.w) > 0.01 || Math.abs(r.d - n.min.d) > 0.01 ? ` (min ${fmt(n.min.w)} × ${fmt(n.min.d)})` : '')
  const fs = n.kind === 'area' ? 13 : n.kind === 'campus' ? 12 : 11
  const named = depth > 0 && n.kind !== 'book' && n.kind !== 'table' && n.kind !== 'shelf'
  if (named && px.w > Math.min(textW(name, fs), 60) + 6 && px.h > fs + 4) {
    const room = px.w - 8
    const two = px.h > 2 * fs + 14 && px.w > textW(size, 9) + 8
    const base = px.y + px.h - (two ? 14 : 4)
    out.push(label(px.x + 4, base, textW(name, fs) > room ? name.slice(0, Math.max(3, Math.floor(room / (fs * 0.56))) - 1) + '…' : name, fs, { weight: 650, fill: k.stroke }))
    if (two) out.push(label(px.x + 4, px.y + px.h - 4, size, 9, { fill: '#555' }))
  }
}

function dims(r: Rect, t: Transform): string {
  const x0 = t.X(r.x), x1 = t.X(r.x + r.w), y0 = t.Y(r.y), y1 = t.Y(r.y + r.d)
  const c = '#555'
  return [
    `<path d="M${x0},${y0 - 8} H${x1} M${x0},${y0 - 12} v8 M${x1},${y0 - 12} v8" stroke="${c}" stroke-width="0.8" fill="none"/>`,
    label((x0 + x1) / 2, y0 - 11, `${fmt(r.w)} m`, 10, { anchor: 'middle', fill: c }),
    `<path d="M${x0 - 8},${y0} V${y1} M${x0 - 12},${y0} h8 M${x0 - 12},${y1} h8" stroke="${c}" stroke-width="0.8" fill="none"/>`,
    `<text transform="translate(${x0 - 11},${(y0 + y1) / 2}) rotate(-90)" font-size="10" fill="${c}" text-anchor="middle">${fmt(r.d)} m</text>`,
  ].join('')
}

function scaleBar(x: number, y: number, S: number): string {
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]
  const m = steps.find((s) => s * S >= 50) ?? 500
  const w = m * S
  return `<g><rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="4" fill="#333"/>${label(x + w + 5, y + 5, `${fmt(m)} m`, 9, { fill: '#333' })}</g>`
}

export function renderPanels(panels: Panel[], opts: { title: string; intro?: string[]; columns?: number; panelW?: number; panelH?: number }): string {
  const cols = opts.columns ?? Math.min(3, panels.length)
  const PW = opts.panelW ?? 520
  const PH = opts.panelH ?? 460
  const notesH = Math.max(0, ...panels.map((p) => (p.notes?.length ?? 0))) * 13
  const head = 34 + (opts.intro?.length ?? 0) * 15
  const rows = Math.ceil(panels.length / cols)
  const W = cols * PW + (cols + 1) * 16
  const H = head + rows * (PH + notesH + 16) + 16
  const out: string[] = []
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, 'Segoe UI', Helvetica, Arial, sans-serif">`)
  out.push(`<rect width="${W}" height="${H}" fill="#fafaf7"/>`)
  out.push(label(16, 24, opts.title, 17, { weight: 700, fill: '#222' }))
  ;(opts.intro ?? []).forEach((l, i) => out.push(label(16, 44 + i * 15, l, 11.5, { fill: '#555' })))
  panels.forEach((p, i) => {
    const cx = 16 + (i % cols) * (PW + 16)
    const cy = head + Math.floor(i / cols) * (PH + notesH + 16)
    const focus = p.focus ?? p.root.rect
    const top = 40
    const pad = 26
    const S = p.scale ?? Math.min((PW - 2 * pad) / focus.w, (PH - top - pad - 10) / focus.d)
    const ox = cx + pad + Math.max(0, (PW - 2 * pad - focus.w * S) / 2)
    const oy = cy + top + 10
    const t: Transform = { X: (x) => ox + (x - focus.x) * S, Y: (y) => oy + (y - focus.y) * S, S }
    out.push(`<rect x="${cx}" y="${cy}" width="${PW}" height="${PH + notesH}" rx="8" fill="#fff" stroke="#e2e0da"/>`)
    out.push(label(cx + 12, cy + 18, p.title, 12.5, { weight: 650, fill: '#222' }))
    if (p.subtitle) out.push(label(cx + 12, cy + 33, p.subtitle, 10, { fill: '#666' }))
    out.push(`<clipPath id="c${i}"><rect x="${cx + 1}" y="${cy + top}" width="${PW - 2}" height="${PH - top - 1}"/></clipPath>`)
    const body: string[] = []
    drawNode(p.root, t, 0, p.depth ?? 99, body)
    for (const h of p.highlight ?? []) {
      body.push(`<rect x="${t.X(h.rect.x)}" y="${t.Y(h.rect.y)}" width="${h.rect.w * S}" height="${h.rect.d * S}" fill="none" stroke="#d6336c" stroke-width="2" stroke-dasharray="6 3"/>`)
      body.push(label(t.X(h.rect.x), t.Y(h.rect.y) - 4, h.label, 10, { weight: 650, fill: '#d6336c' }))
    }
    if (p.annotate) body.push(p.annotate(t))
    if (area(focus) === area(p.root.rect)) body.push(dims(p.root.rect, t))
    out.push(`<g clip-path="url(#c${i})">${body.join('')}</g>`)
    out.push(scaleBar(cx + PW - 110, cy + PH - 14, S))
    ;(p.notes ?? []).forEach((n, j) => out.push(label(cx + 12, cy + PH + 4 + j * 13, n, 10, { fill: '#444' })))
  })
  out.push('</svg>')
  return out.join('\n')
}
