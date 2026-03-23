import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type { FurnitureItem } from '../types/layout'
import { furnitureCatalog } from './catalog'

// Extended color palettes based on styles
const STYLE_FURNITURE_COLORS: Record<string, Record<string, string>> = {
  Cozy: {
    bed: '#8b6914',
    sofa: '#a0522d',
    table: '#8b4513',
    chair: '#cd853f',
    wardrobe: '#a0522d',
    tvUnit: '#654321',
  },
  Minimal: {
    bed: '#d1d5db',
    sofa: '#f3f4f6',
    table: '#e5e7eb',
    chair: '#e5e7eb',
    wardrobe: '#f9fafb',
    tvUnit: '#f3f4f6',
  },
  Modern: {
    bed: '#1f2937',
    sofa: '#374151',
    table: '#4b5563',
    chair: '#6b7280',
    wardrobe: '#1f2937',
    tvUnit: '#111827',
  },
  Luxury: {
    bed: '#1e3a5f',
    sofa: '#78350f',
    table: '#1a1a1a',
    chair: '#c9a227',
    wardrobe: '#1e3a5f',
    tvUnit: '#1a1a1a',
  },
  Compact: {
    bed: '#9c8b7a',
    sofa: '#8b7d6b',
    table: '#a89880',
    chair: '#a89880',
    wardrobe: '#8b7d6b',
    tvUnit: '#a89880',
  },
}

function getStyleBasedColor(baseType: FurnitureItem['type'], styleSliders?: Record<string, number>): string {
  const TYPE_COLORS: Record<FurnitureItem['type'], string> = {
    bed: '#4a6fa5',
    sofa: '#6b7280',
    table: '#92400e',
    chair: '#854d0e',
    wardrobe: '#78350f',
    tvUnit: '#1f2937',
  }
  
  if (!styleSliders) {
    return TYPE_COLORS[baseType]
  }
  
  // Find dominant style
  let dominantStyle = 'Modern'
  let maxValue = 0
  for (const [style, value] of Object.entries(styleSliders)) {
    if (value > maxValue) {
      maxValue = value
      dominantStyle = style
    }
  }
  
  // If dominant style has enough weight, use its colors
  if (maxValue > 0.4 && STYLE_FURNITURE_COLORS[dominantStyle]) {
    return STYLE_FURNITURE_COLORS[dominantStyle][baseType] || TYPE_COLORS[baseType]
  }
  
  // Otherwise blend colors based on slider values
  const { Cozy, Minimal, Modern, Luxury, Compact } = styleSliders
  const total = Cozy + Minimal + Modern + Luxury + Compact || 1
  
  const blendColor = (color1: string, weight1: number, color2: string, weight2: number) => {
    const r1 = parseInt(color1.slice(1, 3), 16)
    const g1 = parseInt(color1.slice(3, 5), 16)
    const b1 = parseInt(color1.slice(5, 7), 16)
    const r2 = parseInt(color2.slice(1, 3), 16)
    const g2 = parseInt(color2.slice(3, 5), 16)
    const b2 = parseInt(color2.slice(5, 7), 16)
    const totalWeight = weight1 + weight2
    const r = Math.round((r1 * weight1 + r2 * weight2) / totalWeight)
    const g = Math.round((g1 * weight1 + g2 * weight2) / totalWeight)
    const b = Math.round((b1 * weight1 + b2 * weight2) / totalWeight)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  
  const baseColor = TYPE_COLORS[baseType]
  const styles = Object.keys(styleSliders) as Array<keyof typeof STYLE_FURNITURE_COLORS>
  
  let resultColor = baseColor
  let totalWeight = 0
  
  for (const style of styles) {
    if (styleSliders[style] > 0.2 && STYLE_FURNITURE_COLORS[style] && STYLE_FURNITURE_COLORS[style][baseType]) {
      resultColor = blendColor(resultColor, totalWeight, STYLE_FURNITURE_COLORS[style][baseType], styleSliders[style])
      totalWeight += styleSliders[style]
    }
  }
  
  return resultColor
}

function SofaMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Base/Seat */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.25, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.5, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.6, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Left Arm */}
      <mesh position={[-0.95, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.35, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Right Arm */}
      <mesh position={[0.95, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.35, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Legs */}
      {[[-0.85, 0.08, 0.3], [0.85, 0.08, 0.3], [-0.85, 0.08, -0.3], [0.85, 0.08, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.16]} />
          <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function BedMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Mattress */}
      <mesh position={[0, 0.28, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.25, 1.6]} />
        <meshStandardMaterial color="#f3f4f6" roughness={0.9} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.2, 1.7]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.65, -0.75]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.7, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Pillow */}
      <mesh position={[0, 0.45, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.15, 0.4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
    </group>
  )
}

function TableMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Top */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.05, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Legs */}
      {[[-0.4, 0.2, 0.4], [0.4, 0.2, 0.4], [-0.4, 0.2, -0.4], [0.4, 0.2, -0.4]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.08, 0.4, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function ChairMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.55, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.5, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[[-0.18, 0.11, 0.18], [0.18, 0.11, 0.18], [-0.18, 0.11, -0.18], [0.18, 0.11, -0.18]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.22]} />
          <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function WardrobeMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.0, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Left door line */}
      <mesh position={[-0.01, 1.0, 0.31]} castShadow>
        <boxGeometry args={[0.02, 1.9, 0.02]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Handles */}
      <mesh position={[-0.35, 1.0, 0.32]} castShadow>
        <boxGeometry args={[0.04, 0.15, 0.04]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.35, 1.0, 0.32]} castShadow>
        <boxGeometry args={[0.04, 0.15, 0.04]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function TvUnitMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.35, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* TV Screen (simplified) */}
      <mesh position={[0, 0.65, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.7, 0.05]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* TV Screen glow */}
      <mesh position={[0, 0.65, -0.02]}>
        <boxGeometry args={[1.1, 0.6, 0.01]} />
        <meshStandardMaterial color="#1e3a5f" emissive="#1e40af" emissiveIntensity={0.3} />
      </mesh>
      {/* Shelf doors */}
      <mesh position={[-0.4, 0.2, 0.23]} castShadow>
        <boxGeometry args={[0.5, 0.28, 0.02]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[0.4, 0.2, 0.23]} castShadow>
        <boxGeometry args={[0.5, 0.28, 0.02]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </group>
  )
}

export function FurnitureInstance({ item, styleSliders }: { item: FurnitureItem; styleSliders?: Record<string, number> }) {
  const spec = furnitureCatalog[item.type]
  const color = useMemo(() => getStyleBasedColor(item.type, styleSliders), [item.type, styleSliders])
  
  // Preload the model
  useGLTF(spec.modelUrl)
  
  const getPosition = (): [number, number, number] => {
    return [item.x, 0, item.z]
  }

  const renderMesh = () => {
    switch (item.type) {
      case 'bed':
        return <BedMesh color={color} />
      case 'sofa':
        return <SofaMesh color={color} />
      case 'table':
        return <TableMesh color={color} />
      case 'chair':
        return <ChairMesh color={color} />
      case 'wardrobe':
        return <WardrobeMesh color={color} />
      case 'tvUnit':
        return <TvUnitMesh color={color} />
      default:
        return <SofaMesh color={color} />
    }
  }

  return (
    <group
      position={getPosition()}
      rotation={[0, item.rotationY, 0]}
      scale={[item.scale, item.scale, item.scale]}
    >
      {renderMesh()}
    </group>
  )
}

