import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { fs, ROOT_ID, useStore } from '../state/store'
import { Buildings, Land } from './Architecture'
import { CameraRig } from './CameraRig'
import { Fixtures, Items } from './Furniture'
import { Highlight } from './Highlight'
import { LabelLayer, LabelUpdater } from './Labels'
import { layout } from './worldData'

function Lights() {
  const l = layout.land
  const half = Math.max(l.w, l.d) * 0.6
  return (
    <>
      <hemisphereLight args={['#fffaf0', '#b8b09e', 1.1]} />
      <directionalLight
        position={[-l.w * 0.25, 90, l.d * 0.45]}
        intensity={2.3}
        color="#fff4e3"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
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
function ReadySignal() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      ;(window as unknown as { __appReady: boolean }).__appReady = true
    }))
    return () => cancelAnimationFrame(id)
  }, [gl])
  return null
}

export function World() {
  return (
    <>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        frameloop="demand"
        camera={{ fov: 30, near: 0.5, far: 3000, position: [0, 150, 200] }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onPointerMissed={() => useStore.getState().worldSelect(null)}
      >
        <color attach="background" args={['#e9ebe8']} />
        <fog attach="fog" args={['#e9ebe8', 380, 900]} />
        <Lights />
        <Land />
        <Buildings />
        <Fixtures />
        <Items />
        <Highlight />
        <CameraRig />
        <LabelUpdater />
        <ReadySignal />
      </Canvas>
      <LabelLayer />
      <WorldHud />
    </>
  )
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
