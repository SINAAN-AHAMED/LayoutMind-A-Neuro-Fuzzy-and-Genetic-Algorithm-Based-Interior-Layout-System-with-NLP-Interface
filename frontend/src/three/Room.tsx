import { useMemo } from 'react'
import * as THREE from 'three'
import type { StyleChip } from '../types/layout'

export type StyleSliders = Record<StyleChip, number>

// Color palettes for different styles
const STYLE_PALETTES = {
  Cozy: {
    floor: '#b8956e',
    floorRoughness: 0.9,
    wall: '#f5e6d3',
    wallRoughness: 0.95,
    accentWall: '#e8d5c4',
    baseboard: '#d4c4b0',
    ceiling: '#faf8f5',
    rug: '#c9a882',
    curtain: '#d4a574',
    trim: '#c9b8a4',
  },
  Minimal: {
    floor: '#e8e4e0',
    floorRoughness: 0.4,
    wall: '#ffffff',
    wallRoughness: 0.9,
    accentWall: '#f5f5f5',
    baseboard: '#e0e0e0',
    ceiling: '#ffffff',
    rug: '#d4d4d4',
    curtain: '#f0f0f0',
    trim: '#e5e5e5',
  },
  Modern: {
    floor: '#8b8178',
    floorRoughness: 0.5,
    wall: '#e5e5e5',
    wallRoughness: 0.85,
    accentWall: '#d4d4d4',
    baseboard: '#404040',
    ceiling: '#f0f0f0',
    rug: '#4a4a4a',
    curtain: '#2d2d2d',
    trim: '#3d3d3d',
  },
  Luxury: {
    floor: '#1a1a1a',
    floorRoughness: 0.2,
    wall: '#f8f6f3',
    wallRoughness: 0.8,
    accentWall: '#1e3a5f',
    baseboard: '#c9a227',
    ceiling: '#ffffff',
    rug: '#1e3a5f',
    curtain: '#8b0000',
    trim: '#c9a227',
  },
  Compact: {
    floor: '#a89880',
    floorRoughness: 0.85,
    wall: '#f0ebe5',
    wallRoughness: 0.92,
    accentWall: '#e8e2da',
    baseboard: '#c8c0b4',
    ceiling: '#faf8f5',
    rug: '#b8a890',
    curtain: '#e8e0d4',
    trim: '#bab4a6',
  },
}

// Get interpolated colors based on style sliders
export function getStyleColors(styleSliders: StyleSliders) {
  const { Cozy, Minimal, Modern, Luxury, Compact } = styleSliders
  const total = Cozy + Minimal + Modern + Luxury + Compact || 1
  
  const wCozy = Cozy / total
  const wMinimal = Minimal / total
  const wModern = Modern / total
  const wLuxury = Luxury / total
  const wCompact = Compact / total

  const blend = (key: keyof typeof STYLE_PALETTES.Cozy): string => {
    const c = STYLE_PALETTES.Cozy[key] as string
    const m = STYLE_PALETTES.Minimal[key] as string
    const md = STYLE_PALETTES.Modern[key] as string
    const l = STYLE_PALETTES.Luxury[key] as string
    const cp = STYLE_PALETTES.Compact[key] as string
    
    const r = Math.round(
      parseInt(c.slice(1, 3), 16) * wCozy +
      parseInt(m.slice(1, 3), 16) * wMinimal +
      parseInt(md.slice(1, 3), 16) * wModern +
      parseInt(l.slice(1, 3), 16) * wLuxury +
      parseInt(cp.slice(1, 3), 16) * wCompact
    )
    const g = Math.round(
      parseInt(c.slice(3, 5), 16) * wCozy +
      parseInt(m.slice(3, 5), 16) * wMinimal +
      parseInt(md.slice(3, 5), 16) * wModern +
      parseInt(l.slice(3, 5), 16) * wLuxury +
      parseInt(cp.slice(3, 5), 16) * wCompact
    )
    const b = Math.round(
      parseInt(c.slice(5, 7), 16) * wCozy +
      parseInt(m.slice(5, 7), 16) * wMinimal +
      parseInt(md.slice(5, 7), 16) * wModern +
      parseInt(l.slice(5, 7), 16) * wLuxury +
      parseInt(cp.slice(5, 7), 16) * wCompact
    )
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const blendNum = (key: keyof typeof STYLE_PALETTES.Cozy): number => {
    const c = STYLE_PALETTES.Cozy[key] as number
    const m = STYLE_PALETTES.Minimal[key] as number
    const md = STYLE_PALETTES.Modern[key] as number
    const l = STYLE_PALETTES.Luxury[key] as number
    const cp = STYLE_PALETTES.Compact[key] as number
    return c * wCozy + m * wMinimal + md * wModern + l * wLuxury + cp * wCompact
  }

  return {
    floor: blend('floor'),
    floorRoughness: blendNum('floorRoughness'),
    wall: blend('wall'),
    wallRoughness: blendNum('wallRoughness'),
    accentWall: blend('accentWall'),
    baseboard: blend('baseboard'),
    ceiling: blend('ceiling'),
    rug: blend('rug'),
    curtain: blend('curtain'),
    trim: blend('trim'),
  }
}

// Lighting configuration based on styles
export function getStyleLighting(styleSliders: StyleSliders) {
  const { Cozy, Minimal, Modern, Luxury, Compact } = styleSliders
  const total = Cozy + Minimal + Modern + Luxury + Compact || 1
  
  // Cozy: warm, dim lighting
  // Minimal: bright, neutral lighting
  // Modern: bright, slightly cool
  // Luxury: dramatic, warm with accent
  // Compact: bright, space-enhancing

  const warmth = (Cozy * 0.9 + Luxury * 0.7) / total
  const brightness = (Minimal * 1.0 + Compact * 0.9 + Modern * 0.8) / total
  const drama = (Luxury * 0.8 + Modern * 0.3) / total

  return {
    ambientIntensity: 0.3 + brightness * 0.4,
    ambientColor: warmth > 0.4 ? '#fff5e6' : '#ffffff',
    mainLightIntensity: 1.2 + brightness * 0.8,
    mainLightColor: warmth > 0.4 ? '#fff8f0' : '#ffffff',
    fillLightIntensity: 0.2 + drama * 0.3,
    accentLightIntensity: warmth * 0.5 + drama * 0.3,
  }
}

interface RoomProps {
  lengthM: number
  widthM: number
  wallH?: number
  styleSliders?: StyleSliders
  roomType?: 'Bedroom' | 'Living Room'
}

export function Room({ lengthM, widthM, wallH = 2.7, styleSliders, roomType = 'Living Room' }: RoomProps) {
  const halfW = widthM / 2
  const halfL = lengthM / 2

  const colors = useMemo(() => {
    if (!styleSliders) {
      return {
        floor: roomType === 'Bedroom' ? '#b8a88a' : '#a39382',
        floorRoughness: 0.85,
        wall: '#f5f5f4',
        wallRoughness: 0.95,
        accentWall: roomType === 'Living Room' ? '#e8e4df' : '#fafaf9',
        baseboard: '#e7e5e4',
        ceiling: '#ffffff',
        rug: '#a39382',
        curtain: '#e8e4df',
        trim: '#d4d4d4',
      }
    }
    return getStyleColors(styleSliders)
  }, [styleSliders, roomType])

  const lighting = useMemo(() => {
    if (!styleSliders) {
      return {
        ambientIntensity: 0.6,
        ambientColor: '#ffffff',
        mainLightIntensity: 1.8,
        mainLightColor: '#fff8f0',
        fillLightIntensity: 0.35,
        accentLightIntensity: 0.4,
      }
    }
    return getStyleLighting(styleSliders)
  }, [styleSliders])

  return (
    <group>
      {/* Floor with style-based material */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial 
          color={colors.floor} 
          roughness={colors.floorRoughness}
          metalness={roomType === 'Living Room' ? 0.05 : 0.02}
        />
      </mesh>

      {/* Decorative rug */}
      <Rug widthM={widthM} lengthM={lengthM} color={colors.rug} styleSliders={styleSliders} />

      {/* Back wall (accent wall) */}
      <mesh receiveShadow position={[0, wallH / 2, -halfL]}>
        <planeGeometry args={[widthM, wallH]} />
        <meshStandardMaterial color={colors.accentWall} roughness={colors.wallRoughness} />
      </mesh>

      {/* Front wall */}
      <mesh receiveShadow position={[0, wallH / 2, halfL]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[widthM, wallH]} />
        <meshStandardMaterial color={colors.wall} roughness={colors.wallRoughness} />
      </mesh>

      {/* Left wall */}
      <mesh receiveShadow position={[-halfW, wallH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[lengthM, wallH]} />
        <meshStandardMaterial color={colors.wall} roughness={colors.wallRoughness} />
      </mesh>

      {/* Right wall */}
      <mesh receiveShadow position={[halfW, wallH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[lengthM, wallH]} />
        <meshStandardMaterial color={colors.wall} roughness={colors.wallRoughness} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, wallH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial color={colors.ceiling} roughness={0.95} />
      </mesh>

      {/* Baseboards */}
      <Baseboard 
        width={widthM} 
        length={lengthM} 
        height={0.1} 
        color={colors.baseboard}
        styleSliders={styleSliders}
      />

      {/* Crown molding */}
      <CrownMolding 
        width={widthM} 
        length={lengthM} 
        wallH={wallH}
        color={colors.trim}
        styleSliders={styleSliders}
      />

      {/* Window with curtains */}
      <WindowWithCurtains 
        width={widthM} 
        length={lengthM} 
        wallH={wallH}
        curtainColor={colors.curtain}
        styleSliders={styleSliders}
      />

      {/* Wall art/decoration */}
      <WallArt 
        width={widthM} 
        length={lengthM} 
        wallH={wallH}
        styleSliders={styleSliders}
        roomType={roomType}
      />

      {/* Ceiling light fixture */}
      <CeilingLight 
        width={widthM} 
        length={lengthM} 
        wallH={wallH}
        styleSliders={styleSliders}
      />

      {/* Decorative plants (if space allows) */}
      {Math.min(widthM, lengthM) > 3 && (
        <DecorativePlant 
          width={widthM} 
          length={lengthM} 
          styleSliders={styleSliders}
        />
      )}
    </group>
  )
}

// Baseboard component
function Baseboard({ 
  width, 
  length, 
  height,
  color,
  styleSliders 
}: { 
  width: number
  length: number
  height: number
  color: string
  styleSliders?: StyleSliders
}) {
  const thickness = 0.02
  const halfW = width / 2
  const halfL = length / 2
  
  const isLuxury = styleSliders ? styleSliders.Luxury > 0.5 : false
  const isModern = styleSliders ? styleSliders.Modern > 0.5 : false
  
  const baseHeight = isLuxury ? height * 1.3 : height
  const baseColor = isModern ? '#404040' : color

  return (
    <group>
      {/* Back baseboard */}
      <mesh position={[0, baseHeight / 2, -halfL + thickness / 2]}>
        <boxGeometry args={[width, baseHeight, thickness]} />
        <meshStandardMaterial 
          color={baseColor} 
          roughness={isLuxury ? 0.3 : 0.8}
          metalness={isLuxury ? 0.3 : 0}
        />
      </mesh>
      
      {/* Front baseboard */}
      <mesh position={[0, baseHeight / 2, halfL - thickness / 2]}>
        <boxGeometry args={[width, baseHeight, thickness]} />
        <meshStandardMaterial 
          color={baseColor} 
          roughness={isLuxury ? 0.3 : 0.8}
          metalness={isLuxury ? 0.3 : 0}
        />
      </mesh>
      
      {/* Left baseboard */}
      <mesh position={[-halfW + thickness / 2, baseHeight / 2, 0]}>
        <boxGeometry args={[thickness, baseHeight, length]} />
        <meshStandardMaterial 
          color={baseColor} 
          roughness={isLuxury ? 0.3 : 0.8}
          metalness={isLuxury ? 0.3 : 0}
        />
      </mesh>
      
      {/* Right baseboard */}
      <mesh position={[halfW - thickness / 2, baseHeight / 2, 0]}>
        <boxGeometry args={[thickness, baseHeight, length]} />
        <meshStandardMaterial 
          color={baseColor} 
          roughness={isLuxury ? 0.3 : 0.8}
          metalness={isLuxury ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}

// Crown molding component
function CrownMolding({
  width,
  length,
  wallH,
  color,
  styleSliders
}: {
  width: number
  length: number
  wallH: number
  color: string
  styleSliders?: StyleSliders
}) {
  const halfW = width / 2
  const halfL = length / 2
  const moldingHeight = 0.08
  const moldingDepth = 0.04
  
  const isLuxury = styleSliders ? styleSliders.Luxury > 0.4 : false
  const isMinimal = styleSliders ? styleSliders.Minimal > 0.5 : true
  const isModern = styleSliders ? styleSliders.Modern > 0.5 : false

  // Skip crown molding for minimal style
  if (isMinimal && !isLuxury) return null

  const moldingColor = isModern ? '#3d3d3d' : isLuxury ? '#c9a227' : color
  const metalness = isLuxury ? 0.4 : 0
  const roughness = isLuxury ? 0.3 : 0.7

  return (
    <group>
      {/* Back crown */}
      <mesh position={[0, wallH - moldingHeight / 2, -halfL + moldingDepth / 2]}>
        <boxGeometry args={[width, moldingHeight, moldingDepth]} />
        <meshStandardMaterial color={moldingColor} roughness={roughness} metalness={metalness} />
      </mesh>
      
      {/* Front crown */}
      <mesh position={[0, wallH - moldingHeight / 2, halfL - moldingDepth / 2]}>
        <boxGeometry args={[width, moldingHeight, moldingDepth]} />
        <meshStandardMaterial color={moldingColor} roughness={roughness} metalness={metalness} />
      </mesh>
      
      {/* Left crown */}
      <mesh position={[-halfW + moldingDepth / 2, wallH - moldingHeight / 2, 0]}>
        <boxGeometry args={[moldingDepth, moldingHeight, length]} />
        <meshStandardMaterial color={moldingColor} roughness={roughness} metalness={metalness} />
      </mesh>
      
      {/* Right crown */}
      <mesh position={[halfW - moldingDepth / 2, wallH - moldingHeight / 2, 0]}>
        <boxGeometry args={[moldingDepth, moldingHeight, length]} />
        <meshStandardMaterial color={moldingColor} roughness={roughness} metalness={metalness} />
      </mesh>
    </group>
  )
}

// Window with curtains
function WindowWithCurtains({
  width,
  length,
  wallH,
  curtainColor,
  styleSliders
}: {
  width: number
  length: number
  wallH: number
  curtainColor: string
  styleSliders?: StyleSliders
}) {
  const halfW = width / 2
  const halfL = length / 2
  
  const isMinimal = styleSliders ? styleSliders.Minimal > 0.5 : false
  const isModern = styleSliders ? styleSliders.Modern > 0.5 : false
  const isCozy = styleSliders ? styleSliders.Cozy > 0.5 : false
  const isLuxury = styleSliders ? styleSliders.Luxury > 0.4 : false

  const windowWidth = width * 0.4
  const windowHeight = wallH * 0.6
  const windowY = wallH * 0.5

  // Window frame color
  const frameColor = isModern ? '#2d2d2d' : isLuxury ? '#c9a227' : '#e0e0e0'
  const frameMetalness = isLuxury ? 0.5 : 0
  const frameRoughness = isModern ? 0.4 : 0.6

  // Curtain style
  const showCurtains = !isMinimal || isCozy || isLuxury
  const curtainHeight = isLuxury ? wallH * 0.85 : wallH * 0.7

  return (
    <group>
      {/* Window opening (dark) */}
      <mesh position={[0, windowY, -halfL + 0.01]}>
        <planeGeometry args={[windowWidth, windowHeight]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>

      {/* Window frame - top */}
      <mesh position={[0, windowY + windowHeight / 2 + 0.03, -halfL + 0.02]}>
        <boxGeometry args={[windowWidth + 0.1, 0.06, 0.04]} />
        <meshStandardMaterial color={frameColor} metalness={frameMetalness} roughness={frameRoughness} />
      </mesh>

      {/* Window frame - bottom */}
      <mesh position={[0, windowY - windowHeight / 2 - 0.03, -halfL + 0.02]}>
        <boxGeometry args={[windowWidth + 0.1, 0.06, 0.04]} />
        <meshStandardMaterial color={frameColor} metalness={frameMetalness} roughness={frameRoughness} />
      </mesh>

      {/* Window frame - left */}
      <mesh position={[-windowWidth / 2 - 0.03, windowY, -halfL + 0.02]}>
        <boxGeometry args={[0.06, windowHeight, 0.04]} />
        <meshStandardMaterial color={frameColor} metalness={frameMetalness} roughness={frameRoughness} />
      </mesh>

      {/* Window frame - right */}
      <mesh position={[windowWidth / 2 + 0.03, windowY, -halfL + 0.02]}>
        <boxGeometry args={[0.06, windowHeight, 0.04]} />
        <meshStandardMaterial color={frameColor} metalness={frameMetalness} roughness={frameRoughness} />
      </mesh>

      {/* Curtains */}
      {showCurtains && (
        <>
          {/* Left curtain */}
          <mesh position={[-windowWidth / 2 - 0.15, curtainHeight / 2, -halfL + 0.05]} castShadow>
            <boxGeometry args={[0.04, curtainHeight, windowWidth * 0.5]} />
            <meshStandardMaterial 
              color={curtainColor} 
              roughness={isCozy ? 0.95 : 0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Right curtain */}
          <mesh position={[windowWidth / 2 + 0.15, curtainHeight / 2, -halfL + 0.05]} castShadow>
            <boxGeometry args={[0.04, curtainHeight, windowWidth * 0.5]} />
            <meshStandardMaterial 
              color={curtainColor} 
              roughness={isCozy ? 0.95 : 0.7}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Curtain rod */}
          <mesh position={[0, curtainHeight + 0.1, -halfL + 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, windowWidth + 0.6, 8]} />
            <meshStandardMaterial 
              color={isLuxury ? '#c9a227' : isModern ? '#404040' : '#a0a0a0'} 
              metalness={isLuxury ? 0.6 : 0.3}
              roughness={isLuxury ? 0.3 : 0.5}
            />
          </mesh>
        </>
      )}
    </group>
  )
}

// Wall art component
function WallArt({
  width,
  length,
  wallH,
  styleSliders,
  roomType
}: {
  width: number
  length: number
  wallH: number
  styleSliders?: StyleSliders
  roomType: 'Bedroom' | 'Living Room'
}) {
  const halfW = width / 2
  const halfL = length / 2
  
  const isMinimal = styleSliders ? styleSliders.Minimal > 0.5 : false
  const isModern = styleSliders ? styleSliders.Modern > 0.5 : false
  const isLuxury = styleSliders ? styleSliders.Luxury > 0.4 : false
  const isCozy = styleSliders ? styleSliders.Cozy > 0.5 : false

  // Skip wall art for minimal style
  if (isMinimal && !isCozy && !isLuxury) return null

  const artWidth = width * 0.25
  const artHeight = wallH * 0.3
  const artY = wallH * 0.6

  // Art frame
  const frameColor = isLuxury ? '#c9a227' : isModern ? '#1a1a1a' : '#4a4a4a'
  const frameThickness = isLuxury ? 0.04 : 0.02
  
  // Art content based on room type
  const artColor1 = roomType === 'Living Room' 
    ? (isModern ? '#2d3748' : isCozy ? '#9c4221' : '#1e3a5f')
    : (isCozy ? '#7c5e3c' : isModern ? '#4a5568' : '#2d3748')
  const artColor2 = roomType === 'Living Room'
    ? (isModern ? '#4a5568' : isCozy ? '#d69e2e' : '#c9a227')
    : (isCozy ? '#d69e2e' : isModern ? '#718096' : '#4a5568')

  return (
    <group>
      {/* Art frame - back */}
      <mesh position={[0, artY, -halfL + 0.01]}>
        <boxGeometry args={[artWidth + frameThickness * 2, artHeight + frameThickness * 2, 0.02]} />
        <meshStandardMaterial color={frameColor} metalness={isLuxury ? 0.5 : 0.1} roughness={0.5} />
      </mesh>

      {/* Art canvas - left section */}
      <mesh position={[-artWidth * 0.25, artY, -halfL + 0.025]}>
        <planeGeometry args={[artWidth * 0.45, artHeight * 0.8]} />
        <meshStandardMaterial color={artColor1} roughness={0.9} />
      </mesh>

      {/* Art canvas - right section */}
      <mesh position={[artWidth * 0.25, artY, -halfL + 0.025]}>
        <planeGeometry args={[artWidth * 0.45, artHeight * 0.8]} />
        <meshStandardMaterial color={artColor2} roughness={0.9} />
      </mesh>

      {/* Optional: shelf below art for modern/cozy */}
      {(isModern || isCozy) && (
        <mesh position={[0, artY - artHeight / 2 - 0.08, -halfL + 0.08]}>
          <boxGeometry args={[artWidth + 0.2, 0.03, 0.15]} />
          <meshStandardMaterial 
            color={isModern ? '#2d2d2d' : '#8b7355'} 
            roughness={0.6}
          />
        </mesh>
      )}
    </group>
  )
}

// Ceiling light fixture
function CeilingLight({
  width,
  length,
  wallH,
  styleSliders
}: {
  width: number
  length: number
  wallH: number
  styleSliders?: StyleSliders
}) {
  const isMinimal = styleSliders ? styleSliders.Minimal > 0.5 : false
  const isModern = styleSliders ? styleSliders.Modern > 0.5 : false
  const isLuxury = styleSliders ? styleSliders.Luxury > 0.4 : false
  const isCozy = styleSliders ? styleSliders.Cozy > 0.5 : false

  const lightSize = isLuxury ? 0.5 : isModern ? 0.4 : 0.3
  const lightY = wallH - (isLuxury ? 0.15 : 0.1)

  return (
    <group position={[0, lightY, 0]}>
      {/* Light fixture base */}
      <mesh>
        <cylinderGeometry args={[lightSize * 0.8, lightSize, 0.05, isLuxury ? 8 : 6]} />
        <meshStandardMaterial 
          color={isLuxury ? '#c9a227' : isModern ? '#2d2d2d' : '#e0e0e0'} 
          metalness={isLuxury ? 0.6 : isModern ? 0.4 : 0.1}
          roughness={isLuxury ? 0.3 : 0.5}
        />
      </mesh>

      {/* Light bulb glow area */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[lightSize * 0.6, lightSize * 0.7, 0.08, isLuxury ? 8 : 6]} />
        <meshStandardMaterial 
          color="#fff8e7"
          emissive="#fff8e7"
          emissiveIntensity={isCozy ? 0.8 : 0.5}
          transparent
          opacity={0.9}
          roughness={0.3}
        />
      </mesh>

      {/* Chandelier arms for luxury */}
      {isLuxury && (
        <>
          <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.2} />
          </mesh>
        </>
      )}
    </group>
  )
}

// Decorative rug
function Rug({
  widthM,
  lengthM,
  color,
  styleSliders
}: {
  widthM: number
  lengthM: number
  color: string
  styleSliders?: StyleSliders
}) {
  const isMinimal = styleSliders ? styleSliders.Minimal > 0.5 : false
  const isModern = styleSliders ? styleSliders.Modern > 0.5 : false
  const isLuxury = styleSliders ? styleSliders.Luxury > 0.4 : false
  const isCozy = styleSliders ? styleSliders.Cozy > 0.5 : false

  // Skip or modify rug based on style
  if (isMinimal && !isCozy) return null

  const rugWidth = widthM * 0.7
  const rugLength = lengthM * 0.6
  const rugY = 0.01

  const borderColor = isLuxury ? '#c9a227' : isModern ? '#2d2d2d' : '#8b7355'

  return (
    <group position={[0, rugY, 0]}>
      {/* Main rug */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[rugWidth, rugLength]} />
        <meshStandardMaterial 
          color={color}
          roughness={isCozy ? 0.95 : 0.7}
        />
      </mesh>

      {/* Rug border for luxury/modern */}
      {(isLuxury || isModern) && (
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(rugWidth, rugLength) * 0.35, Math.min(rugWidth, rugLength) * 0.4, 4]} />
          <meshStandardMaterial 
            color={borderColor}
            roughness={0.5}
            metalness={isLuxury ? 0.3 : 0.1}
          />
        </mesh>
      )}

      {/* Pattern for cozy */}
      {isCozy && (
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[rugWidth * 0.8, rugLength * 0.8]} />
          <meshStandardMaterial 
            color={borderColor}
            roughness={0.9}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  )
}

// Decorative plant
function DecorativePlant({
  width,
  length,
  styleSliders
}: {
  width: number
  length: number
  styleSliders?: StyleSliders
}) {
  const isMinimal = styleSliders ? styleSliders.Minimal > 0.6 : false
  const isModern = styleSliders ? styleSliders.Modern > 0.5 : false

  // Skip for minimal
  if (isMinimal) return null

  const halfW = width / 2
  const halfL = length / 2

  // Position in corner
  const potX = halfW - 0.3
  const potZ = halfL - 0.3
  const potColor = isModern ? '#2d2d2d' : '#8b5a2b'
  const plantColor = '#2d5a27'

  return (
    <group position={[potX, 0, potZ]}>
      {/* Pot */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.3, 8]} />
        <meshStandardMaterial color={potColor} roughness={0.7} />
      </mesh>

      {/* Plant leaves */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color={plantColor} roughness={0.8} />
      </mesh>
      
      {/* Additional leaves */}
      <mesh position={[0.08, 0.35, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshStandardMaterial color={plantColor} roughness={0.8} />
      </mesh>
      <mesh position={[-0.06, 0.38, -0.04]} castShadow>
        <sphereGeometry args={[0.1, 6, 4]} />
        <meshStandardMaterial color="#3d7a37" roughness={0.8} />
      </mesh>
    </group>
  )
}

