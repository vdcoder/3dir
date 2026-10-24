import { useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { WorldLayout } from '../mapping/types'
import { catalog, fs, useContextRoot, useStore } from '../state/store'
import { Buildings, Ground } from './Architecture'
import { CameraRig } from './CameraRig'
import { Fixtures, Items } from './Furniture'
import { Highlight, RevealOutlines } from './Highlight'
import { LabelBusContext, LabelLayer, LabelUpdater, makeLabelBus } from './Labels'
import { PickController } from './picking'
import { Pins } from './Pins'
import { Props } from './Props'
import { initShadows, refreshShadows } from './shadows'
import { atmosphere, LayoutContext } from './worldData'

function Lights({ layout }: { layout: WorldLayout }) {
  const g = layout.ground
  const half = Math.max(g.w, g.d) * 0.6
  const air = atmosphere(layout)
  return (
    <>
      <hemisphereLight args={[air.hemiSky, air.hemiGround, 1.25]} />
      <directionalLight
        position={[-g.w * 0.32 + (g.x + g.w / 2), 70, g.d * 0.5 + (g.z + g.d / 2)]}
        intensity={2.6}
        color={air.sun}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-radius={5}
        shadow-blurSamples={12}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={1}
        shadow-camera-far={260}
      />
      <directionalLight position={[g.w * 0.4, 40, -g.d * 0.3]} intensity={0.35} color="#dfe8ff" />
    </>
  )
}

/** Signals automated tests that the first frame with the full world has rendered. */
function ReadySignal({ onReady }: { onReady(): void }) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    initShadows(gl, invalidate)
    // Late-loading models (props) cast shadows too: refresh a few times as they arrive.
    const timers = [500, 1500, 3000, 6000].map((t) => setTimeout(refreshShadows, t))
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      ;(window as unknown as { __appReady: boolean }).__appReady = true
      onReady()
    }))
    return () => { cancelAnimationFrame(id); timers.forEach(clearTimeout) }
  }, [gl, invalidate, onReady])
  return null
}

/** Everything drawn for one world. Remounted when the world changes. */
function Scene({ layout }: { layout: WorldLayout }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => { refreshShadows(); invalidate() }, [layout, invalidate])
  return (
    <LayoutContext.Provider value={layout}>
      <Lights layout={layout} />
      <Ground />
      <Buildings />
      <Fixtures />
      <Items />
      <Props />
      <Pins />
      <Highlight />
      <RevealOutlines />
      <CameraRig />
      <LabelUpdater />
      <PickController />
    </LayoutContext.Provider>
  )
}

/** Reveal mode lasts while Alt is held (the world-corner button toggles it for touch screens). */
function useRevealKey() {
  useEffect(() => {
    const set = (on: boolean) => { if (useStore.getState().revealMode !== on) useStore.getState().setRevealMode(on) }
    const down = (e: KeyboardEvent) => { if (e.key === 'Alt') { e.preventDefault(); if (!e.repeat) set(true) } }
    const upKey = (e: KeyboardEvent) => { if (e.key === 'Alt') { e.preventDefault(); set(false) } }
    const blur = () => set(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', upKey)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', upKey); window.removeEventListener('blur', blur) }
  }, [])
}

export function World() {
  const [ready, setReady] = useState(false)
  useRevealKey()
  const contextRoot = useContextRoot()
  const layout = catalog.get(contextRoot)
  const bus = useMemo(() => makeLabelBus(layout), [layout])
  const air = atmosphere(layout)
  return (
    <div className={`world-stage world-${air.background}`}>
      <LabelBusContext.Provider value={bus}>
        <Canvas
          shadows={{ type: THREE.VSMShadowMap }}
          dpr={[1, 2]}
          frameloop="demand"
          camera={{ fov: 30, near: 0.5, far: 3000, position: [0, 150, 200] }}
          gl={{ antialias: false, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        >
          <LabelBusContext.Provider value={bus}>
            <Scene key={contextRoot} layout={layout} />
          </LabelBusContext.Provider>
          <ReadySignal onReady={markReady(setReady)} />
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <N8AO aoRadius={1.6} distanceFalloff={0.6} intensity={2.2} aoSamples={12} denoiseSamples={6} halfRes color="#3a2f22" />
            <SMAA />
          </EffectComposer>
        </Canvas>
        <LabelLayer key={contextRoot} bus={bus} />
      </LabelBusContext.Provider>
      <WorldHud />
      {!ready && <div className="loading" role="status"><div className="spinner" />Building your world…</div>}
    </div>
  )
}

// Stable callback per setter, so the ready effect runs once.
const readyCallbacks = new WeakMap<(v: boolean) => void, () => void>()
function markReady(set: (v: boolean) => void) {
  let cb = readyCallbacks.get(set)
  if (!cb) { cb = () => set(true); readyCallbacks.set(set, cb) }
  return cb
}

/**
 * World corner. Linked: the top bar is the only navigation (both views share one
 * place), so the world keeps just Overview, Reveal and, inside a box, a way out.
 * Unlinked: the world has its own path and Back / Forward / Up.
 */
function WorldHud() {
  const location = useStore((s) => s.world.location)
  const canBack = useStore((s) => s.world.back.length > 0)
  const canForward = useStore((s) => s.world.forward.length > 0)
  const linked = useStore((s) => s.linked)
  const reveal = useStore((s) => s.revealMode)
  const contextRoot = useContextRoot()
  const { back, forward, up, overview, worldEnter, navigate, setRevealMode } = useStore.getState()
  const chain = fs.ancestry(location)
  const boxes = catalog.chainFor(location).slice(1)
  const box = boxes.length ? fs.get(contextRoot) : undefined
  const leaveBox = () => { const b = fs.get(contextRoot); if (b?.parentId) navigate('world', b.parentId, b.id) }
  return (
    <div className={'world-hud' + (linked ? ' linked' : '')}>
      <div className="world-crumbs" aria-label="World location">
        <span className="where">{linked ? (boxes.length ? 'Inside a box' : 'You are in') : 'World'}</span>
        {chain.map((n, i) => (
          <span key={n.id} style={{ display: 'contents' }}>
            {i > 0 && <span className={'crumb-sep' + (boxes.includes(n.id) ? ' box-edge' : '')} title={boxes.includes(n.id) ? 'Opened box' : undefined}>{boxes.includes(n.id) ? '▣' : '›'}</span>}
            <button className={'crumb' + (n.id === contextRoot && boxes.length ? ' box-root' : '')} onClick={() => worldEnter(n.id)}>{i === 0 ? 'Local Disk (C:)' : n.name}</button>
          </span>
        ))}
      </div>
      {box && (
        <div className="box-chip" role="status">
          <span className="box-glyph" aria-hidden>▣</span> Inside the “{box.name}” box
          <button className="btn" onClick={leaveBox} title={`Back out to the shelf that holds “${box.name}”`}>Leave box</button>
        </div>
      )}
      <div className="world-buttons">
        <span className="world-nav">
          <button className="btn" onClick={() => back('world')} disabled={!canBack} title="Back: the previous place you visited (world)" aria-label="World back">←</button>
          <button className="btn" onClick={() => forward('world')} disabled={!canForward} title="Forward (world)" aria-label="World forward">→</button>
          <button className="btn" onClick={() => up('world')} disabled={chain.length < 2} title="Up: the folder that contains this one (world)" aria-label="World up">↑ Up</button>
        </span>
        <button className={'btn reveal-btn' + (reveal ? ' on' : '')} aria-pressed={reveal} onClick={() => setRevealMode(!reveal)} title="Show every name and boundary (or hold Alt)">
          Reveal <kbd>Alt</kbd>
        </button>
        <button className="btn" onClick={() => overview('world')} title="The whole C: map">Overview</button>
      </div>
    </div>
  )
}
