import { useEffect, useState } from 'react'
import type { FileNode, FsNode } from '../model/types'
import { fs, useStore } from '../state/store'
import { NodeIcon } from './Icon'
import { formatDate, formatSize, typeLabel } from './kinds'
import { assetUrl } from '../assetUrl'

const OPEN_KEY = '3dir.inspector.open'
const readOpen = (fallback: boolean) => {
  try { const v = localStorage.getItem(OPEN_KEY); return v === null ? fallback : v === '1' } catch { return fallback }
}

/**
 * Details of the latest selection, docked so it never covers the world: at the
 * bottom of the explorer pane, or as a collapsible sheet when the pane is hidden.
 */
export function Inspector({ variant = 'pane' }: { variant?: 'pane' | 'sheet' }) {
  const id = useStore((s) => s.detailsId)
  const node = id ? fs.get(id) : undefined
  const [open, setOpen] = useState(() => readOpen(variant === 'pane'))
  const toggle = () => {
    setOpen((o) => {
      try { localStorage.setItem(OPEN_KEY, o ? '0' : '1') } catch { /* storage may be unavailable */ }
      return !o
    })
  }
  if (variant === 'sheet' && !node) return null
  return (
    <section className={`inspector inspector-${variant}` + (open ? ' open' : '')} aria-label="Details" data-testid="details">
      <button className="inspector-head" aria-expanded={open} onClick={toggle} title={open ? 'Hide details' : 'Show details'}>
        <svg className="chev" width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M3 1.5L7 5l-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span className="title">Details</span>
        {!open && node && <span className="peek"><NodeIcon node={node} size={14} /> {node.name}</span>}
      </button>
      {open && (node ? <DetailsBody node={node} /> : <div className="inspector-empty">Select a file or folder, here or in the world, to see its details.</div>)}
    </section>
  )
}

function DetailsBody({ node }: { node: FsNode }) {
  const linked = useStore((s) => s.linked)
  const { showInWorld, showInExplorer, goTo, openPreview, explorerOpen, worldEnter } = useStore.getState()
  const parent = node.parentId ? fs.get(node.parentId) : undefined
  const children = node.type === 'folder' ? fs.children(node.id) : []
  const folders = children.filter((c) => c.type === 'folder').length

  return (
    <div className="inspector-body">
      <div className="details-head">
        <NodeIcon node={node} size={30} />
        <div>
          <h2>{node.name}</h2>
          <div className="sub">{typeLabel(node)}</div>
        </div>
      </div>

      <dl className="meta">
        {node.type === 'file' && (<><dt>Size</dt><dd>{formatSize(node.sizeBytes)}</dd></>)}
        {node.type === 'folder' && (<><dt>Contains</dt><dd>{folders} folders, {children.length - folders} files</dd></>)}
        <dt>Modified</dt><dd>{formatDate(node.modified)}</dd>
        {parent && (<><dt>In folder</dt><dd>{parent.name}</dd></>)}
      </dl>
      <div className="pathbox" title="Canonical path">{fs.path(node.id)}</div>

      <div className="actions">
        {node.type === 'file'
          ? <button className="btn primary" onClick={() => openPreview(node.id)}>Open</button>
          : <button className="btn primary" onClick={() => { explorerOpen(node.id); worldEnter(node.id) }}>Open folder</button>}
        {linked
          // Linked: both views share one place, so one command shows it in both.
          ? <button className="btn" onClick={() => goTo(node.id)} title="Go to the folder that holds it, in both views">Show location</button>
          : (<>
              <button className="btn" onClick={() => showInWorld(node.id)}>Show in World</button>
              <button className="btn" onClick={() => showInExplorer(node.id)}>Show in Explorer</button>
            </>)}
      </div>

      {node.type === 'file' && node.preview && (
        <>
          <div className="preview-label">Preview</div>
          <Preview file={node} compact />
        </>
      )}
    </div>
  )
}

export function Preview({ file, compact = false }: { file: FileNode; compact?: boolean }) {
  const p = file.preview
  if (!p) return <div className="preview"><div className="prose" style={{ color: 'var(--text-3)' }}>No preview available for this file.</div></div>
  if (p.format === 'table') {
    return (
      <div className="preview">
        <div className="table-wrap" style={compact ? undefined : { maxHeight: 'none' }}>
          <table>
            <thead><tr>{p.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{p.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    )
  }
  if (p.format === 'image') {
    const [a = '#888', b = '#bbb', c = '#555'] = p.palette ?? []
    const bg = p.src ? `url("${assetUrl(p.src)}")` : `linear-gradient(160deg, ${a}, ${b} 55%, ${c})`
    return (
      <div className="preview">
        <div className="photo" role="img" aria-label={p.description} style={{ backgroundImage: bg }}>{p.src ? '' : p.description}</div>
      </div>
    )
  }
  const code = file.kind === 'code' || file.kind === 'system' || file.kind === 'text'
  return (
    <div className="preview">
      {code ? <pre style={compact ? undefined : { maxHeight: 'none' }}>{p.text}</pre> : <div className="prose" style={compact ? undefined : { maxHeight: 'none' }}>{p.text}</div>}
    </div>
  )
}

/** Larger reading view for "Open". */
export function PreviewModal() {
  const id = useStore((s) => s.previewId)
  const node = id ? fs.get(id) : undefined
  const close = () => useStore.getState().openPreview(null)
  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') useStore.getState().openPreview(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id])
  if (!node || node.type !== 'file') return null
  return (
    <div className="modal-backdrop" onMouseDown={close} role="dialog" aria-modal aria-label={node.name}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="details-head">
          <NodeIcon node={node} size={30} />
          <div>
            <h2>{node.name}</h2>
            <div className="sub">{fs.path(node.id)}</div>
          </div>
          <button className="iconbtn close" aria-label="Close preview" onClick={close} autoFocus>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <Preview file={node} />
        <p className="modal-note">Fictional preview. 3dir never opens or edits real files.</p>
      </div>
    </div>
  )
}
