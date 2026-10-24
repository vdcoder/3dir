import { useState } from 'react'
import { Guide } from './ui/Guide'
import { DetailsCard, PreviewModal } from './ui/Details'
import { Explorer } from './ui/Explorer'
import { TopBar } from './ui/TopBar'
import { World } from './scene/World'
import './ui/styles.css'

export function App() {
  const [panel, setPanel] = useState(() => typeof window === 'undefined' || window.innerWidth >= 760)
  return (
    <div className="app">
      <TopBar onTogglePanel={() => setPanel((p) => !p)} />
      <div className={'main' + (panel ? '' : ' collapsed')}>
        <Explorer />
        <div className="world">
          <World />
          <DetailsCard />
          <Guide />
          <div className="fictional">Fictional demo computer — no real files</div>
        </div>
      </div>
      <PreviewModal />
    </div>
  )
}
