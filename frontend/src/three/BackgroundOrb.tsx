import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { suspend } from 'suspend-react'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const hdri = import('@pmndrs/assets/hdri/apartment.exr')

function Orb() {
  const mesh = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => new THREE.TorusKnotGeometry(0.8, 0.26, 220, 32), [])
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#a78bfa'),
        metalness: 0.15,
        roughness: 0.18,
        transmission: 0.55,
        thickness: 0.6,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      }),
    [],
  )

  useFrame((st) => {
    if (!mesh.current) return
    mesh.current.rotation.y += st.clock.getDelta() * 0.18
    mesh.current.rotation.x = Math.sin(st.clock.elapsedTime * 0.22) * 0.2
  })

  return (
    <mesh ref={mesh} geometry={geo} material={mat} position={[0, 0, 0]} castShadow receiveShadow />
  )
}

export function BackgroundOrb() {
  const env = suspend(hdri) as { default: string }
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 3.3], fov: 52 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 3, 2]} intensity={1.2} />
        <Environment files={env.default} />
        <Orb />
      </Canvas>
    </div>
  )
}

