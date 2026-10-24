import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei'
import { assetUrl } from './assetUrl'

function TestAsset() {
  const { scene } = useGLTF(assetUrl('assets/library-pavilion.glb'))
  useEffect(() => {
    ;(window as unknown as { __appReady: boolean }).__appReady = true
  }, [])
  return <primitive object={scene} />
}

// Placeholder shell for the foundation milestone. The real layout, explorer
// and world arrive once the product decisions are made.
export function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ padding: '8px 16px', borderBottom: '1px solid #ddd' }}>
        3dir — foundation placeholder (fictional data only)
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <Canvas data-testid="world" camera={{ position: [4, 4, 4], fov: 40 }}>
          <color attach="background" args={['#f2f2f2']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 2]} intensity={1.5} />
          <Suspense fallback={null}>
            <Bounds fit clip margin={1.4}>
              <TestAsset />
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
      </main>
    </div>
  )
}
