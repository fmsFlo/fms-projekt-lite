"use client"
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', street: '', houseNumber: '', city: '', zip: '', iban: '',
    isCompany: false, companyName: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Fehler beim Anlegen')
      }
      const created = await res.json()
      router.replace(`/clients/${created.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Neuer Client</h1>
        <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Vorname</label>
            <input 
              name="firstName" 
              value={form.firstName} 
              onChange={onChange} 
              required={!form.isCompany}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nachname</label>
            <input 
              name="lastName" 
              value={form.lastName} 
              onChange={onChange} 
              required={!form.isCompany}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isCompany"
            checked={form.isCompany}
            onChange={(e) => setForm({ ...form, isCompany: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="isCompany" className="text-sm">
            Ist ein Unternehmen
          </label>
        </div>
        {form.isCompany && (
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Firmenname *</label>
            <input
              name="companyName"
              type="text"
              value={form.companyName}
              onChange={onChange}
              required
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>E-Mail</label>
            <input 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={onChange}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Telefon</label>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={onChange}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Straße</label>
            <input 
              name="street" 
              value={form.street} 
              onChange={onChange}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nr.</label>
            <input 
              name="houseNumber" 
              value={form.houseNumber} 
              onChange={onChange}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>PLZ</label>
            <input 
              name="zip" 
              value={form.zip} 
              onChange={onChange}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Stadt</label>
            <input 
              name="city" 
              value={form.city} 
              onChange={onChange}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>IBAN</label>
          <input 
            name="iban" 
            value={form.iban} 
            onChange={onChange}
            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--color-error)' }}>
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button 
            disabled={loading} 
            type="submit"
            className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
          >
            {loading ? 'Speichere…' : 'Speichern'}
          </button>
          <a 
            className="px-4 py-2 rounded-lg border hover:opacity-80 transition-opacity font-medium text-sm"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            href="/clients"
          >
            Abbrechen
          </a>
        </div>
      </form>
      </div>
    </AuthGuard>
  )
}

