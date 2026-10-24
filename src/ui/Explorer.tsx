import { useEffect, useRef } from 'react'
import type { FsNode, NodeId } from '../model/types'
import { DEMO_HOME_ID, fs, ROOT_ID, useStore } from '../state/store'
import { NodeIcon } from './Icon'
import { formatDate, formatSize } from './kinds'
import { Inspector } from './Details'

export function Explorer() {
  return (
    <aside className="explorer" aria-label="Explorer">
      <FolderTree />
      <div className="section-title" style={{ paddingTop: 10 }}>
        <span>Contents</span>
      </div>
      <FileList />
      <Inspector />
    </aside>
  )
}

// ---------- Folder tree ----------

const QUICK = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Projects']

function FolderTree() {
  const ref = useRef<HTMLDivElement>(null)
  const folderId = useStore((s) => s.explorer.location)
  const oneDrive = fs.children(DEMO_HOME_ID).find((n) => n.type === 'folder' && n.name.startsWith('OneDrive'))
  const quick = QUICK.map((q) => fs.children(DEMO_HOME_ID).find((n) => n.name === q)).filter((n): n is FsNode => !!n)

  // Keep the current folder scrolled into view.
  useEffect(() => {
    ref.current?.querySelector('.tree-row.current')?.scrollIntoView({ block: 'nearest' })
  }, [folderId])

  return (
    <div className="tree" ref={ref} role="tree" aria-label="Folders">
      <div className="section-title" style={{ padding: '8px 6px 2px' }}>Folders</div>
      <div className="tree-group">Quick access</div>
      {oneDrive && <QuickRow node={oneDrive} />}
      {quick.map((n) => <QuickRow key={n.id} node={n} />)}
      <div className="tree-group">This PC</div>
      <TreeNode id={ROOT_ID} depth={0} />
    </div>
  )
}

function QuickRow({ node }: { node: FsNode }) {
  const current = useStore((s) => s.explorer.location === node.id)
  return (
    <div className={'tree-row' + (current ? ' current' : '')} style={{ paddingLeft: 22 }} onClick={() => useStore.getState().explorerOpen(node.id)} title={fs.path(node.id)}>
      <NodeIcon node={node} size={16} />
      <span className="label">{node.name}</span>
    </div>
  )
}

function TreeNode({ id, depth }: { id: NodeId; depth: number }) {
  const node = fs.get(id)!
  const open = useStore((s) => s.explorer.expanded.includes(id))
  const current = useStore((s) => s.explorer.location === id)
  const subfolders = fs.children(id).filter((n) => n.type === 'folder')
  const { toggleExpanded, explorerOpen } = useStore.getState()

  return (
    <>
      <div
        className={'tree-row' + (current ? ' current' : '')}
        style={{ paddingLeft: 4 + depth * 14 }}
        role="treeitem"
        aria-expanded={subfolders.length ? open : undefined}
        aria-selected={current}
        onClick={() => explorerOpen(id)}
        title={fs.path(id)}
      >
        <button
          className={'twisty' + (open ? ' open' : '')}
          aria-label={open ? 'Collapse' : 'Expand'}
          tabIndex={-1}
          style={{ visibility: subfolders.length ? 'visible' : 'hidden' }}
          onClick={(e) => { e.stopPropagation(); toggleExpanded(id) }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M3 1.5L7 5l-4 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <NodeIcon node={node} size={16} open={current} />
        <span className="label">{depth === 0 ? 'Local Disk (C:)' : node.name}</span>
      </div>
      {open && subfolders.map((c) => <TreeNode key={c.id} id={c.id} depth={depth + 1} />)}
    </>
  )
}

// ---------- File list ----------

function FileList() {
  const folderId = useStore((s) => s.explorer.location)
  const selectedId = useStore((s) => s.explorer.selectedId)
  const { explorerSelect, explorerOpen, up, openPreview } = useStore.getState()
  const items = fs.children(folderId)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.querySelector('.list-row.selected')?.scrollIntoView({ block: 'nearest' })
  }, [selectedId, folderId])

  const activate = (n: FsNode) => (n.type === 'folder' ? explorerOpen(n.id) : openPreview(n.id))

  const onKey = (e: React.KeyboardEvent) => {
    const i = items.findIndex((n) => n.id === selectedId)
    if (e.key === 'ArrowDown') { e.preventDefault(); const n = items[Math.min(i + 1, items.length - 1)]; if (n) explorerSelect(n.id) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const n = items[Math.max(i - 1, 0)]; if (n) explorerSelect(n.id) }
    else if (e.key === 'Enter' && i >= 0) activate(items[i])
    else if (e.key === 'Backspace') up('explorer')
  }

  return (
    <div className="listpane">
      <div className="list-head" aria-hidden><span>Name</span><span>Date modified</span><span>Size</span></div>
      <div className="list" ref={listRef} tabIndex={0} role="listbox" aria-label="Folder contents" onKeyDown={onKey}>
        {items.length === 0 && <div className="list-empty">This folder is empty.</div>}
        {items.map((n) => (
          <div
            key={n.id}
            role="option"
            aria-selected={n.id === selectedId}
            className={'list-row' + (n.id === selectedId ? ' selected' : '')}
            onClick={() => explorerSelect(n.id)}
            onDoubleClick={() => activate(n)}
            title={n.name}
          >
            <span className="name"><NodeIcon node={n} size={17} /><span>{n.name}</span></span>
            <span className="date">{formatDate(n.modified).replace(/, \d+:\d+ [AP]M$/, '')}</span>
            <span className="size">{n.type === 'file' ? formatSize(n.sizeBytes) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
