// Shared types for retirement calculator views
export interface RetirementData {
  // Current coverage
  currentCoverage: number // Gesetzliche + private Vorsorge (netto, zukünftig)
  
  // Target
  targetPension: number // Zielrente (netto, zukünftig)
  
  // Gap
  gap: number // Rentenlücke (netto, zukünftig)
  gapBefore: number // Lücke vor Umsetzung
  gapAfter: number // Lücke nach Umsetzung
  
  // Coverage
  coveragePercentage: number // Deckungsgrad in Prozent (z.B. 62.5)
  
  // Capital needed
  capitalNeeded: number // Kapitalbedarf für Ruhestand
  
  // Time
  yearsInRetirement: number // Jahre im Ruhestand
  yearsToRetirement: number // Jahre bis zur Rente
  
  // Breakdown
  statutoryNetFuture: number // Gesetzliche Rente (netto, zukünftig)
  privateNetFuture: number // Private Vorsorge (netto, zukünftig)
  
  // Required savings
  requiredMonthlySavings: number // Erforderliche monatliche Sparrate
  requiredNetFuture: number // Nettorente aus Sparrate (zukünftig)
  requiredNetCurrent: number // Nettorente aus Sparrate (aktuell)
  
  // Additional info
  retirementAge: number
  lifeExpectancy: number
  inflationRate: number
  returnRate: number
}

export type PersonalityType = 'D' | 'I' | 'S' | 'C'

export interface PersonalityConfig {
  type: PersonalityType
  name: string
  color: string
  icon: string
  label: string
}

