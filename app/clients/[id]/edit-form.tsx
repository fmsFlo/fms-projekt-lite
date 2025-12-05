"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Client = {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  street?: string | null
  houseNumber?: string | null
  city?: string | null
  zip?: string | null
  iban?: string | null
  crmId?: string | null
  isCompany?: boolean
  companyName?: string | null
  birthDate?: Date | string | null
  profession?: string | null
  employmentStatus?: string | null
  salaryGrade?: string | null
  grvInsuranceStatus?: string | null
}

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  // Formatiere Geburtsdatum für Input
  const formatBirthDate = (date: Date | string | null | undefined): string => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    email: client.email || '',
    phone: client.phone || '',
    street: client.street || '',
    houseNumber: client.houseNumber || '',
    city: client.city || '',
    zip: client.zip || '',
    iban: client.iban || '',
    crmId: client.crmId || '',
    isCompany: client.isCompany || false,
    companyName: client.companyName || '',
    birthDate: formatBirthDate(client.birthDate),
    profession: client.profession || '',
    employmentStatus: client.employmentStatus || '',
    salaryGrade: client.salaryGrade || '',
    grvInsuranceStatus: client.grvInsuranceStatus || ''
  })

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.message || errorData.details || 'Speichern fehlgeschlagen')
      }
      
      setIsEditing(false)
      router.refresh()
      alert('✅ Kundendaten erfolgreich aktualisiert!')
    } catch (err: any) {
      console.error('Save Error:', err)
      alert(`❌ Fehler: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{client.firstName} {client.lastName}</h1>
            <div className="space-y-1 mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              {client.email && <p>📧 {client.email}</p>}
              {client.phone && <p>📞 {client.phone}</p>}
              {(client.street || client.city) && (
                <p>📍 {client.street} {client.houseNumber}, {client.zip} {client.city}</p>
              )}
              {client.iban && <p>🏦 {client.iban}</p>}
              {client.crmId && <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>CRM-ID: {client.crmId}</p>}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-medium)',
              backgroundColor: 'var(--color-primary)'
            }}
          >
            ✏️ Bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Kundendaten bearbeiten</h2>
      </div>

      <div className="rounded-lg p-4 space-y-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Vorname *</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-rgb, 0, 113, 227), 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              required={!form.isCompany}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nachname</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isCompany"
              checked={form.isCompany}
              onChange={(e) => setForm({ ...form, isCompany: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="isCompany" className="text-sm font-medium">
              Ist ein Unternehmen
            </label>
          </div>
          {form.isCompany && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Firmenname *</label>
              <input
                name="companyName"
                type="text"
                value={form.companyName}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          )}
          {!form.isCompany && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Geburtsdatum</label>
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beruf</label>
                <input
                  name="profession"
                  type="text"
                  value={form.profession}
                  onChange={onChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="z.B. Lehrer, Ingenieur..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  name="employmentStatus"
                  value={form.employmentStatus}
                  onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="angestellt">Angestellt</option>
                  <option value="beamter">Beamter</option>
                  <option value="selbständig">Selbständig</option>
                </select>
              </div>
              {form.employmentStatus === 'beamter' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Besoldungsstufe</label>
                  <input
                    name="salaryGrade"
                    type="text"
                    value={form.salaryGrade}
                    onChange={onChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="z.B. A13, A14..."
                  />
                </div>
              )}
              {form.employmentStatus === 'selbständig' && (
                <div>
                  <label className="block text-sm font-medium mb-1">GRV-Versicherung</label>
                  <select
                    name="grvInsuranceStatus"
                    value={form.grvInsuranceStatus}
                    onChange={(e) => setForm({ ...form, grvInsuranceStatus: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="freiwillig-pflicht">Freiwillig pflichtversichert</option>
                    <option value="nicht-versichert">Nicht versichert</option>
                  </select>
                </div>
              )}
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">E-Mail</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="+49 170 1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Straße</label>
            <input
              name="street"
              value={form.street}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Hauptstr."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hausnummer</label>
            <input
              name="houseNumber"
              value={form.houseNumber}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PLZ</label>
            <input
              name="zip"
              value={form.zip}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ort</label>
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Berlin"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">IBAN</label>
            <input
              name="iban"
              value={form.iban}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="DE12 3456 7890 1234 5678 90"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">CRM-ID</label>
            <input
              name="crmId"
              value={form.crmId}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="lead_abc123..."
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">CRM-ID kann nicht geändert werden</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onSave}
            disabled={saving || !form.firstName}
            className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--color-success)',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            {saving ? '💾 Speichere...' : '💾 Speichern'}
          </button>
          <button
            onClick={() => {
              setForm({
                firstName: client.firstName || '',
                lastName: client.lastName || '',
                email: client.email || '',
                phone: client.phone || '',
                street: client.street || '',
                houseNumber: client.houseNumber || '',
                city: client.city || '',
                zip: client.zip || '',
                iban: client.iban || '',
                crmId: client.crmId || '',
                isCompany: client.isCompany || false,
                companyName: client.companyName || '',
                birthDate: formatBirthDate(client.birthDate),
                profession: client.profession || '',
                employmentStatus: client.employmentStatus || '',
                salaryGrade: client.salaryGrade || '',
                grvInsuranceStatus: client.grvInsuranceStatus || ''
              })
              setIsEditing(false)
            }}
            className="px-4 py-2 rounded border hover:opacity-90 transition-opacity"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}


