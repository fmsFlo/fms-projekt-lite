"use client"
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import fs from 'node:fs/promises'
import AuthGuard from '@/components/AuthGuard'

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', slug: '', description: '', category: 'Honorar Beratung', fields: '', templateContent: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const PROTECTED_TEMPLATES = ['verguetungsvereinbarung-nettoprodukt-sepa', 'verguetungsvereinbarung-nettoprodukt-ueberweisung', 'beratungsprotokoll']
  const PROTECTION_PASSWORD = 'Mama%2022doc!'

  // Extrahiere lesbaren Text aus HTML
  function extractTextFromHtml(html: string): string {
    // Entferne Script- und Style-Tags komplett
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    
    // Ersetze BR-Tags durch Zeilenumbrüche
    text = text.replace(/<br\s*\/?>/gi, '\n')
    
    // Ersetze Paragraph-Tags durch doppelte Zeilenumbrüche
    text = text.replace(/<\/p>/gi, '\n\n')
    text = text.replace(/<p[^>]*>/gi, '')
    
    // Ersetze div-Tags durch Zeilenumbrüche
    text = text.replace(/<\/div>/gi, '\n')
    text = text.replace(/<div[^>]*>/gi, '')
    
    // Entferne alle anderen HTML-Tags, aber behalte den Inhalt
    text = text.replace(/<[^>]+>/g, '')
    
    // Entferne mehrfache Leerzeilen
    text = text.replace(/\n{3,}/g, '\n\n')
    
    // Behandle Handlebars-Platzhalter: Zeige sie in einer lesbaren Form
    text = text.replace(/\{\{([^}]+)\}\}/g, (match, content) => {
      if (content.startsWith('#if') || content.startsWith('/if') || content.startsWith('else')) {
        return '' // Entferne Bedingungslogik für Text-Vorschau
      }
      return `[${content.trim()}]` // Zeige Platzhalter als [Variable]
    })
    
    return text.trim()
  }

  function extractHandlebarsVariables(template: string): string[] {
    const unique = new Set<string>()
    const regex = /\{\{\s*([^\s{}]+)[^{}]*\}\}/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(template)) !== null) {
      const token = match[1]?.trim()
      if (!token) continue
      if (token.startsWith('#') || token.startsWith('/') || token.toLowerCase() === 'else') continue
      if (token === 'this') continue
      unique.add(token)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'de-DE'))
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/templates/${params.id}`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || 'Template nicht gefunden')
        }
        const data = await res.json()
        
        // Prüfe ob Template geschützt ist
        if (PROTECTED_TEMPLATES.includes(data.slug)) {
          setIsLocked(true)
          setPasswordRequired(true)
        }
        
        // Versuche Template-Content zu laden
        let content = ''
        try {
          const templateContentRes = await fetch(`/api/templates/${params.id}/content`)
          if (templateContentRes.ok) {
            content = await templateContentRes.text()
          } else {
            // Wenn Datei nicht gefunden, zeige Warnung aber setze keine Fehlermeldung
            console.warn('Template-Datei nicht gefunden, aber Template-Daten geladen')
          }
        } catch (contentErr: any) {
          console.warn('Fehler beim Laden des Template-Inhalts:', contentErr)
          // Keine Fehlermeldung setzen, Template-Daten sind geladen
        }
        
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          category: data.category || 'Honorar Beratung',
          fields: (() => {
            try { return (JSON.parse(data.fields || '[]') as any[]).join(', ') } catch { return '' }
          })(),
          templateContent: content
        })
        setError(null) // Entferne eventuelle Fehlermeldungen
      } catch (err: any) {
        setError(err.message || 'Fehler beim Laden des Templates')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])
  
  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === PROTECTION_PASSWORD) {
      setIsLocked(false)
      setPasswordRequired(false)
      setPassword('')
      setError(null)
    } else {
      setError('Falsches Passwort')
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Prüfe ob Template geschützt ist
    if (isLocked) {
      setError('Dieses Template ist geschützt. Bitte Passwort eingeben.')
      return
    }
    
    setSaving(true)
    setError(null)
    try {
      const fieldsArray = form.fields.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch(`/api/templates/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fields: fieldsArray })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Fehler beim Speichern')
      }
      router.replace('/templates')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const fieldList = useMemo(() => form.fields.split(',').map((s) => s.trim()).filter(Boolean), [form.fields])
  const detectedVariables = useMemo(() => extractHandlebarsVariables(form.templateContent), [form.templateContent])

  if (loading) return <div className="p-4">Lade…</div>

  // Passwort-Eingabe anzeigen wenn Template geschützt
  if (passwordRequired) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border rounded p-6 bg-white">
          <h1 className="text-2xl font-semibold mb-4">🔒 Geschütztes Template</h1>
          <p className="text-gray-600 mb-4">
            Dieses Template ist geschützt und kann nur mit einem Passwort bearbeitet werden.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Passwort eingeben..."
                autoFocus
              />
            </div>
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Entsperren
              </button>
              <a href="/templates" className="px-4 py-2 rounded border hover:bg-gray-50">
                Zurück
              </a>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Template bearbeiten</h1>
      {isLocked && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded">
          🔒 <strong>Geschütztes Template:</strong> Dieses Template ist passwortgeschützt.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Fehler:</strong> {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="name" value={form.name} onChange={onChange} required disabled={isLocked} className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''} />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input name="slug" value={form.slug} onChange={onChange} required pattern="[a-z0-9-]+" disabled={isLocked} className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Beschreibung</label>
          <input name="description" value={form.description} onChange={onChange} disabled={isLocked} className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''} />
        </div>
        <div>
          <label className="block text-sm mb-1">Kategorie</label>
          <select name="category" value={form.category} onChange={onChange} className={`border rounded px-3 py-2 w-full ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} disabled={isLocked}>
            <option value="Honorarberatung">Honorarberatung</option>
            <option value="Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)">Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)</option>
            <option value="Sonstige">Sonstige</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Felder (kommagetrennt)</label>
          <input name="fields" value={form.fields} onChange={onChange} placeholder="product,amountEUR,iban,notes" disabled={isLocked} className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''} />
        </div>

        {(fieldList.length > 0 || detectedVariables.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-xs text-gray-700">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Benötigte Formular-Felder</h3>
              {fieldList.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {fieldList.map((field) => (
                    <li key={field}><code className="bg-white px-1 py-0.5 rounded border border-gray-200">{field}</code></li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Keine zusätzlichen Felder hinterlegt.</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Verwendete Template-Variablen</h3>
              {detectedVariables.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {detectedVariables.map((variable) => (
                    <span key={variable} className="px-2 py-1 bg-white border border-gray-200 rounded">{'{{'}{variable}{'}}'}</span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Keine Variablen erkannt.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm mb-2 font-semibold">Template-Design</label>
          
          {/* Design-Upload & Anleitung */}
          <div className="mb-4 space-y-3">
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎨</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">So erstellst du professionelle Templates:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-3">
                    <li><strong>Design erstellen:</strong> Erstelle dein Design in Figma, Adobe XD, Webflow oder einem anderen Design-Tool</li>
                    <li><strong>Als HTML exportieren:</strong> Exportiere das Design als HTML-Datei</li>
                    <li><strong>HTML hochladen:</strong> Lade die HTML-Datei hier hoch</li>
                    <li><strong>Platzhalter einfügen:</strong> Ersetze statische Texte durch Platzhalter wie <code className="bg-blue-100 px-1 rounded">{'{{'}}client.firstName{'}}'}</code></li>
                    <li><strong>Fertig:</strong> Das Template ist einsatzbereit!</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded bg-blue-50">
              <label className="block text-sm mb-2 font-semibold">📤 HTML-Design hochladen</label>
              <input 
                type="file" 
                accept=".html,.htm"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  try {
                    const fileContent = await file.text()
                    setForm({ ...form, templateContent: fileContent })
                    alert('✅ HTML erfolgreich geladen! Jetzt kannst du Platzhalter einfügen.')
                  } catch (err: any) {
                    alert('❌ Fehler: ' + err.message)
                  }
                }}
                className="text-sm file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 <strong>Tipp:</strong> Wenn dein Design-Tool kein HTML exportiert, kannst du auch ein Webflow-Design verwenden oder einen Webdesigner beauftragen, das Design als HTML zu exportieren.
              </p>
            </div>
          </div>

          {/* Template-Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold">Template-Inhalt bearbeiten</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Text-Vorschau anzeigen
                </label>
                <div className="text-xs text-gray-500">
                  💡 Platzhalter: <code className="bg-gray-100 px-1 rounded">{'{{'}}client.firstName{'}}'}</code>
                </div>
              </div>
            </div>
            
            <div className={showPreview ? "grid grid-cols-2 gap-4" : ""}>
              <div className="relative">
                <textarea 
                  name="templateContent" 
                  value={form.templateContent} 
                  onChange={onChange} 
                  rows={showPreview ? 30 : 35} 
                  className={`font-mono text-xs w-full border-2 border-gray-300 rounded-lg p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-y ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required 
                  disabled={isLocked}
                  placeholder="<!DOCTYPE html>... mit {{Platzhaltern}}"
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace', lineHeight: '1.6' }}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                  {form.templateContent.length} Zeichen
                </div>
              </div>
              
              {showPreview && (
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="text-xs font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    📄 Text-Vorschau (nur Inhalt, ohne HTML)
                  </div>
                  <div className="bg-white rounded p-3 border text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto font-sans" style={{ lineHeight: '1.8' }}>
                    {form.templateContent ? extractTextFromHtml(form.templateContent) : (
                      <span className="text-gray-400 italic">Kein Inhalt vorhanden</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    💡 Platzhalter werden als [Variable] angezeigt. Die Vorschau zeigt nur den Text-Inhalt.
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 text-xs">
              <button 
                type="button"
                onClick={() => {
                  const textarea = document.querySelector('textarea[name="templateContent"]') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const text = textarea.value
                    const before = text.substring(0, start)
                    const selected = text.substring(start, end)
                    const after = text.substring(end)
                    const newText = before + '{{' + selected + '}}' + after
                    setForm({ ...form, templateContent: newText })
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 2, end + 2)
                    }, 0)
                  }
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700"
              >
                ✨ Auswahl als Platzhalter
              </button>
              <button
                type="button"
                onClick={() => {
                  const textarea = document.querySelector('textarea[name="templateContent"]') as HTMLTextAreaElement
                  if (textarea) {
                    const text = textarea.value
                    const formatted = text
                      .replace(/(\{\{[^}]+\}\})/g, '<span style="color: #d946ef; font-weight: bold;">$1</span>')
                      .replace(/(&lt;\/?[a-z][^&gt;]*&gt;)/gi, '<span style="color: #059669;">$1</span>')
                    const preview = window.open('', '_blank')
                    if (preview) {
                      preview.document.write(`
                        <html>
                          <head><title>Template-Vorschau</title></head>
                          <body style="font-family: monospace; padding: 20px; background: #f9fafb;">
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                              <h2 style="margin-bottom: 16px;">Template-Inhalt (nur Text, kein Rendering)</h2>
                              <pre style="white-space: pre-wrap; word-wrap: break-word;">${text}</pre>
                            </div>
                          </body>
                        </html>
                      `)
                    }
                  }
                }}
                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded text-green-700"
              >
                👁️ Text-Vorschau
              </button>
            </div>
          </div>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs font-semibold mb-1">📋 Verfügbare Platzhalter:</p>
            <div className="text-xs text-gray-700">
              <div className="font-semibold mb-2 text-gray-900">👤 Kunden-Daten:</div>
              <div className="grid grid-cols-2 gap-1 mb-3">
                <div><code>{'{{'}}client.firstName{'}}'}</code> - Vorname</div>
                <div><code>{'{{'}}client.lastName{'}}'}</code> - Nachname</div>
                <div><code>{'{{'}}client.email{'}}'}</code> - E-Mail</div>
                <div><code>{'{{'}}client.phone{'}}'}</code> - Telefon</div>
                <div><code>{'{{'}}client.street{'}}'}</code> - Straße</div>
                <div><code>{'{{'}}client.houseNumber{'}}'}</code> - Hausnummer</div>
                <div><code>{'{{'}}client.zip{'}}'}</code> - PLZ</div>
                <div><code>{'{{'}}client.city{'}}'}</code> - Stadt</div>
                <div><code>{'{{'}}client.iban{'}}'}</code> - IBAN</div>
              </div>
              
              <div className="font-semibold mb-2 text-gray-900">🏢 Berater-/Unternehmens-Daten:</div>
              <div className="grid grid-cols-2 gap-1 mb-3">
                <div><code>{'{{'}}companySettings.personalName{'}}'}</code> - Name</div>
                <div><code>{'{{'}}companySettings.personalEmail{'}}'}</code> - E-Mail</div>
                <div><code>{'{{'}}companySettings.personalStreet{'}}'}</code> - Straße</div>
                <div><code>{'{{'}}companySettings.personalHouseNumber{'}}'}</code> - Hausnummer</div>
                <div><code>{'{{'}}companySettings.personalZip{'}}'}</code> - PLZ</div>
                <div><code>{'{{'}}companySettings.personalCity{'}}'}</code> - Ort/Stadt</div>
                <div><code>{'{{'}}companySettings.personalPhone{'}}'}</code> - Telefon</div>
                <div><code>{'{{'}}companySettings.personalWebsite{'}}'}</code> - Website</div>
              </div>
              
              <div className="font-semibold mb-2 text-gray-900">📄 Vertrags-Daten:</div>
              <div className="grid grid-cols-2 gap-1">
                <div><code>{'{{'}}productProvider{'}}'}</code> - Produktanbieter</div>
                <div><code>{'{{'}}amountEUR{'}}'}</code> - Betrag</div>
                <div><code>{'{{'}}bookingStart{'}}'}</code> - Buchungsbeginn</div>
                <div><code>{'{{'}}date{'}}'}</code> - Aktuelles Datum</div>
                <div><code>{'{{'}}#if field{'}}'}...{'{{'}}/if{'}}'}</code> - Bedingte Anzeige</div>
              </div>
            </div>
          </div>
        </div>
        {!form.templateContent && !error && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
            ⚠️ <strong>Hinweis:</strong> Die Template-Datei wurde nicht gefunden. Du kannst jetzt ein neues HTML-Design hochladen oder den Inhalt manuell eingeben.
          </div>
        )}
        <div className="flex gap-2">
          <button disabled={saving || isLocked} type="submit" className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}>{saving ? 'Speichere…' : 'Speichern'}</button>
          <a className="px-3 py-2 rounded border" href="/templates">Abbrechen</a>
        </div>
      </form>
    </div>
  )
}

