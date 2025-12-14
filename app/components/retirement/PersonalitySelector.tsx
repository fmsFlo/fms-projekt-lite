"use client"

import { useEffect, useState } from 'react'
import { Target, Heart, Shield, Calculator } from 'lucide-react'
import type { PersonalityType } from './types'

const PERSONALITY_CONFIGS = [
  {
    type: 'D' as PersonalityType,
    name: 'Ergebnis-orientiert',
    color: '#DC2626', // red-600
    icon: 'target',
    label: 'Rot'
  },
  {
    type: 'I' as PersonalityType,
    name: 'Visuell & Emotional',
    color: '#F59E0B', // amber-500
    icon: 'heart',
    label: 'Gelb'
  },
  {
    type: 'S' as PersonalityType,
    name: 'Sicherheit & Stabilität',
    color: '#10B981', // emerald-500
    icon: 'shield',
    label: 'Grün'
  },
  {
    type: 'C' as PersonalityType,
    name: 'Detailliert & Präzise',
    color: '#3B82F6', // blue-500
    icon: 'calculator',
    label: 'Blau'
  }
]

interface PersonalitySelectorProps {
  selected: PersonalityType
  onSelect: (type: PersonalityType) => void
}

export default function PersonalitySelector({ selected, onSelect }: PersonalitySelectorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load from localStorage
    const saved = localStorage.getItem('preferredPersonalityView') as PersonalityType | null
    if (saved && ['D', 'I', 'S', 'C'].includes(saved)) {
      onSelect(saved)
    }
  }, [onSelect])

  const handleSelect = (type: PersonalityType) => {
    onSelect(type)
    localStorage.setItem('preferredPersonalityView', type)
  }

  if (!mounted) {
    return null
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'target':
        return <Target size={18} />
      case 'heart':
        return <Heart size={18} />
      case 'shield':
        return <Shield size={18} />
      case 'calculator':
        return <Calculator size={18} />
      default:
        return null
    }
  }

  return (
    <div className="w-full mb-6">
      <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
        {PERSONALITY_CONFIGS.map((config) => {
          const isSelected = selected === config.type
          return (
            <button
              key={config.type}
              onClick={() => handleSelect(config.type)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                transition-all duration-200
                ${isSelected ? 'shadow-md scale-105' : 'shadow-sm hover:shadow-md'}
              `}
              style={{
                backgroundColor: isSelected ? config.color : 'var(--color-bg-secondary)',
                color: isSelected ? 'white' : 'var(--color-text-primary)',
                border: `2px solid ${isSelected ? config.color : 'var(--color-border)'}`,
              }}
              aria-label={`${config.name} Ansicht wählen`}
            >
              <div style={{ color: isSelected ? 'white' : config.color }}>
                {getIcon(config.icon)}
              </div>
              <span className="hidden sm:inline">{config.name}</span>
              <span className="sm:hidden">{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

