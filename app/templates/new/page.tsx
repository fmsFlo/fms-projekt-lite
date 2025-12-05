"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Vertrag</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; padding: 60px 50px; line-height: 1.6; color: #1a1a1a; }
    .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
    .header h1 { font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .contract-info { background: #f9f9f9; padding: 20px; border-left: 4px solid #000; margin-bottom: 20px; }
    .contract-info p { margin-bottom: 8px; }
    .contract-info strong { display: inline-block; min-width: 140px; }
    .signature-area { margin-top: 100px; padding-top: 30px; border-top: 2px solid #000; }
    .signature-line { display: flex; justify-content: space-between; margin-bottom: 60px; }
    .signature-box { width: 45%; }
    .signature-box .line { border-bottom: 1px solid #333; margin-bottom: 40px; padding-bottom: 5px; }
    .signature-box .label { font-size: 12px; color: #666; margin-top: 5px; }
    @media print { body { padding: 40px 30px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{name}}</h1>
  </div>
  
  <div class="contract-info">
    <p><strong>Kunde:</strong> {{firstName}} {{lastName}}</p>
    {{#if street}}<p><strong>Adresse:</strong> {{street}}{{#if houseNumber}} {{houseNumber}}{{/if}}, {{zip}} {{city}}</p>{{/if}}
    {{#if email}}<p><strong>E-Mail:</strong> {{email}}</p>{{/if}}
    {{#if phone}}<p><strong>Telefon:</strong> {{phone}}</p>{{/if}}
  </div>
  
  <div class="section">
    <div class="section-title">Vertragsdetails</div>
    <p><strong>Produkt/Service:</strong> {{product}}</p>
    <p><strong>Honorar/Betrag:</strong> {{amountEUR}} €</p>
    {{#if iban}}<p><strong>IBAN:</strong> {{iban}}</p>{{/if}}
    {{#if notes}}<p><strong>Notizen:</strong> {{notes}}</p>{{/if}}
    <p><strong>Datum:</strong> {{date}}</p>
  </div>
  
  <div class="signature-area">
    <div class="signature-line">
      <div class="signature-box">
        <div class="line"></div>
        <div class="label">Ort, Datum</div>
      </div>
      <div class="signature-box">
        <div class="line"></div>
        <div class="label">Unterschrift Kunde</div>
      </div>
    </div>
    <div class="signature-line">
      <div class="signature-box">
        <div class="line"></div>
        <div class="label">Ort, Datum</div>
      </div>
      <div class="signature-box">
        <div class="line"></div>
        <div class="label">Unterschrift Auftraggeber</div>
      </div>
    </div>
  </div>
</body>
</html>`

export default function NewTemplatePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', slug: '', description: '', category: 'Honorar Beratung', fields: '', templateContent: DEFAULT_TEMPLATE
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const fieldsArray = form.fields.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fields: fieldsArray })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Fehler beim Anlegen')
      }
      router.replace('/templates')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold mb-4">Neues Template</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input name="name" value={form.name} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Slug (URL-freundlich, z.B. honorar-vertrag)</label>
              <input name="slug" value={form.slug} onChange={onChange} required pattern="[a-z0-9-]+" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Beschreibung</label>
            <input name="description" value={form.description} onChange={onChange} />
          </div>
          <div>
            <label className="block text-sm mb-1">Kategorie</label>
            <select name="category" value={form.category} onChange={onChange} className="border rounded px-3 py-2 w-full">
              <option value="Honorar Beratung">Honorar Beratung</option>
              <option value="Kündigungen">Kündigungen</option>
              <option value="Sonstige">Sonstige</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Felder (kommagetrennt, z.B. product,amountEUR,iban,notes)</label>
            <input name="fields" value={form.fields} onChange={onChange} placeholder="product,amountEUR,iban,notes" />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold">Template-Design</label>
            
            {/* Design-Upload */}
            <div className="mb-4 p-4 border rounded bg-blue-50">
              <label className="block text-sm mb-2 font-semibold">Professionelles Design hochladen (HTML)</label>
              <input 
                type="file" 
                accept=".html"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !form.slug) {
                    if (!form.slug) {
                      alert('⚠️ Bitte zuerst einen Slug eingeben!')
                      return
                    }
                  }
                  
                  if (file) {
                    try {
                      const fileContent = await file.text()
                      setForm({ ...form, templateContent: fileContent })
                      alert('✅ HTML geladen! Du kannst es jetzt noch bearbeiten und Platzhalter hinzufügen.')
                    } catch (err: any) {
                      alert('❌ Fehler beim Laden: ' + err.message)
                    }
                  }
                }}
                className="text-sm file:mr-3 file:px-3 file:py-2 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 Exportiere dein Design aus Figma oder Adobe XD als HTML oder erstelle es manuell. 
                Verwende Platzhalter wie <code>{`{{client.firstName}}`}</code> oder <code>{`{{productProvider}}`}</code>
              </p>
            </div>

            {/* Template-Editor */}
            <label className="block text-sm mb-1">Template-Inhalt bearbeiten (HTML mit Handlebars)</label>
            <textarea 
              name="templateContent" 
              value={form.templateContent} 
              onChange={onChange} 
              rows={30} 
              className="font-mono text-sm w-full border rounded p-3" 
              required 
              placeholder="<!DOCTYPE html>... mit {{Platzhaltern}}"
            />
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-semibold mb-1">📋 Verfügbare Platzhalter:</p>
              <div className="text-xs text-gray-700">
                <div className="font-semibold mb-2 text-gray-900">👤 Kunden-Daten:</div>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div><code>{`{{client.firstName}}`}</code> - Vorname</div>
                  <div><code>{`{{client.lastName}}`}</code> - Nachname</div>
                  <div><code>{`{{client.email}}`}</code> - E-Mail</div>
                  <div><code>{`{{client.phone}}`}</code> - Telefon</div>
                  <div><code>{`{{client.street}}`}</code> - Straße</div>
                  <div><code>{`{{client.houseNumber}}`}</code> - Hausnummer</div>
                  <div><code>{`{{client.zip}}`}</code> - PLZ</div>
                  <div><code>{`{{client.city}}`}</code> - Stadt</div>
                  <div><code>{`{{client.iban}}`}</code> - IBAN</div>
                </div>
                
                <div className="font-semibold mb-2 text-gray-900">🏢 Berater-/Unternehmens-Daten:</div>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div><code>{`{{companySettings.personalName}}`}</code> - Name</div>
                  <div><code>{`{{companySettings.personalEmail}}`}</code> - E-Mail</div>
                  <div><code>{`{{companySettings.personalStreet}}`}</code> - Straße</div>
                  <div><code>{`{{companySettings.personalHouseNumber}}`}</code> - Hausnummer</div>
                  <div><code>{`{{companySettings.personalZip}}`}</code> - PLZ</div>
                  <div><code>{`{{companySettings.personalCity}}`}</code> - Ort/Stadt</div>
                  <div><code>{`{{companySettings.personalPhone}}`}</code> - Telefon</div>
                  <div><code>{`{{companySettings.personalWebsite}}`}</code> - Website</div>
                </div>
                
                <div className="font-semibold mb-2 text-gray-900">📄 Vertrags-Daten:</div>
                <div className="grid grid-cols-2 gap-1">
                  <div><code>{`{{productProvider}}`}</code> - Produktanbieter</div>
                  <div><code>{`{{amountEUR}}`}</code> - Betrag</div>
                  <div><code>{`{{bookingStart}}`}</code> - Buchungsbeginn</div>
                  <div><code>{`{{date}}`}</code> - Aktuelles Datum</div>
                  <div><code>{`{{#if field}}...{{/if}}`}</code> - Bedingte Anzeige</div>
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button disabled={loading} type="submit">{loading ? 'Speichere…' : 'Speichern'}</button>
            <a className="px-3 py-2 rounded border" href="/templates">Abbrechen</a>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}

