"use client"

import { useState } from 'react'

type PipelinePhase = {
  id: string
  name: string
  slug: string
  order: number
  color: string | null
}

interface CreateOpportunityModalProps {
  phases: PipelinePhase[]
  onClose: () => void
  onSuccess: () => void
}

export default function CreateOpportunityModal({
  phases,
  onClose,
  onSuccess,
}: CreateOpportunityModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phaseId: phases[0]?.id || '',
    clientId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    estimatedValue: '',
    probability: '',
    nextActionDate: '',
    nextActionNote: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        phaseId: formData.phaseId,
        estimatedValue: formData.estimatedValue
          ? parseFloat(formData.estimatedValue)
          : null,
        probability: formData.probability
          ? parseInt(formData.probability)
          : null,
        nextActionDate: formData.nextActionDate || null,
        nextActionNote: formData.nextActionNote || null,
      }

      // Wenn clientId vorhanden, verwende das; sonst einzelne Felder
      if (formData.clientId) {
        payload.clientId = formData.clientId
      } else {
        payload.firstName = formData.firstName || null
        payload.lastName = formData.lastName || null
        payload.email = formData.email || null
        payload.phone = formData.phone || null
        payload.company = formData.company || null
      }

      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler beim Erstellen')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Neue Opportunity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phase *
            </label>
            <select
              value={formData.phaseId}
              onChange={(e) =>
                setFormData({ ...formData, phaseId: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              required
            >
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Vorname
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                disabled={!!formData.clientId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nachname
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                disabled={!!formData.clientId}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              disabled={!!formData.clientId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              disabled={!!formData.clientId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Firma
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Geschätzter Wert (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimatedValue}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedValue: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Wahrscheinlichkeit (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) =>
                  setFormData({ ...formData, probability: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nächstes Follow-up Datum
            </label>
            <input
              type="date"
              value={formData.nextActionDate}
              onChange={(e) =>
                setFormData({ ...formData, nextActionDate: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Follow-up Notiz
            </label>
            <textarea
              value={formData.nextActionNote}
              onChange={(e) =>
                setFormData({ ...formData, nextActionNote: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Erstelle...' : 'Erstellen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



