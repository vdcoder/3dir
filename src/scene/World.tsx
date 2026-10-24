import { useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { fs, ROOT_ID, useStore } from '../state/store'
import { Buildings, Land } from './Architecture'
import { CameraRig } from './CameraRig'
import { Fixtures, Items } from './Furniture'
import { Highlight } from './Highlight'
import { LabelLayer, LabelUpdater } from './Labels'
import { Props } from './Props'
import { Pins } from './Pins'
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing'
import { layout } from './worldData'
import { initShadows, refreshShadows } from './shadows'

function Lights() {
  const l = layout.land
  const half = Math.max(l.w, l.d) * 0.6
  return (
    <>
      <hemisphereLight args={['#fdf8ef', '#a99f8c', 1.25]} />
      <directionalLight
        position={[-l.w * 0.32, 70, l.d * 0.5]}
        intensity={2.6}
        color="#ffefd8"
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
      <directionalLight position={[l.w * 0.4, 40, -l.d * 0.3]} intensity={0.35} color="#dfe8ff" />
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

export function World() {
  const [ready, setReady] = useState(false)
  return (
    <>
      <Canvas
        shadows={{ type: THREE.VSMShadowMap }}
        dpr={[1, 2]}
        frameloop="demand"
        camera={{ fov: 30, near: 0.5, far: 3000, position: [0, 150, 200] }}
        gl={{ antialias: false, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onPointerMissed={() => useStore.getState().worldSelect(null)}
      >
        <Lights />
        <Land />
        <Buildings />
        <Fixtures />
        <Items />
        <Props />
        <Pins />
        <Highlight />
        <CameraRig />
        <LabelUpdater />
        <ReadySignal onReady={markReady(setReady)} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={1.6} distanceFalloff={0.6} intensity={2.2} aoSamples={12} denoiseSamples={6} halfRes color="#3a2f22" />
          <SMAA />
        </EffectComposer>
      </Canvas>
      <LabelLayer />
      <WorldHud />
      {!ready && <div className="loading" role="status"><div className="spinner" />Building your world…</div>}
    </>
  )
}

// Stable callback per setter, so the ready effect runs once.
const readyCallbacks = new WeakMap<(v: boolean) => void, () => void>()
function markReady(set: (v: boolean) => void) {
  let cb = readyCallbacks.get(set)
  if (!cb) { cb = () => set(true); readyCallbacks.set(set, cb) }
  return cb
}

function WorldHud() {
  const focusId = useStore((s) => s.world.focusId)
  const { worldEnter, worldUp } = useStore.getState()
  const chain = fs.ancestry(focusId)
  return (
    <div className="world-hud">
      <div className="world-crumbs" aria-label="World location">
        <span className="where">You are in</span>
        {chain.map((n, i) => (
          <span key={n.id} style={{ display: 'contents' }}>
            {i > 0 && <span className="crumb-sep">›</span>}
            <button className="crumb" onClick={() => worldEnter(n.id)}>{i === 0 ? 'Local Disk (C:)' : n.name}</button>
          </span>
        ))}
      </div>
      <div className="world-buttons">
        <button className="btn" onClick={worldUp} disabled={chain.length < 2} title="Go to the parent location">↑ Up</button>
        <button className="btn" onClick={() => worldEnter(ROOT_ID)} title="Back to the whole map">Overview</button>
      </div>
    </div>
  )
}
