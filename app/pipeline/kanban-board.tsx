"use client"

import { useState, useEffect } from 'react'
import CreateOpportunityModal from './create-opportunity-modal'
import OpportunityCard from './opportunity-card'

type PipelinePhase = {
  id: string
  name: string
  slug: string
  order: number
  color: string | null
  isActive: boolean
}

type Opportunity = {
  id: string
  title: string
  description: string | null
  phaseId: string
  phase: PipelinePhase
  clientId: string | null
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

interface KanbanBoardProps {
  initialPhases: PipelinePhase[]
  initialOpportunities: Opportunity[]
}

export default function KanbanBoard({ initialPhases, initialOpportunities }: KanbanBoardProps) {
  const [phases, setPhases] = useState<PipelinePhase[]>(initialPhases)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null)
  const [targetPhase, setTargetPhase] = useState<string | null>(null)

  // Lade Daten neu wenn nötig
  const refreshData = async () => {
    try {
      const [phasesRes, oppsRes] = await Promise.all([
        fetch('/api/pipeline/phases'),
        fetch('/api/opportunities'),
      ])
      const phasesData = await phasesRes.json()
      const oppsData = await oppsRes.json()
      setPhases(phasesData)
      setOpportunities(oppsData)
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err)
    }
  }

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diese Opportunity wirklich löschen?')) {
      return
    }
    
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Fehler beim Löschen')
      }
      
      await refreshData()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
    }
  }

  // Drag & Drop Handlers
  const handleDragStart = (opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity)
  }

  const handleDragOver = (e: React.DragEvent, phaseId: string) => {
    e.preventDefault()
    setTargetPhase(phaseId)
  }

  const handleDragLeave = () => {
    setTargetPhase(null)
  }

  const handleDrop = async (e: React.DragEvent, targetPhaseId: string) => {
    e.preventDefault()
    setTargetPhase(null)
    
    if (!draggedOpportunity || draggedOpportunity.phaseId === targetPhaseId) {
      setDraggedOpportunity(null)
      return
    }
    
    try {
      const res = await fetch(`/api/opportunities/${draggedOpportunity.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId: targetPhaseId }),
      })
      
      if (!res.ok) {
        throw new Error('Fehler beim Verschieben')
      }
      
      await refreshData()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
    } finally {
      setDraggedOpportunity(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Ziehen Sie Opportunities zwischen den Spalten, um sie zu verschieben
        </p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Neue Opportunity
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {phases.map((phase) => {
          const phaseOpportunities = opportunities.filter(
            (opp) => opp.phaseId === phase.id
          )
          
          return (
            <div
              key={phase.id}
              className={`flex-shrink-0 w-80 border rounded-lg p-4 ${
                targetPhase === phase.id ? 'bg-blue-50 border-blue-400' : 'bg-white'
              }`}
              onDragOver={(e) => handleDragOver(e, phase.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, phase.id)}
            >
              {/* Spalten-Header */}
              <div
                className="flex items-center justify-between mb-4 pb-2 border-b"
                style={{ borderColor: phase.color || '#E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: phase.color || '#94A3B8' }}
                  />
                  <h3 className="font-semibold">{phase.name}</h3>
                  <span className="text-sm text-gray-500">
                    ({phaseOpportunities.length})
                  </span>
                </div>
              </div>

              {/* Opportunities in dieser Spalte */}
              <div className="space-y-3 min-h-[400px]">
                {phaseOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onDragStart={() => handleDragStart(opp)}
                    onDelete={() => handleDelete(opp.id)}
                    onUpdate={refreshData}
                  />
                ))}
                
                {phaseOpportunities.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-8">
                    Keine Opportunities
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateOpportunityModal
          phases={phases}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            refreshData()
          }}
        />
      )}
    </div>
  )
}



