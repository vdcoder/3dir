import { Suspense, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Bounds, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/assets/' + (new URLSearchParams(location.search).get('m') ?? 'fountain') + '.glb'

// Report basic model stats so automated checks can confirm what loaded.
function Model() {
  const { scene } = useGLTF(MODEL_URL)
  const stats = useMemo(() => {
    let meshes = 0, triangles = 0, textured = 0
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      meshes++
      m.castShadow = true
      m.receiveShadow = true
      const g = m.geometry
      triangles += (g.index ? g.index.count : g.attributes.position.count) / 3
      const mat = m.material as THREE.MeshStandardMaterial
      if (mat.map) textured++
    })
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3())
    return { meshes, triangles: Math.round(triangles), textured, size: size.toArray().map((v) => +v.toFixed(3)) }
  }, [scene])

  useEffect(() => {
    ;(window as any).__modelStats = stats
    console.log('model-stats', JSON.stringify(stats))
  }, [stats])

  return <primitive object={scene} />
}

export function App() {
  return (
    <Canvas shadows camera={{ position: [3, 2.4, 3], fov: 35 }} gl={{ preserveDrawingBuffer: true }}>
      <color attach="background" args={['#eef0f3']} />
      <hemisphereLight args={['#ffffff', '#b9b2a6', 0.6]} />
      <directionalLight position={[4, 6, 3]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
      {/* Local light panels for reflections; no external HDR download. */}
      <Environment resolution={256} environmentIntensity={0.6}>
        <Lightformer intensity={2} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer intensity={1} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={0.6} color="#ffe9cc" position={[5, 1, -2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <Model />
        </Bounds>
        <ContactShadows position={[0, -0.001, 0]} opacity={0.45} scale={6} blur={2.2} far={2} />
      </Suspense>
      <OrbitControls makeDefault />
    </Canvas>
  )
}
