"use client"
export const runtime = "nodejs";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  name: string
  slug: string
  category: string | null
  description: string | null
}

interface TemplatesListProps {
  initialTemplates: Template[]
}

export default function TemplatesList({ initialTemplates }: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function getUserRole() {
      try {
        const response = await fetch('/api/user')
        if (!response.ok) {
          router.push('/login')
          return
        }
        const user = await response.json()
        if (!user) return
        setUserRole(user.role === 'admin' ? 'admin' : 'advisor')
      } catch (error) {
        console.error('Error getting user role:', error)
      }
    }
    getUserRole()
  }, [router])

  const refreshTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie das Template "${name}" wirklich löschen?`)) {
      return
    }

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await refreshTemplates()
      } else {
        const error = await res.json()
        alert(error.message || 'Fehler beim Löschen')
      }
    } catch (err) {
      console.error('Fehler beim Löschen:', err)
      alert('Fehler beim Löschen des Templates')
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/templates/${id}`)
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Sonstige'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, Template[]>)

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Lade Templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {userRole === 'admin' && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/templates/new')}
            className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity gap-2"
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-medium)',
              backgroundColor: 'var(--color-primary)'
            }}
          >
            + Neues Template
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-12 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Noch keine Templates vorhanden
          </p>
          {userRole === 'admin' && (
            <button
              onClick={() => router.push('/templates/new')}
              className="mt-4 inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity gap-2"
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                backgroundColor: 'var(--color-primary)'
              }}
            >
              + Erstes Template erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-lg p-4 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                          {template.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(template.id)}
                        className="px-3 py-1.5 text-sm rounded-md hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        Bearbeiten
                      </button>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDelete(template.id, template.name)}
                          className="px-3 py-1.5 text-sm rounded-md hover:opacity-90 transition-opacity"
                          style={{
                            backgroundColor: 'var(--color-error)',
                            color: 'white'
                          }}
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

