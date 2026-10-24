import { useEffect, useState } from 'react'
import { KIND_STYLE } from './kinds'

const KEY = '3dir.guide.dismissed'
const LEGEND = ['spreadsheet', 'document', 'pdf', 'presentation', 'image', 'code', 'design', 'archive'] as const

function readDismissed(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

/**
 * A one-line guide along the bottom of the world (first visit), so the map stays
 * visible. "?" brings it back with the file-color key.
 */
export function Guide() {
  const [open, setOpen] = useState(() => !readDismissed())
  const [full, setFull] = useState(false)
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
      <button className="guide-reopen" onClick={() => { setOpen(true); setFull(true) }} title="How to use the world" aria-label="How to use the world">?</button>
    )
  }
  return (
    <section className={'guide' + (full ? ' full' : '')} aria-label="How to use 3dir">
      <ul>
        <li><b>Click</b> to select</li>
        <li><b>Double-click</b> to go inside or open</li>
        <li><b>Drag</b> to pan, <b>right-drag</b> to rotate, <b>scroll</b> to zoom</li>
        <li>Hold <kbd>Alt</kbd> to see every name</li>
        <li><b className="star">★</b> pins go straight to important places</li>
      </ul>
      {full && (
        <div className="legend" aria-label="File colors">
          {LEGEND.map((k) => (
            <span key={k}><i style={{ background: KIND_STYLE[k].color }} />{KIND_STYLE[k].label.replace(' document', '').replace('Compressed archive', 'Archive')}</span>
          ))}
          <span><i style={{ background: '#c8a275' }} />Closed folder box</span>
        </div>
      )}
      <button className="btn primary" onClick={close} autoFocus>Got it</button>
    </section>
  )
}
