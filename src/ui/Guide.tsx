import { useEffect, useState } from 'react'
import { KIND_STYLE } from './kinds'

const KEY = '3dir.guide.dismissed'
const LEGEND = ['spreadsheet', 'document', 'pdf', 'presentation', 'image', 'code', 'design', 'archive'] as const

function readDismissed(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

/** First-visit guide: what the world is, how to move, and what the colors mean. */
export function Guide() {
  const [open, setOpen] = useState(() => !readDismissed())
  const close = () => {
    setOpen(false)
    try { localStorage.setItem(KEY, '1') } catch { /* storage may be unavailable */ }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) {
    return (
      <button className="guide-reopen" onClick={() => setOpen(true)} title="How to use the world" aria-label="How to use the world">?</button>
    )
  }
  return (
    <section className="guide" aria-label="How to use 3dir">
      <h2>Your C: drive as a miniature town</h2>
      <ul>
        <li><b>Districts</b> are the main areas: the Alder &amp; Finch business archive, your studio, your photo gallery, other users, and Windows.</li>
        <li><b className="star">★ Pins</b> mark important places, however deep they are. Click one to go there.</li>
        <li><b>Click</b> to select. <b>Double-click</b> to go inside a place or open a file.</li>
        <li><b>Drag</b> to pan · <b>right-drag</b> to rotate · <b>scroll</b> to zoom.</li>
      </ul>
      <div className="legend" aria-label="File colors">
        {LEGEND.map((k) => (
          <span key={k}><i style={{ background: KIND_STYLE[k].color }} />{KIND_STYLE[k].label.replace(' document', '').replace('Compressed archive', 'Archive')}</span>
        ))}
        <span><i style={{ background: '#c8a275' }} />Closed folder box</span>
      </div>
      <button className="btn primary" onClick={close} autoFocus>Got it</button>
    </section>
  )
}
