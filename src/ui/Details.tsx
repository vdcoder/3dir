import type { FileNode, FsNode } from '../model/types'
import { fs, useStore } from '../state/store'
import { NodeIcon } from './Icon'
import { formatDate, formatSize, typeLabel } from './kinds'

/** Floating card describing the current selection, with explicit cross-view commands. */
export function DetailsCard() {
  const id = useStore((s) => s.detailsId)
  const node = id ? fs.get(id) : undefined
  if (!node) return null
  return <DetailsBody node={node} />
}

function DetailsBody({ node }: { node: FsNode }) {
  const { showInWorld, showInExplorer, openPreview, closeDetails, explorerOpen, worldEnter } = useStore.getState()
  const parent = node.parentId ? fs.get(node.parentId) : undefined
  const children = node.type === 'folder' ? fs.children(node.id) : []
  const folders = children.filter((c) => c.type === 'folder').length

  return (
    <section className="details" aria-label="Details" data-testid="details">
      <div className="details-head">
        <NodeIcon node={node} size={34} />
        <div>
          <h2>{node.name}</h2>
          <div className="sub">{typeLabel(node)}</div>
        </div>
        <button className="iconbtn close" aria-label="Close details" onClick={closeDetails}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>

      <dl className="meta">
        {node.type === 'file' && (<><dt>Size</dt><dd>{formatSize(node.sizeBytes)}</dd></>)}
        {node.type === 'folder' && (<><dt>Contains</dt><dd>{folders} folders, {children.length - folders} files</dd></>)}
        <dt>Modified</dt><dd>{formatDate(node.modified)}</dd>
        <dt>Created</dt><dd>{formatDate(node.created)}</dd>
        {parent && (<><dt>In folder</dt><dd>{parent.name}</dd></>)}
      </dl>
      <div className="pathbox" title="Canonical path">{fs.path(node.id)}</div>

      <div className="actions">
        <button className="btn" onClick={() => showInWorld(node.id)}>Show in World</button>
        <button className="btn" onClick={() => showInExplorer(node.id)}>Show in Explorer</button>
        {node.type === 'file'
          ? <button className="btn primary" onClick={() => openPreview(node.id)}>Open</button>
          : <button className="btn primary" onClick={() => { explorerOpen(node.id); worldEnter(node.id) }}>Open folder</button>}
      </div>

      {node.type === 'file' && node.preview && (
        <>
          <div className="preview-label">Preview</div>
          <Preview file={node} compact />
        </>
      )}
    </section>
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
    const bg = p.src ? `url(${p.src})` : `linear-gradient(160deg, ${a}, ${b} 55%, ${c})`
    return (
      <div className="preview">
        <div className="photo" style={{ backgroundImage: bg }}>{p.src ? '' : p.description}</div>
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
  if (!node || node.type !== 'file') return null
  const close = () => useStore.getState().openPreview(null)
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
