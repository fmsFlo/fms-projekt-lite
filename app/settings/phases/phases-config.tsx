"use client"

import { useState } from 'react'

type PipelinePhase = {
  id: string
  name: string
  slug: string
  order: number
  color: string | null
  type: string
  description: string | null
  probability: number | null
  status: string | null
  isDefault: boolean
  isConverted: boolean
  isActive: boolean
}

interface PhasesConfigProps {
  initialLeadPhases: PipelinePhase[]
  initialOpportunityPhases: PipelinePhase[]
}

export default function PhasesConfig({ 
  initialLeadPhases, 
  initialOpportunityPhases 
}: PhasesConfigProps) {
  const [leadPhases, setLeadPhases] = useState<PipelinePhase[]>(initialLeadPhases)
  const [opportunityPhases, setOpportunityPhases] = useState<PipelinePhase[]>(initialOpportunityPhases)
  const [editingPhase, setEditingPhase] = useState<PipelinePhase | null>(null)
  const [isAddingPhase, setIsAddingPhase] = useState<'lead' | 'opportunity' | null>(null)

  const refreshPhases = async () => {
    try {
      const res = await fetch('/api/pipeline/phases')
      const phases = await res.json()
      const leads = phases.filter((p: PipelinePhase) => p.type === 'lead')
      const opps = phases.filter((p: PipelinePhase) => p.type === 'opportunity')
      setLeadPhases(leads)
      setOpportunityPhases(opps)
    } catch (err) {
      console.error('Fehler beim Laden der Phasen:', err)
    }
  }

  const handleSavePhase = async (phase: Partial<PipelinePhase>) => {
    try {
      const url = editingPhase 
        ? `/api/pipeline/phases/${editingPhase.id}`
        : '/api/pipeline/phases'
      
      const method = editingPhase ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phase),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Speichern')
      }
      
      await refreshPhases()
      setEditingPhase(null)
      setIsAddingPhase(null)
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
    }
  }

  const handleDeletePhase = async (id: string) => {
    if (!confirm('Möchten Sie diese Phase wirklich löschen?')) {
      return
    }
    
    try {
      const res = await fetch(`/api/pipeline/phases/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Fehler beim Löschen')
      }
      
      await refreshPhases()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
    }
  }

  const handleSetDefault = async (phase: PipelinePhase) => {
    await handleSavePhase({
      ...phase,
      isDefault: true,
    })
  }

  return (
    <div className="space-y-8">
      {/* Lead Status */}
      <section className="border rounded p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Leadstatus</h2>
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs cursor-help">
              i
            </div>
          </div>
          <button
            onClick={() => setIsAddingPhase('lead')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Hinzufügen
          </button>
        </div>

        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-700 w-12"></th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Statusname</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Standard</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Konvertiert</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {leadPhases.map((phase) => (
                <tr key={phase.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="cursor-move">⋮⋮</div>
                  </td>
                  <td className="p-3">
                    {editingPhase?.id === phase.id ? (
                      <input
                        type="text"
                        value={editingPhase.name}
                        onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{phase.name}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="radio"
                      name="lead-default"
                      checked={phase.isDefault}
                      onChange={() => handleSetDefault(phase)}
                      disabled={!!editingPhase}
                    />
                  </td>
                  <td className="p-3">
                    {editingPhase?.id === phase.id ? (
                      <input
                        type="checkbox"
                        checked={editingPhase.isConverted}
                        onChange={(e) => setEditingPhase({ ...editingPhase, isConverted: e.target.checked })}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={phase.isConverted}
                        disabled={!!editingPhase}
                        readOnly
                      />
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {editingPhase?.id === phase.id ? (
                        <>
                          <button
                            onClick={() => handleSavePhase(editingPhase)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            title="Speichern"
                          >
                            ✓ Speichern
                          </button>
                          <button
                            onClick={() => setEditingPhase(null)}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            title="Abbrechen"
                          >
                            ✕ Abbrechen
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingPhase(phase)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            title="Bearbeiten"
                          >
                            ✎ Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeletePhase(phase.id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            title="Löschen"
                          >
                            🗑 Löschen
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Opportunity Phases */}
      <section className="border rounded p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Opportunity-Phasen</h2>
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs cursor-help">
              i
            </div>
          </div>
          <button
            onClick={() => setIsAddingPhase('opportunity')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Hinzufügen
          </button>
        </div>

        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-700 w-12"></th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Phasenname</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Beschreibung</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Wahrscheinlichkeit</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {opportunityPhases.map((phase) => (
                <tr key={phase.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="cursor-move">⋮⋮</div>
                  </td>
                  <td className="p-3">
                    {editingPhase?.id === phase.id ? (
                      <input
                        type="text"
                        value={editingPhase.name}
                        onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{phase.name}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingPhase?.id === phase.id ? (
                      <input
                        type="text"
                        value={editingPhase.description || ''}
                        onChange={(e) => setEditingPhase({ ...editingPhase, description: e.target.value })}
                        className="border rounded px-2 py-1 w-full text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">
                        {phase.description || '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingPhase?.id === phase.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingPhase({ ...editingPhase, status: 'open' })}
                          className={`px-2 py-1 text-xs rounded ${
                            editingPhase.status === 'open' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          Offen
                        </button>
                        <button
                          onClick={() => setEditingPhase({ ...editingPhase, status: 'won' })}
                          className={`px-2 py-1 text-xs rounded ${
                            editingPhase.status === 'won' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          Gewonnen
                        </button>
                        <button
                          onClick={() => setEditingPhase({ ...editingPhase, status: 'lost' })}
                          className={`px-2 py-1 text-xs rounded ${
                            editingPhase.status === 'lost' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          Verloren
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          disabled
                          className={`px-2 py-1 text-xs rounded ${
                            phase.status === 'open' 
                              ? 'bg-blue-600 text-white' 
                              : phase.status === 'won'
                              ? 'bg-green-600 text-white'
                              : phase.status === 'lost'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {phase.status === 'open' ? 'Offen' : phase.status === 'won' ? 'Gewonnen' : phase.status === 'lost' ? 'Verloren' : '-'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {editingPhase?.id === phase.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingPhase.probability || 0}
                          onChange={(e) => setEditingPhase({ ...editingPhase, probability: parseInt(e.target.value) || 0 })}
                          className="border rounded px-2 py-1 w-16 text-sm"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {phase.probability || 0}%
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {editingPhase?.id === phase.id ? (
                        <>
                          <button
                            onClick={() => handleSavePhase(editingPhase)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            title="Speichern"
                          >
                            ✓ Speichern
                          </button>
                          <button
                            onClick={() => setEditingPhase(null)}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            title="Abbrechen"
                          >
                            ✕ Abbrechen
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingPhase(phase)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            title="Bearbeiten"
                          >
                            ✎ Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeletePhase(phase.id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            title="Löschen"
                          >
                            🗑 Löschen
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Phase Modal */}
      {isAddingPhase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Neue {isAddingPhase === 'lead' ? 'Lead' : 'Opportunity'}-Phase
              </h2>
              <button
                onClick={() => setIsAddingPhase(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <NewPhaseForm
              type={isAddingPhase}
              onSave={(phase) => {
                handleSavePhase(phase)
                setIsAddingPhase(null)
              }}
              onCancel={() => setIsAddingPhase(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function NewPhaseForm({ 
  type, 
  onSave, 
  onCancel 
}: { 
  type: 'lead' | 'opportunity'
  onSave: (phase: Partial<PipelinePhase>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    probability: type === 'opportunity' ? '0' : '',
    status: type === 'opportunity' ? 'open' : '',
    color: '#3B82F6',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')
    
    onSave({
      name: formData.name,
      slug: slug,
      type: type,
      description: formData.description || null,
      probability: formData.probability ? parseInt(formData.probability) : null,
      status: formData.status || null,
      color: formData.color,
      order: type === 'lead' ? 0 : 0,
      isDefault: false,
      isConverted: false,
      isActive: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Phasenname *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      {type === 'opportunity' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="open">Offen</option>
              <option value="won">Gewonnen</option>
              <option value="lost">Verloren</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Wahrscheinlichkeit (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Erstellen
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}

