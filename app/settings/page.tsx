export const runtime = "nodejs";
"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import UsersSection from './users-section'
import BrandColorPicker from '@/components/settings/BrandColorPicker'
import AuthGuard from '@/components/AuthGuard'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authLoading, setAuthLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [form, setForm] = useState({
    personalName: '', personalEmail: '', personalStreet: '', personalHouseNumber: '', personalZip: '', personalCity: '', personalPhone: '', personalWebsite: '',
    companyName: '', contactPerson: '', companyEmail: '', companyStreet: '', companyHouseNumber: '', companyZip: '', companyCity: '', companyPhone: '', companyWebsite: '',
    billingStreet: '', billingHouseNumber: '', billingZip: '', billingCity: '', billingEmail: '',
    makeWebhookUrl: '', makeApiKey: '',
    closeApiKey: '',
    logoUrl: '', companySlogan: '',
    advisorIban: '', paymentSubject: '', creditorId: '',
    stripeSecretKey: '', stripePublishableKey: '',
    sevdeskApiToken: '', sevdeskApiUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'kontakt' | 'branding' | 'zahlung' | 'integrationen' | 'design' | 'benutzer'>('kontakt')

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          setAuthLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role === 'blocked') {
          await supabase.auth.signOut()
          router.push('/login')
          setAuthLoading(false)
          return
        }

        setAuthorized(true)
        setAuthLoading(false)
        // Lade Settings sofort nach erfolgreicher Auth
        loadSettings()
      } catch (error) {
        console.error('Auth check error:', error)
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [router, supabase])

  async function loadSettings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setForm({
          personalName: data.personalName || '',
          personalEmail: data.personalEmail || '',
          personalStreet: data.personalStreet || '',
          personalHouseNumber: data.personalHouseNumber || '',
          personalZip: data.personalZip || '',
          personalCity: data.personalCity || '',
          personalPhone: data.personalPhone || '',
          personalWebsite: data.personalWebsite || '',
          companyName: data.companyName || '',
          contactPerson: data.contactPerson || '',
          companyEmail: data.companyEmail || '',
          companyStreet: data.companyStreet || '',
          companyHouseNumber: data.companyHouseNumber || '',
          companyZip: data.companyZip || '',
          companyCity: data.companyCity || '',
          companyPhone: data.companyPhone || '',
          companyWebsite: data.companyWebsite || '',
          billingStreet: data.billingStreet || '',
          billingHouseNumber: data.billingHouseNumber || '',
          billingZip: data.billingZip || '',
          billingCity: data.billingCity || '',
          billingEmail: data.billingEmail || '',
          makeWebhookUrl: data.makeWebhookUrl || '',
          makeApiKey: data.makeApiKey || '',
          closeApiKey: data.closeApiKey || '',
          logoUrl: data.logoUrl || '',
          companySlogan: data.companySlogan || '',
          advisorIban: data.advisorIban || '',
          paymentSubject: data.paymentSubject || '',
          creditorId: data.creditorId || '',
          stripeSecretKey: data.stripeSecretKey || '',
          stripePublishableKey: data.stripePublishableKey || '',
          sevdeskApiToken: data.sevdeskApiToken || '',
          sevdeskApiUrl: data.sevdeskApiUrl || ''
        })
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.message || 'Fehler beim Laden der Einstellungen')
        console.error('Settings load error:', errorData)
      }
    } catch (err: any) {
      console.error('Fehler beim Laden der Einstellungen:', err)
      setError(err.message || 'Unbekannter Fehler beim Laden der Einstellungen')
    } finally {
      setLoading(false)
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { id, createdAt, updatedAt, ...dataToSend } = form as any
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === undefined) {
          dataToSend[key] = null
        }
      })
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        if (errorData.issues && Array.isArray(errorData.issues)) {
          const details = errorData.issues
            .map((issue: any) => `• ${issue.path.join('.')}: ${issue.message}`)
            .join('\n')
          throw new Error(`Validierungsfehler:\n${details}`)
        }
        throw new Error(errorData.message || 'Speichern fehlgeschlagen')
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  async function onLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Upload fehlgeschlagen')
      }

      const data = await res.json()
      setForm({ ...form, logoUrl: data.logoUrl })
      alert('✅ Logo erfolgreich hochgeladen!')
    } catch (err: any) {
      setError(err.message)
      alert('❌ ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <AuthGuard>
      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          </div>
        </div>
      ) : !authorized ? null : loading ? (
        <div className="p-4">Lade…</div>
      ) : (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Sticky Success/Error Messages */}
      {success && (
        <div className="fixed top-20 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          ✅ Einstellungen gespeichert!
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md">
          <div className="font-bold mb-2">❌ Fehler beim Speichern</div>
          <div className="text-sm whitespace-pre-wrap">{error}</div>
        </div>
      )}
      
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Unternehmenseinstellungen</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('kontakt')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'kontakt'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📞 Kontaktdaten
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'branding'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎨 Branding & Design
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zahlung')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'zahlung'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💳 Zahlungsinformationen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrationen')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'integrationen'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔌 Integrationen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('benutzer')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'benutzer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Benutzerverwaltung
          </button>
        </nav>
      </div>

      {activeTab === 'benutzer' ? (
        <UsersSection />
      ) : activeTab === 'design' ? (
        <div className="space-y-6">
          <BrandColorPicker />
        </div>
      ) : (
      <form onSubmit={onSubmit} className="space-y-6">
          {/* Kontaktdaten Tab */}
          {activeTab === 'kontakt' && (
            <>
              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Persönliche Kontaktdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Name/Firmenname *</label>
                    <input name="personalName" value={form.personalName} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">E-Mail-Adresse</label>
                    <input name="personalEmail" type="email" value={form.personalEmail} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">Straße/Hausnummer *</label>
                      <input name="personalStreet" value={form.personalStreet} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Nr.</label>
                      <input name="personalHouseNumber" value={form.personalHouseNumber} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">PLZ *</label>
                    <input name="personalZip" value={form.personalZip} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Stadt *</label>
                    <input name="personalCity" value={form.personalCity} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Telefonnummer *</label>
                    <input name="personalPhone" value={form.personalPhone} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Webseite</label>
                    <input name="personalWebsite" value={form.personalWebsite} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>
        </section>

              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-start gap-2">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <p className="text-sm text-blue-800">
              Der Firmenname erscheint auf dem Kontoauszug Ihrer Kunden als Verwendungszweck! Wir können nur 22 Zeichen abbilden, ansonsten zeigen wir die Rechnungsnummer an.
            </p>
          </div>
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Gewerbliche Kontaktdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Firmenname *</label>
                    <input name="companyName" value={form.companyName} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Ansprechpartner *</label>
                    <input name="contactPerson" value={form.contactPerson} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">E-Mail-Adresse</label>
                    <input name="companyEmail" type="email" value={form.companyEmail} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">Straße/Hausnummer *</label>
                      <input name="companyStreet" value={form.companyStreet} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Nr.</label>
                      <input name="companyHouseNumber" value={form.companyHouseNumber} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">PLZ *</label>
                    <input name="companyZip" value={form.companyZip} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Stadt *</label>
                    <input name="companyCity" value={form.companyCity} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Telefonnummer *</label>
                    <input name="companyPhone" value={form.companyPhone} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Webseite</label>
                    <input name="companyWebsite" value={form.companyWebsite} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>
        </section>

              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Abweichende Rechnungsadresse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">Straße/Hausnummer</label>
                      <input name="billingStreet" value={form.billingStreet} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Nr.</label>
                      <input name="billingHouseNumber" value={form.billingHouseNumber} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">PLZ</label>
                    <input name="billingZip" value={form.billingZip} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Stadt</label>
                    <input name="billingCity" value={form.billingCity} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">E-Mail-Adresse</label>
                    <input name="billingEmail" type="email" value={form.billingEmail} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>
        </section>
            </>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Branding & Design</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold">Logo hochladen</label>
              {form.logoUrl && (
                <div className="mb-3 p-3 bg-gray-50 border rounded flex items-center gap-3">
                  <img src={form.logoUrl} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium">Aktuelles Logo</p>
                    <p className="text-xs text-gray-500">{form.logoUrl}</p>
                  </div>
                  <button
                    type="button"
                        onClick={() => setForm({ ...form, logoUrl: null as any })}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Löschen
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onLogoUpload}
                  disabled={uploading}
                  className="flex-1 text-sm file:mr-3 file:px-3 file:py-2 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700 disabled:opacity-50"
                />
                {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Erlaubte Formate: PNG, JPG, WebP, SVG • Max. 5MB • Wird oben rechts in PDFs angezeigt
              </p>
            </div>
            <div>
              <label className="block text-sm mb-1">Slogan / Tagline</label>
                  <input name="companySlogan" value={form.companySlogan} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="z.B. finance made simple" />
              <p className="text-xs text-gray-500 mt-1">Wird neben dem Logo angezeigt</p>
            </div>
          </div>
        </section>
          )}

          {/* Zahlungsinformationen Tab */}
          {activeTab === 'zahlung' && (
            <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Zahlungsinformationen</h2>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">IBAN Berater (für Überweisungen)</label>
                  <input name="advisorIban" value={form.advisorIban} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="DE89 3704 0044 0532 0130 00" />
              <p className="text-xs text-gray-500 mt-1">Wird in Verträgen mit Zahlungsart "Überweisung" angezeigt</p>
            </div>
            <div>
              <label className="block text-sm mb-1">Verwendungszweck (für Überweisungen)</label>
                  <input name="paymentSubject" value={form.paymentSubject} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="z.B. Vertrag - [Kundenname]" />
              <p className="text-xs text-gray-500 mt-1">Standard-Verwendungszweck für Überweisungen. Wird automatisch mit Kundennamen ergänzt.</p>
            </div>
            <div>
              <label className="block text-sm mb-1">SEPA Gläubiger-Identifikationsnummer</label>
                  <input name="creditorId" value={form.creditorId} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="DE98ZZZ09999999999" />
              <p className="text-xs text-gray-500 mt-1">Ihre SEPA Gläubiger-ID (wird in SEPA-Mandaten verwendet)</p>
            </div>
          </div>
        </section>
          )}

          {/* Integrationen Tab */}
          {activeTab === 'integrationen' && (
            <>
              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Stripe Integration</h2>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-start gap-2">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <p className="text-sm text-blue-800">
              Konfigurieren Sie Ihre Stripe API-Schlüssel für die SEPA-Lastschrift-Integration. Diese werden benötigt, um automatisch Mandate zu erstellen und Zahlungen abzuwickeln.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Stripe Secret Key *</label>
              <div className="flex gap-2">
                <input 
                  name="stripeSecretKey" 
                  type="password" 
                  value={form.stripeSecretKey} 
                  onChange={onChange} 
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="sk_test_..." 
                />
                <button
                  type="button"
                  onClick={async () => {
                    setError(null)
                    try {
                      const res = await fetch('/api/settings/test-stripe')
                      const data = await res.json()
                      if (data.success) {
                        alert(`✅ Stripe-Verbindung erfolgreich!\n\nAccount-ID: ${data.account.id}\nLand: ${data.account.country}\nWährung: ${data.account.default_currency}\nSEPA aktiviert: ${data.capabilities.sepa_debit_payments || 'unbekannt'}`)
                      } else {
                        alert(`❌ Fehler: ${data.message}\n\n${data.error || ''}`)
                      }
                    } catch (err: any) {
                      alert(`❌ Fehler beim Testen: ${err.message}`)
                    }
                  }}
                         className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap font-medium text-sm shadow-sm transition-colors"
                >
                  🔍 Verbindung testen
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Ihr Stripe Secret Key (beginnt mit sk_test_ oder sk_live_)</p>
            </div>
            <div>
              <label className="block text-sm mb-1">Stripe Publishable Key</label>
              <input 
                name="stripePublishableKey" 
                value={form.stripePublishableKey} 
                onChange={onChange} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2" 
                placeholder="pk_test_..." 
              />
              <p className="text-xs text-gray-500 mt-1">Ihr Stripe Publishable Key (optional, beginnt mit pk_test_ oder pk_live_)</p>
            </div>
          </div>
        </section>

              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Sevdesk Integration</h2>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-start gap-2">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <p className="text-sm text-blue-800">
              Konfigurieren Sie Ihre Sevdesk API für die automatische Rechnungserstellung. 
              Rechnungen werden automatisch erstellt, sobald ein unterschriebenes Dokument hochgeladen wird.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Sevdesk API Token *</label>
              <div className="flex gap-2">
                <input 
                  name="sevdeskApiToken" 
                  type="password"
                  value={form.sevdeskApiToken} 
                  onChange={onChange} 
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2" 
                  placeholder="Ihr Sevdesk API Token" 
                />
                <button
                  type="button"
                    onClick={async () => {
                      setError(null)
                      try {
                        const res = await fetch('/api/settings/test-sevdesk')
                        const data = await res.json()
                        if (data.success) {
                          const userInfo = data.account?.username || data.account?.email || 'unbekannt'
                          alert(`✅ Sevdesk-Verbindung erfolgreich!\n\n${data.message}\n\nBenutzer: ${userInfo}`)
                        } else {
                          const errorDetails = data.error 
                            ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error, null, 2))
                            : 'Keine Details verfügbar'
                          alert(`❌ Fehler: ${data.message}\n\nDetails: ${errorDetails}`)
                        }
                      } catch (err: any) {
                        alert(`❌ Fehler beim Testen: ${err.message}`)
                      }
                    }}
                         className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap font-medium text-sm shadow-sm transition-colors"
                >
                  🔍 Verbindung testen
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Finden Sie Ihren API Token in Sevdesk unter: Erweiterungen → API → Token einblenden
              </p>
            </div>
            <div>
              <label className="block text-sm mb-1">Sevdesk API URL (optional)</label>
              <input 
                name="sevdeskApiUrl" 
                value={form.sevdeskApiUrl} 
                onChange={onChange} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2" 
                placeholder="https://my.sevdesk.de/api/v1" 
              />
              <p className="text-xs text-gray-500 mt-1">
                Standard: https://my.sevdesk.de/api/v1 (nur ändern, wenn Sie eine andere URL verwenden)
              </p>
            </div>
          </div>
        </section>

              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Make Integration</h2>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Make Webhook URL</label>
                    <input name="makeWebhookUrl" type="url" value={form.makeWebhookUrl} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="https://hook.eu2.make.com/..." />
              <p className="text-xs text-gray-500 mt-1">Webhook-URL für die Kunden-Suche in Make</p>
            </div>
            <div>
              <label className="block text-sm mb-1">Make API Key (optional)</label>
                    <input name="makeApiKey" type="password" value={form.makeApiKey} onChange={onChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="API-Key..." />
              <p className="text-xs text-gray-500 mt-1">Falls erforderlich für die Authentifizierung</p>
            </div>
          </div>
        </section>

              <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Close Integration</h2>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-start gap-2">
                  <span className="text-blue-600 text-xl">ℹ️</span>
                  <p className="text-sm text-blue-800">
                    Konfigurieren Sie Ihren Close API Key für die Synchronisation von Custom Activities. 
                    Dieser wird benötigt, um Termine und Ergebnisse aus Close zu synchronisieren.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Close API Key *</label>
                    <input 
                      name="closeApiKey" 
                      type="password"
                      value={form.closeApiKey} 
                      onChange={onChange} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2" 
                      placeholder="Ihr Close API Key" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Finden Sie Ihren API Key in Close unter: Settings → API Keys → Create API Key
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

            {/* Save Button */}
            <div className="flex gap-2">
              <button disabled={saving} type="submit" className="px-6 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors">
                {saving ? 'Speichere…' : 'Speichern'}
              </button>
            </div>
      </form>
      )}
    </div>
      )}
    </AuthGuard>
  )
}

