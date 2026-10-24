import { useEffect, useMemo, useRef, useState } from 'react'
import { dataset } from '../data/seed'
import { catalog, fs, useStore } from '../state/store'
import { NodeIcon } from './Icon'
import { search } from './search'

const Chevron = ({ dir }: { dir: 'left' | 'right' | 'up' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path d={dir === 'left' ? 'M10 3L5 8l5 5' : dir === 'right' ? 'M6 3l5 5-5 5' : 'M3 10l5-5 5 5'} stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function TopBar({ onTogglePanel }: { onTogglePanel(): void }) {
  const folderId = useStore((s) => s.explorer.location)
  const canBack = useStore((s) => s.explorer.back.length > 0)
  const canForward = useStore((s) => s.explorer.forward.length > 0)
  const linked = useStore((s) => s.linked)
  const { back, forward, up, explorerOpen, setLinked } = useStore.getState()
  const chain = fs.ancestry(folderId)
  // Linked: one path for both views, with the edges of opened boxes marked.
  const boxes = linked ? catalog.chainFor(folderId).slice(1) : []
  const scope = linked ? '' : ' (explorer)'
  // Long paths: keep the end (where you are) in view, like Explorer does.
  const address = useRef<HTMLElement>(null)
  useEffect(() => { const el = address.current; if (el) el.scrollLeft = el.scrollWidth }, [folderId, linked])

  return (
    <header className="topbar">
      <button className="iconbtn" title="Show or hide the explorer panel" aria-label="Toggle explorer panel" onClick={onTogglePanel}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" fill="none" strokeWidth="1.4" /><path d="M6 3v10" stroke="currentColor" strokeWidth="1.4" /></svg>
      </button>
      <div className="brand"><b>3dir</b><span>Your files. Your world.</span></div>
      <div className="navbtns">
        <button className="iconbtn" aria-label="Back" title={`Back: the previous place you visited${scope}`} disabled={!canBack} onClick={() => back('explorer')}><Chevron dir="left" /></button>
        <button className="iconbtn" aria-label="Forward" title={`Forward${scope}`} disabled={!canForward} onClick={() => forward('explorer')}><Chevron dir="right" /></button>
        <button className="iconbtn" aria-label="Up to parent folder" title={`Up: the folder that contains this one${scope}`} disabled={chain.length < 2} onClick={() => up('explorer')}><Chevron dir="up" /></button>
      </div>
      <nav className="address" aria-label="Current folder path" ref={address}>
        {!linked && <span className="addr-tag" title="Linked navigation is off: this path is the explorer's">Explorer</span>}
        {chain.map((n, i) => {
          const box = boxes.includes(n.id)
          return (
            <span key={n.id} style={{ display: 'contents' }}>
              {i > 0 && <span className={'crumb-sep' + (box ? ' box-edge' : '')} title={box ? `${n.name} is a box you opened` : undefined}>{box ? '▣' : '›'}</span>}
              <button className="crumb" onClick={() => explorerOpen(n.id)} title={fs.path(n.id)}>
                {i === 0 ? 'Local Disk (C:)' : n.name}
              </button>
            </span>
          )
        })}
      </nav>
      <SearchBox />
      <button
        className="toggle"
        role="switch"
        aria-checked={linked}
        title={linked ? 'On: the explorer and the world are in the same place. Turn off to move them separately.' : 'Off: the explorer and the world move separately.'}
        onClick={() => setLinked(!linked)}
      >
        <span className="track" /> Linked navigation
      </button>
    </header>
  )
}

function SearchBox() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const hits = useMemo(() => search(fs, dataset.nodes, q), [q])
  const goTo = useStore((s) => s.goTo)

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [])

  const choose = (i: number) => {
    const hit = hits[i]
    if (!hit) return
    goTo(hit.node.id)
    setOpen(false)
  }

  return (
    <div className="search" ref={box}>
      <svg className="glass" width="14" height="14" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.6" fill="none" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      <input
        type="search"
        placeholder="Search files and folders"
        aria-label="Search files and folders"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter') choose(active)
          else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && q.trim() && (
        <div className="results" role="listbox">
          {hits.length === 0 && <div className="empty">No matches for “{q}”</div>}
          {hits.map((h, i) => (
            <div key={h.node.id} role="option" aria-selected={i === active} className={'result' + (i === active ? ' active' : '')} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); choose(i) }}>
              <NodeIcon node={h.node} />
              <span className="name">{h.node.name}</span>
              <span className="path"><bdi>{h.path}</bdi></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
