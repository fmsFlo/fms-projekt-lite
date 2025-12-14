"use client"

import { useState, useEffect, useMemo } from 'react'
import PersonalitySelector from './PersonalitySelector'
import DominantView from './views/DominantView'
import InspiringView from './views/InspiringView'
import SteadyView from './views/SteadyView'
import ConscientiousView from './views/ConscientiousView'
import type { PersonalityType, RetirementData } from './types'

interface RetirementCalculatorProps {
  // Calculation results from the form
  calculationData: {
    gaps: {
      before: number
      after: number
      coveragePercent: number
    }
    statutory: {
      netFuture: number
    }
    privateExisting: {
      netFuture: number
    }
    requiredSavings: {
      monthlySavings: number
      netFuture: number
      netCurrent: number
    }
    targetPensionFuture?: number
    yearsToRetirement?: number
    yearsInRetirement?: number
    capitalNeeded?: number
    retirementAge?: number
    lifeExpectancy?: number
    inflationRate?: number
    returnRate?: number
  }
  onActionClick?: () => void
  showSelector?: boolean // Option to hide selector if needed
}

export default function RetirementCalculator({ 
  calculationData, 
  onActionClick,
  showSelector = true 
}: RetirementCalculatorProps) {
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityType>('C')

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('preferredPersonalityView') as PersonalityType | null
    if (saved && ['D', 'I', 'S', 'C'].includes(saved)) {
      setSelectedPersonality(saved)
    }
  }, [])

  // Transform calculation data to RetirementData format
  const retirementData: RetirementData = useMemo(() => {
    const currentCoverage = (calculationData.statutory?.netFuture || 0) + (calculationData.privateExisting?.netFuture || 0)
    const targetPension = calculationData.targetPensionFuture || 0
    const gap = calculationData.gaps?.before || 0

    return {
      currentCoverage,
      targetPension,
      gap,
      gapBefore: calculationData.gaps?.before || 0,
      gapAfter: calculationData.gaps?.after || 0,
      coveragePercentage: calculationData.gaps?.coveragePercent || 0,
      capitalNeeded: calculationData.capitalNeeded || 0,
      yearsInRetirement: calculationData.yearsInRetirement || 23,
      yearsToRetirement: calculationData.yearsToRetirement || 0,
      statutoryNetFuture: calculationData.statutory?.netFuture || 0,
      privateNetFuture: calculationData.privateExisting?.netFuture || 0,
      requiredMonthlySavings: calculationData.requiredSavings?.monthlySavings || 0,
      requiredNetFuture: calculationData.requiredSavings?.netFuture || 0,
      requiredNetCurrent: calculationData.requiredSavings?.netCurrent || 0,
      retirementAge: calculationData.retirementAge || 67,
      lifeExpectancy: calculationData.lifeExpectancy || 90,
      inflationRate: calculationData.inflationRate || 0.02,
      returnRate: calculationData.returnRate || 0.04,
    }
  }, [calculationData])

  const renderView = () => {
    switch (selectedPersonality) {
      case 'D':
        return <DominantView data={retirementData} onActionClick={onActionClick} />
      case 'I':
        return <InspiringView data={retirementData} onActionClick={onActionClick} />
      case 'S':
        return <SteadyView data={retirementData} onActionClick={onActionClick} />
      case 'C':
        return <ConscientiousView data={retirementData} onActionClick={onActionClick} />
      default:
        return <ConscientiousView data={retirementData} onActionClick={onActionClick} />
    }
  }

  return (
    <div className="w-full transition-all duration-300">
      {showSelector && (
        <div className="mb-6">
          <PersonalitySelector 
            selected={selectedPersonality} 
            onSelect={setSelectedPersonality} 
          />
        </div>
      )}
      
      <div 
        className="transition-opacity duration-300"
        style={{ opacity: 1 }}
      >
        {renderView()}
      </div>
    </div>
  )
}

