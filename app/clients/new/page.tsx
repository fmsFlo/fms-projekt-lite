"use client"
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
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold mb-4">Neuer Client</h1>
        <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Vorname</label>
            <input name="firstName" value={form.firstName} onChange={onChange} required={!form.isCompany} />
          </div>
          <div>
            <label className="block text-sm mb-1">Nachname</label>
            <input name="lastName" value={form.lastName} onChange={onChange} required={!form.isCompany} />
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
            <label className="block text-sm mb-1">Firmenname *</label>
            <input
              name="companyName"
              type="text"
              value={form.companyName}
              onChange={onChange}
              required
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">E-Mail</label>
            <input name="email" type="email" value={form.email} onChange={onChange} />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefon</label>
            <input name="phone" value={form.phone} onChange={onChange} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Straße</label>
            <input name="street" value={form.street} onChange={onChange} />
          </div>
          <div>
            <label className="block text-sm mb-1">Nr.</label>
            <input name="houseNumber" value={form.houseNumber} onChange={onChange} />
          </div>
          <div>
            <label className="block text-sm mb-1">PLZ</label>
            <input name="zip" value={form.zip} onChange={onChange} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Stadt</label>
            <input name="city" value={form.city} onChange={onChange} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">IBAN</label>
          <input name="iban" value={form.iban} onChange={onChange} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button disabled={loading} type="submit">{loading ? 'Speichere…' : 'Speichern'}</button>
          <a className="px-3 py-2 rounded border" href="/clients">Abbrechen</a>
        </div>
      </form>
      </div>
    </AuthGuard>
  )
}

