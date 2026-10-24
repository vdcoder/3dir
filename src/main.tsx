import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { fs, useStore } from './state/store'

// Small hook for automated browser checks (screenshots, smoke tests).
;(window as unknown as { __3dir: unknown }).__3dir = { fs, useStore }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
