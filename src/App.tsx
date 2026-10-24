import { useState } from 'react'
import { DetailsCard, PreviewModal } from './ui/Details'
import { Explorer } from './ui/Explorer'
import { TopBar } from './ui/TopBar'
import { World } from './scene/World'
import './ui/styles.css'

export function App() {
  const [panel, setPanel] = useState(true)
  return (
    <div className="app">
      <TopBar onTogglePanel={() => setPanel((p) => !p)} />
      <div className={'main' + (panel ? '' : ' collapsed')}>
        <Explorer />
        <div className="world">
          <World />
          <DetailsCard />
          <div className="fictional">Fictional demo computer — no real files</div>
        </div>
      </div>
      <PreviewModal />
    </div>
  )
}
