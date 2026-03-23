import { Canvas } from '@react-three/fiber'
import { OrbitControls, SoftShadows, Environment, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { LayoutSolution, FurnitureItem, StyleChip } from '../types/layout'
import { FurnitureInstance } from './FurnitureInstance'
import { useStudioStore } from '../store/useStudioStore'
import { Room, getStyleColors, getStyleLighting } from './Room'

export function InteriorCanvas({ solution }: { solution: LayoutSolution }) {
  const { lengthM, widthM, type: roomType } = solution.room
  
  // Get style sliders from store
  const styleSliders = useStudioStore((state) => state.styleSliders)
  const selectedStyles = solution.selectedStyles || ['Modern']

  // Get style-based colors and lighting
  const roomColors = styleSliders ? getStyleColors(styleSliders) : null
  const roomLighting = styleSliders ? getStyleLighting(styleSliders) : null

  // Get the GA-optimized positions from the solution
  // Use positions as-is from GA, with minimal adjustment to keep within room bounds
  const displayItems: FurnitureItem[] = solution.items.map((it) => {
    const halfW = widthM / 2
    const halfL = lengthM / 2
    
    // Minimal padding to ensure furniture stays inside room
    // The GA already optimizes for valid positions
    const padding = 0.5
    
    // Clamp positions but preserve relative arrangement from GA
    const x = Math.max(-halfW + padding, Math.min(halfW - padding, it.x))
    const z = Math.max(-halfL + padding, Math.min(halfL - padding, it.z))
    
    return {
      ...it,
      x,
      z,
    }
  })

  return (
    <div className="h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ 
          position: [widthM * 0.6, 2.5, lengthM * 0.7], 
          fov: 50, 
          near: 0.1, 
          far: 60 
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFShadowMap
        }}
      >
        {/* Ambient light - style-based */}
        <ambientLight 
          intensity={roomLighting ? roomLighting.ambientIntensity : 0.6} 
          color={roomLighting ? roomLighting.ambientColor : '#ffffff'} 
        />
        
        {/* Main directional light - warm sunlight */}
        <directionalLight
          castShadow
          intensity={roomLighting ? roomLighting.mainLightIntensity : 1.8}
          position={[6, 10, 4]}
          color={roomLighting ? roomLighting.mainLightColor : '#ffffff'}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
        />
        
        {/* Fill light - cool blue from opposite side */}
        <directionalLight
          intensity={roomLighting ? roomLighting.fillLightIntensity : 0.35}
          position={[-5, 6, -4]}
          color="#c7d2fe"
        />
        
        {/* Accent light - warm glow */}
        <pointLight
          intensity={roomLighting ? roomLighting.accentLightIntensity : 0.4}
          position={[0, 2.5, 0]}
          color="#fef3c7"
          distance={8}
          decay={2}
        />

        {/* Environment for realistic reflections */}
        <Environment preset="sunset" background={false} />

        <SoftShadows size={12} focus={0.5} samples={12} />

        {/* Room with floor and walls - uses style-based design */}
        <Room 
          lengthM={lengthM} 
          widthM={widthM} 
          wallH={2.8}
          styleSliders={styleSliders}
          roomType={roomType}
        />
        
        {/* Subtle grid on floor */}
        <Grid 
          position={[0, 0.005, 0]} 
          args={[widthM - 0.1, lengthM - 0.1]} 
          cellSize={0.5}
          cellThickness={0.4}
          cellColor="#374151"
          sectionSize={2}
          sectionThickness={0.6}
          sectionColor="#4b5563"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
        />

        {/* Furniture items positioned by GA - with style-based colors */}
        {displayItems.map((it) => (
          <FurnitureInstance key={it.id} item={it} styleSliders={styleSliders} />
        ))}

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={Math.max(2.5, Math.min(widthM, lengthM) * 0.4)}
          maxDistance={Math.max(10, Math.max(widthM, lengthM) * 1.8)}
          panSpeed={0.6}
          target={[0, 0.3, 0]}
        />
      </Canvas>
    </div>
  )
}

// Improved Room component with design elements
function RoomWithDesign({ 
  lengthM, 
  widthM, 
  roomType 
}: { 
  lengthM: number; 
  widthM: number; 
  roomType: string 
}) {
  const wallHeight = 2.8
  const halfW = widthM / 2
  const halfL = lengthM / 2
  
  // Floor color based on room type
  const floorColor = roomType === 'Bedroom' ? '#b8a88a' : '#a39382'
  const wallColor = '#f5f5f4'
  const accentWall = roomType === 'Living Room' ? '#e8e4df' : '#fafaf9'
  
  return (
    <group>
      {/* Floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial 
          color={floorColor} 
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
      
      {/* Back wall (darker accent) */}
      <mesh 
        position={[0, wallHeight / 2, -halfL]} 
        receiveShadow
      >
        <planeGeometry args={[widthM, wallHeight]} />
        <meshStandardMaterial 
          color={accentWall} 
          roughness={0.95}
        />
      </mesh>
      
      {/* Front wall */}
      <mesh 
        position={[0, wallHeight / 2, halfL]} 
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[widthM, wallHeight]} />
        <meshStandardMaterial 
          color={wallColor} 
          roughness={0.95}
        />
      </mesh>
      
      {/* Left wall */}
      <mesh 
        position={[-halfW, wallHeight / 2, 0]} 
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[lengthM, wallHeight]} />
        <meshStandardMaterial 
          color={wallColor} 
          roughness={0.95}
        />
      </mesh>
      
      {/* Right wall */}
      <mesh 
        position={[halfW, wallHeight / 2, 0]} 
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[lengthM, wallHeight]} />
        <meshStandardMaterial 
          color={wallColor} 
          roughness={0.95}
        />
      </mesh>
      
      {/* Baseboards - adds realism */}
      <Baseboard width={widthM} length={lengthM} height={0.1} />
      
      {/* Ceiling light area hint */}
      <mesh 
        position={[0, wallHeight - 0.01, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[widthM * 0.3, lengthM * 0.3]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#fefce8"
          emissiveIntensity={0.1}
          roughness={1}
        />
      </mesh>
    </group>
  )
}

// Baseboard component
function Baseboard({ 
  width, 
  length, 
  height 
}: { 
  width: number; 
  length: number; 
  height: number 
}) {
  const baseboardColor = '#e7e5e4'
  const thickness = 0.02
  const halfW = width / 2
  const halfL = length / 2
  
  return (
    <group>
      {/* Back baseboard */}
      <mesh position={[0, height / 2, -halfL + thickness / 2]}>
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>
      
      {/* Front baseboard */}
      <mesh position={[0, height / 2, halfL - thickness / 2]}>
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>
      
      {/* Left baseboard */}
      <mesh position={[-halfW + thickness / 2, height / 2, 0]}>
        <boxGeometry args={[thickness, height, length]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>
      
      {/* Right baseboard */}
      <mesh position={[halfW - thickness / 2, height / 2, 0]}>
        <boxGeometry args={[thickness, height, length]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>
    </group>
  )
}

