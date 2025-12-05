"use client"

import { useState } from 'react'
import CreateLeadModal from './create-lead-modal'

type Lead = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  company: string | null
  phaseId: string
  phase: {
    id: string
    name: string
    color: string | null
  }
  client: {
    id: string
    firstName: string
    lastName: string
  } | null
  source: string | null
  notes: string | null
  nextActionDate: string | null
  nextActionNote: string | null
  createdAt: string
}

interface LeadsListProps {
  initialLeads: Lead[]
  phases: Array<{ id: string; name: string; color: string | null }>
}

export default function LeadsList({ initialLeads, phases }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const refreshLeads = async () => {
    try {
      const res = await fetch('/api/leads')
      const data = await res.json()
      setLeads(data)
    } catch (err) {
      console.error('Fehler beim Laden der Leads:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Lead wirklich löschen?')) {
      return
    }
    
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Fehler beim Löschen')
      }
      
      await refreshLeads()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase()
    const name = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase()
    const email = (lead.email || '').toLowerCase()
    const company = (lead.company || '').toLowerCase()
    const phone = (lead.phone || '').toLowerCase()
    
    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      company.includes(searchLower) ||
      phone.includes(searchLower)
    )
  })

  const displayName = (lead: Lead) => {
    if (lead.firstName || lead.lastName) {
      return `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
    }
    if (lead.company) {
      return lead.company
    }
    return 'Unbenannt'
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
            {filteredLeads.length} {filteredLeads.length === 1 ? 'Element' : 'Elemente'}
          </span>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Neuer Lead
        </button>
      </div>

      <div className="border rounded bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Name
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                E-Mail
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Telefon
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Firma
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Phase
              </th>
              <th className="text-left p-3 text-sm font-medium text-gray-700">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <a 
                    href={`/leads/${lead.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {displayName(lead)}
                  </a>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {lead.email || '-'}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {lead.phone || '-'}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {lead.company || '-'}
                </td>
                <td className="p-3">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: lead.phase.color ? `${lead.phase.color}20` : '#F3F4F6',
                      color: lead.phase.color || '#374151',
                    }}
                  >
                    {lead.phase.name}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  {searchTerm ? 'Keine Leads gefunden' : 'Noch keine Leads vorhanden'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <CreateLeadModal
          phases={phases}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            refreshLeads()
          }}
        />
      )}
    </div>
  )
}

