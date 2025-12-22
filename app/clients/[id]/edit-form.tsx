"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useFormDraft } from '@/app/hooks/useFormDraft'

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
  targetPensionNetto?: number | null
  desiredRetirementAge?: number | null
  monthlySavings?: number | null
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

  const { watch, formState: { isDirty }, reset, register, handleSubmit } = useForm({
    defaultValues: {
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
    }
  })

  const watchedValues = watch()

  // Hook einbinden
  const { clearDraft } = useFormDraft(
    `customer_${client.id}`, 
    watchedValues, 
    isDirty
  )

  const onSave = async (data: typeof watchedValues) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.message || errorData.details || 'Speichern fehlgeschlagen')
      }
      
      clearDraft() // WICHTIG: Draft löschen
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold break-words" style={{ color: 'var(--color-text-primary)' }}>
              {client.firstName} {client.lastName}
            </h1>
            <div className="space-y-1 mt-2 text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              {client.email && <p className="break-all">📧 {client.email}</p>}
              {client.phone && <p className="break-all">📞 {client.phone}</p>}
              {(client.street || client.city) && (
                <p className="break-words">📍 {client.street} {client.houseNumber}, {client.zip} {client.city}</p>
              )}
              {client.iban && <p className="break-all">🏦 {client.iban}</p>}
              {client.crmId && <p className="text-xs md:text-sm break-all" style={{ color: 'var(--color-text-tertiary)' }}>CRM-ID: {client.crmId}</p>}
              {(client.targetPensionNetto || client.desiredRetirementAge || client.monthlySavings) && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Rentenkonzept-Werte:</p>
                  {client.targetPensionNetto && <p className="text-xs">💰 Wunschrente: {client.targetPensionNetto.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}/mtl.</p>}
                  {client.desiredRetirementAge && <p className="text-xs">🎯 Rentenalter: {client.desiredRetirementAge} Jahre</p>}
                  {client.monthlySavings && <p className="text-xs">💵 Sparbetrag: {client.monthlySavings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}/mtl.</p>}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity w-full md:w-auto shrink-0"
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

      <form onSubmit={handleSubmit(onSave)} className="rounded-lg p-3 md:p-4 space-y-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Vorname *</label>
            <input
              {...register('firstName')}
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
              required={!watchedValues.isCompany}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nachname</label>
            <input
              {...register('lastName')}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isCompany"
              {...register('isCompany')}
              className="h-4 w-4"
            />
            <label htmlFor="isCompany" className="text-sm font-medium">
              Ist ein Unternehmen
            </label>
          </div>
          {watchedValues.isCompany && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Firmenname *</label>
              <input
                {...register('companyName')}
                type="text"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          )}
          {!watchedValues.isCompany && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Geburtsdatum</label>
                <input
                  type="date"
                  {...register('birthDate')}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beruf</label>
                <input
                  {...register('profession')}
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="z.B. Lehrer, Ingenieur..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  {...register('employmentStatus')}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="angestellt">Angestellt</option>
                  <option value="beamter">Beamter</option>
                  <option value="selbständig">Selbständig</option>
                </select>
              </div>
              {watchedValues.employmentStatus === 'beamter' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Besoldungsstufe</label>
                  <input
                    {...register('salaryGrade')}
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="z.B. A13, A14..."
                  />
                </div>
              )}
              {watchedValues.employmentStatus === 'selbständig' && (
                <div>
                  <label className="block text-sm font-medium mb-1">GRV-Versicherung</label>
                  <select
                    {...register('grvInsuranceStatus')}
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
              {...register('email')}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input
              {...register('phone')}
              className="w-full border rounded px-3 py-2"
              placeholder="+49 170 1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Straße</label>
            <input
              {...register('street')}
              className="w-full border rounded px-3 py-2"
              placeholder="Hauptstr."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hausnummer</label>
            <input
              {...register('houseNumber')}
              className="w-full border rounded px-3 py-2"
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PLZ</label>
            <input
              {...register('zip')}
              className="w-full border rounded px-3 py-2"
              placeholder="12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ort</label>
            <input
              {...register('city')}
              className="w-full border rounded px-3 py-2"
              placeholder="Berlin"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">IBAN</label>
            <input
              {...register('iban')}
              className="w-full border rounded px-3 py-2"
              placeholder="DE12 3456 7890 1234 5678 90"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">CRM-ID</label>
            <input
              {...register('crmId')}
              className="w-full border rounded px-3 py-2"
              placeholder="lead_abc123..."
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">CRM-ID kann nicht geändert werden</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="submit"
            disabled={saving || !watchedValues.firstName}
            className="w-full sm:w-auto px-4 py-2 rounded text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--color-success)',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            {saving ? '💾 Speichere...' : '💾 Speichern'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset({
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
            className="w-full sm:w-auto px-4 py-2 rounded border hover:opacity-90 transition-opacity"
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
      </form>
    </div>
  )
}


