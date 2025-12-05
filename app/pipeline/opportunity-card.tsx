"use client"

import { useState } from 'react'

type Opportunity = {
  id: string
  title: string
  description: string | null
  phaseId: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  } | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  company: string | null
  estimatedValue: number | null
  probability: number | null
  nextActionDate: string | null
  nextActionNote: string | null
  createdAt: string
  updatedAt: string
}

interface OpportunityCardProps {
  opportunity: Opportunity
  onDragStart: () => void
  onDelete: () => void
  onUpdate: () => void
}

export default function OpportunityCard({
  opportunity,
  onDragStart,
  onDelete,
  onUpdate,
}: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Bestimme Anzeigename
  const displayName = opportunity.client
    ? `${opportunity.client.firstName} ${opportunity.client.lastName}`
    : opportunity.firstName && opportunity.lastName
    ? `${opportunity.firstName} ${opportunity.lastName}`
    : opportunity.company || opportunity.title

  // Formatierte Werte
  const formattedValue = opportunity.estimatedValue
    ? new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(opportunity.estimatedValue)
    : null

  const formattedDate = opportunity.nextActionDate
    ? new Date(opportunity.nextActionDate).toLocaleDateString('de-DE')
    : null

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{opportunity.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{displayName}</p>
          
          {opportunity.company && (
            <p className="text-xs text-gray-500 mt-1">{opportunity.company}</p>
          )}
          
          {formattedValue && (
            <p className="text-xs font-semibold text-blue-600 mt-1">
              {formattedValue}
            </p>
          )}
          
          {opportunity.probability !== null && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${opportunity.probability}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {opportunity.probability}%
                </span>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
          title="Löschen"
        >
          ×
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t text-xs space-y-2">
          {opportunity.description && (
            <p className="text-gray-600">{opportunity.description}</p>
          )}
          
          {opportunity.email && (
            <p className="text-gray-500">
              📧 {opportunity.email}
            </p>
          )}
          
          {opportunity.phone && (
            <p className="text-gray-500">
              📞 {opportunity.phone}
            </p>
          )}
          
          {formattedDate && (
            <p className="text-gray-500">
              📅 Nächstes Follow-up: {formattedDate}
            </p>
          )}
          
          {opportunity.nextActionNote && (
            <p className="text-gray-500 italic">
              {opportunity.nextActionNote}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-gray-500 hover:text-gray-700 mt-2"
      >
        {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
      </button>
    </div>
  )
}



