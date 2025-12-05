"use client"

import { useState } from 'react'
import CreateOpportunityModal from '../pipeline/create-opportunity-modal'

type Opportunity = {
  id: string
  title: string
  description: string | null
  phaseId: string
  phase: {
    id: string
    name: string
    color: string | null
    probability: number | null
  }
  client: {
    id: string
    firstName: string
    lastName: string
  } | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  company: string | null
  estimatedValue: number | null
  probability: number | null
  nextActionDate: string | null
  createdAt: string
}

interface OpportunitiesListProps {
  initialOpportunities: Opportunity[]
  phases: Array<{ 
    id: string
    name: string
    color: string | null
    probability: number | null
  }>
}

export default function OpportunitiesList({ initialOpportunities, phases }: OpportunitiesListProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const refreshOpportunities = async () => {
    try {
      const res = await fetch('/api/opportunities')
      const data = await res.json()
      setOpportunities(data)
    } catch (err) {
      console.error('Fehler beim Laden der Opportunities:', err)
    }
  }

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
      
      await refreshOpportunities()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    const searchLower = searchTerm.toLowerCase()
    const title = (opp.title || '').toLowerCase()
    const name = `${opp.firstName || ''} ${opp.lastName || ''}`.toLowerCase()
    const clientName = opp.client ? `${opp.client.firstName} ${opp.client.lastName}`.toLowerCase() : ''
    const company = (opp.company || '').toLowerCase()
    
    return (
      title.includes(searchLower) ||
      name.includes(searchLower) ||
      clientName.includes(searchLower) ||
      company.includes(searchLower)
    )
  })

  const displayName = (opp: Opportunity) => {
    if (opp.client) {
      return `${opp.client.firstName} ${opp.client.lastName}`
    }
    if (opp.firstName || opp.lastName) {
      return `${opp.firstName || ''} ${opp.lastName || ''}`.trim()
    }
    if (opp.company) {
      return opp.company
    }
    return '-'
  }

  const getProbability = (opp: Opportunity) => {
    return opp.probability !== null 
      ? opp.probability 
      : opp.phase.probability || 0
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Diese Liste durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md border rounded px-3 py-2"
          />
          <span className="text-sm text-gray-600">
            {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'Element' : 'Elemente'}
          </span>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Neue Opportunity
        </button>
      </div>

      <div className="border rounded bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Opportunity-Name
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Accountname
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Phase
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Wahrscheinlichkeit
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Geschätzter Wert
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Nächstes Follow-up
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOpportunities.map((opp) => (
              <tr key={opp.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <a 
                    href={`/opportunities/${opp.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {opp.title}
                  </a>
                </td>
                <td className="p-3">
                  <a 
                    href={opp.client ? `/clients/${opp.client.id}` : '#'}
                    className={opp.client ? "text-blue-600 hover:underline" : "text-gray-600"}
                  >
                    {displayName(opp)}
                  </a>
                </td>
                <td className="p-3">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: opp.phase.color ? `${opp.phase.color}20` : '#F3F4F6',
                      color: opp.phase.color || '#374151',
                    }}
                  >
                    {opp.phase.name}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${getProbability(opp)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {getProbability(opp)}%
                    </span>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {formatCurrency(opp.estimatedValue)}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {formatDate(opp.nextActionDate)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(opp.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
            {filteredOpportunities.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  {searchTerm ? 'Keine Opportunities gefunden' : 'Noch keine Opportunities vorhanden'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <CreateOpportunityModal
          phases={phases}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            refreshOpportunities()
          }}
        />
      )}
    </div>
  )
}

