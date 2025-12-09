"use client"
export const runtime = "nodejs";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

export default function NewTemplatePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'Honorar Beratung',
    templateContent: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const value = e.target.value
    setForm({ ...form, [e.target.name]: value })
    
    // Auto-generate slug from name
    if (e.target.name === 'name' && !form.slug) {
      const slug = value
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setForm(prev => ({ ...prev, slug }))
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          category: form.category || 'Honorar Beratung',
          templateContent: form.templateContent,
          fields: []
        })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Fehler beim Erstellen')
      }
      
      const created = await res.json()
      router.replace(`/templates/${created.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
            Neues Template
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Erstellen Sie eine neue Vorlage für Verträge oder Schreiben
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
                placeholder="z.B. Beratungsprotokoll"
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
                placeholder="z.B. beratungsprotokoll"
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
              placeholder="Kurze Beschreibung des Templates"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Template-Inhalt (Handlebars) *
            </label>
            <textarea
              name="templateContent"
              value={form.templateContent}
              onChange={onChange}
              required
              rows={20}
              className="w-full px-4 py-2 rounded-md font-mono text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'monospace'
              }}
              placeholder="<h1>{{title}}</h1>&#10;<p>{{content}}</p>"
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
              disabled={loading}
              className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity gap-2 disabled:opacity-50"
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                backgroundColor: 'var(--color-primary)'
              }}
            >
              {loading ? 'Speichere…' : 'Erstellen'}
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

