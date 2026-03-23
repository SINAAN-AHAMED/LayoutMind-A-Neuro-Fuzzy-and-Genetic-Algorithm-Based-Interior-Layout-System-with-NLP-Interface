export type RoomType = 'Bedroom' | 'Living Room'
export type StyleChip = 'Cozy' | 'Minimal' | 'Modern' | 'Luxury' | 'Compact'
export type FurnitureType = 'sofa' | 'bed' | 'table' | 'chair' | 'wardrobe' | 'tvUnit'

export type Metrics = {
  totalCostINR: number
  budgetINR: number
  budgetCompliancePct: number
  spaceUtilizationPct: number
  styleAlignmentPct: number
  clearanceScorePct: number
  comfortIndexPct: number
  fitness: number
}

export type EvolutionPoint = { generation: number; bestFitness: number; avgFitness: number }

export type FurnitureItem = {
  id: string
  type: FurnitureType
  x: number
  z: number
  y: number
  rotationY: number
  scale: number
  costINR: number
}

export type LayoutSolution = {
  id: string
  rank: 1 | 2 | 3
  room: { lengthM: number; widthM: number; type: RoomType }
  prompt: string
  selectedStyles: StyleChip[]
  items: FurnitureItem[]
  metrics: Metrics
  explanation: string
}

export type OptimizationResult = {
  requestId: string
  generatedAtISO: string
  evolution: EvolutionPoint[]
  solutions: LayoutSolution[]
}

