"use client"
import { useEffect, useMemo, useState } from 'react'
import DeleteClientButton from './[id]/delete-button'

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
}

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<Client[]>(initialClients || [])
  const [makeResults, setMakeResults] = useState<Client[]>([])
  const [loadingMake, setLoadingMake] = useState(false)
  const [loadingImport, setLoadingImport] = useState(false)

  const filtered = useMemo(() => {
    if (!clients || clients.length === 0) return []
    const q = query.toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      [c.firstName, c.lastName, c.email, c.city, c.crmId].some(v => (v || '').toLowerCase().includes(q))
    )
  }, [query, clients])

  async function searchMake() {
    setLoadingMake(true)
    try {
      const res = await fetch('/api/make/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      // Prüfe ob Response OK ist
      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ API Error:', res.status, errorText)
        throw new Error(`API Error: ${res.status} - ${errorText.substring(0, 100)}`)
      }
      
      const data = await res.json()
      console.log('🔍 Make Response:', data)
      console.log('📊 Results:', data.results)
      
      if (!data.results) {
        alert('⚠️ Make hat keine "results" zurückgegeben. Prüfe das Response-Format in Make!')
        console.error('Erwartetes Format: {"results": [...]}')
        console.error('Erhalten:', data)
      }
      
      setMakeResults(data.results || [])
    } catch (err: any) {
      console.error('❌ Fehler bei Make-Suche:', err)
      alert(`Fehler bei der Make-Suche: ${err.message || 'Unbekannter Fehler'}. Prüfe die Browser-Console (F12)!`)
    } finally {
      setLoadingMake(false)
    }
  }

  async function importClient(clientData: Partial<Client>) {
    setLoadingImport(true)
    try {
      // Stelle sicher, dass lastName nicht undefined ist
      const cleanData = {
        ...clientData,
        lastName: clientData.lastName || '',
        street: clientData.street || null,
        houseNumber: clientData.houseNumber || null,
        city: clientData.city || null,
        zip: clientData.zip || null,
        iban: clientData.iban || null,
        phone: clientData.phone || null
      }
      
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      })
      if (res.ok) {
        const created = await res.json()
        setClients((prev) => [created, ...prev])
        setMakeResults([]) // Ergebnisse ausblenden
        alert(`✅ Kunde ${created.firstName} ${created.lastName || ''} erfolgreich angelegt!`)
      } else {
        const error = await res.json()
        console.error('API Error:', error)
        alert(`❌ Fehler beim Anlegen: ${error.message || 'Unbekannter Fehler'}\n\nDetails: ${JSON.stringify(error.issues || error, null, 2)}`)
      }
    } catch (err) {
      console.error('Import Error:', err)
      alert('❌ Fehler beim Anlegen des Kunden')
    } finally {
      setLoadingImport(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input 
          placeholder="Suche nach Name, E-Mail oder Adresse…" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 transition-colors"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(var(--color-primary-rgb, 0, 113, 227), 0.2)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button 
          onClick={searchMake} 
          disabled={loadingMake}
          className="px-4 py-2 rounded-md text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {loadingMake ? 'Suche…' : 'Suche via Make'}
        </button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>E-Mail</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Adresse</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: 'var(--color-border)' }}>
            {filtered.map((c, idx) => (
              <tr 
                key={c.id} 
                className="transition-colors"
                style={{ 
                  backgroundColor: idx % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
                  borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)'
                }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{c.email || '-'}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{c.street} {c.houseNumber}, {c.zip} {c.city}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a 
                      className="px-3 py-1.5 text-sm rounded-md text-white hover:opacity-90 transition-opacity font-medium" 
                      href={`/clients/${c.id}`}
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Details
                    </a>
                    <DeleteClientButton id={c.id} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center" style={{ color: 'var(--color-text-tertiary)' }} colSpan={4}>
                  Keine Treffer gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {makeResults.length > 0 && (
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: 'rgba(0, 113, 227, 0.1)', border: '1px solid rgba(0, 113, 227, 0.2)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>🎯 Gefundene Kunden aus deinem CRM</h3>
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>E-Mail</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Adresse</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>IBAN</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Aktion</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--color-border)' }}>
                {makeResults.map((r, i) => (
                  <tr 
                    key={i} 
                    className="transition-colors"
                    style={{ 
                      backgroundColor: i % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
                      borderTop: i > 0 ? '1px solid var(--color-border)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)'
                    }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{r.firstName} {r.lastName}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{r.email}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {r.street && r.zip && r.city ? (
                        `${r.street} ${r.houseNumber || ''}, ${r.zip} ${r.city}`
                      ) : (
                        <span className="italic" style={{ color: 'var(--color-text-tertiary)' }}>Keine Adresse</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {r.iban ? (
                        <span className="font-mono">{r.iban.substring(0, 8)}...</span>
                      ) : (
                        <span className="italic" style={{ color: 'var(--color-text-tertiary)' }}>Keine IBAN</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => importClient(r)}
                        disabled={loadingImport}
                        className="px-4 py-2 rounded-md text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-opacity"
                        style={{ backgroundColor: 'var(--color-success)' }}
                      >
                        ✓ Kunde anlegen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
            ℹ️ Alle verfügbaren Daten aus deinem CRM werden automatisch übernommen.
          </p>
        </div>
      )}
    </div>
  )
}

