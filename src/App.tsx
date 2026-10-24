import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

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
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#8899aa" />
          </mesh>
          <OrbitControls makeDefault />
        </Canvas>
      </main>
    </div>
  )
}
