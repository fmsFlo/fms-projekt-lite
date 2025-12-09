"use client"
export const runtime = "nodejs";

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

interface Template {
  id: string
  name: string
  slug: string
  category: string | null
  description: string | null
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [templateContent, setTemplateContent] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'Honorar Beratung'
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadTemplate() {
      try {
        const [templateRes, contentRes] = await Promise.all([
          fetch(`/api/templates/${id}`),
          fetch(`/api/templates/${id}/content`)
        ])

        if (!templateRes.ok) {
          throw new Error('Template nicht gefunden')
        }

        const templateData = await templateRes.json()
        setTemplate(templateData)
        setForm({
          name: templateData.name,
          slug: templateData.slug,
          description: templateData.description || '',
          category: templateData.category || 'Honorar Beratung'
        })

        if (contentRes.ok) {
          const content = await contentRes.text()
          setTemplateContent(content)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadTemplate()
    }
  }, [id])

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          category: form.category || 'Honorar Beratung',
          templateContent: templateContent
        })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Fehler beim Speichern')
      }
      
      router.push('/templates')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Lade Template...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error && !template) {
    return (
      <AuthGuard>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="p-4 rounded-md" style={{ backgroundColor: 'var(--color-error)', color: 'white' }}>
            {error}
          </div>
          <a
            href="/templates"
            className="mt-4 inline-block px-4 py-2 rounded-md"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)'
            }}
          >
            Zurück zu Templates
          </a>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
            Template bearbeiten
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            {template?.name}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Name *
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                required
                className="w-full px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Slug *
              </label>
              <input
                name="slug"
                type="text"
                value={form.slug}
                onChange={onChange}
                required
                pattern="^[a-z0-9-]+$"
                className="w-full px-4 py-2 rounded-md font-mono text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Nur Kleinbuchstaben, Zahlen und Bindestriche
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Kategorie
            </label>
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              className="w-full px-4 py-2 rounded-md"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="Honorar Beratung">Honorar Beratung</option>
              <option value="Vergütungsvereinbarung">Vergütungsvereinbarung</option>
              <option value="Beratungsprotokoll">Beratungsprotokoll</option>
              <option value="Sonstige">Sonstige</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Beschreibung
            </label>
            <input
              name="description"
              type="text"
              value={form.description}
              onChange={onChange}
              className="w-full px-4 py-2 rounded-md"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Template-Inhalt (Handlebars) *
            </label>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              required
              rows={20}
              className="w-full px-4 py-2 rounded-md font-mono text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'monospace'
              }}
            />
          </div>

          {error && (
            <div className="p-4 rounded-md" style={{ backgroundColor: 'var(--color-error)', color: 'white' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity gap-2 disabled:opacity-50"
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                backgroundColor: 'var(--color-primary)'
              }}
            >
              {saving ? 'Speichere…' : 'Speichern'}
            </button>
            <a
              href="/templates"
              className="inline-flex items-center justify-center hover:opacity-90 transition-opacity gap-2"
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)'
              }}
            >
              Abbrechen
            </a>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}

