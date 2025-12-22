"use client"
import { useEffect, useMemo, useState } from 'react'
import DeleteClientButton from './[id]/delete-button'
import { usePrivacy } from '@/app/contexts/PrivacyContext'

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
  const { privacyMode, activeClientId, setActiveClientId } = usePrivacy()

  // Filter clients based on privacy mode
  const displayedClients = useMemo(() => {
    if (privacyMode && activeClientId) {
      return clients.filter(c => c.id === activeClientId)
    }
    return clients
  }, [clients, privacyMode, activeClientId])

  const filtered = useMemo(() => {
    if (!displayedClients || displayedClients.length === 0) return []
    const q = query.toLowerCase()
    if (!q) return displayedClients
    return displayedClients.filter(c =>
      [c.firstName, c.lastName, c.email, c.city, c.crmId].some(v => (v || '').toLowerCase().includes(q))
    )
  }, [query, displayedClients])

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
      
      // Performance: Reduziere Logging in Production
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Make Response:', data)
      }
      
      if (!data.results) {
        console.error('❌ Make hat keine "results" zurückgegeben!')
        alert('⚠️ Make hat keine "results" zurückgegeben. Prüfe das Response-Format in Make!')
      } else if (!Array.isArray(data.results)) {
        console.error('❌ data.results ist kein Array!')
        alert('⚠️ Make "results" ist kein Array. Prüfe das Response-Format in Make!')
      } else if (data.results.length === 0 && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Make hat leeres Array zurückgegeben')
      }
      
      setMakeResults(data.results || [])
    } catch (err: any) {
      console.error('❌ Fehler bei Make-Suche:', err)
      alert(`Fehler bei der Make-Suche: ${err.message || 'Unbekannter Fehler'}. Prüfe die Browser-Console (F12)!`)
    } finally {
      setLoadingMake(false)
    }
  }

  // Hilfsfunktion: Trenne Straße und Hausnummer wenn sie kombiniert sind
  function splitStreetAndNumber(address: string | null | undefined): { street: string | null, houseNumber: string | null } {
    if (!address || !address.trim()) {
      return { street: null, houseNumber: null }
    }
    
    // Wenn bereits getrennt, verwende die Werte
    // (wird von Make bereits getrennt übergeben)
    
    // Versuche Straße und Hausnummer zu trennen
    // Pattern: Text + Leerzeichen + Zahl (z.B. "Hauptstr. 10" oder "Musterweg 123a")
    const match = address.trim().match(/^(.+?)\s+(\d+[a-zA-Z]?)$/)
    if (match) {
      return {
        street: match[1].trim() || null,
        houseNumber: match[2].trim() || null
      }
    }
    
    // Wenn kein Match, ist es wahrscheinlich nur die Straße
    return { street: address.trim(), houseNumber: null }
  }

  async function importClient(clientData: Partial<Client>) {
    setLoadingImport(true)
    try {
      // Trenne Straße und Hausnummer falls kombiniert
      let street = clientData.street || null
      let houseNumber = clientData.houseNumber || null
      
      // Wenn street gefüllt ist aber houseNumber leer, versuche zu trennen
      if (street && !houseNumber) {
        const split = splitStreetAndNumber(street)
        street = split.street
        houseNumber = split.houseNumber
      }
      
      // Stelle sicher, dass lastName nicht undefined ist
      const cleanData = {
        ...clientData,
        lastName: clientData.lastName || '',
        street: street,
        houseNumber: houseNumber,
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
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
        <input 
          placeholder="Suche nach Name, E-Mail oder Adresse…" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
            disabled={privacyMode && activeClientId}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm"
          style={{
              backgroundColor: privacyMode && activeClientId ? '#f3f4f6' : 'white',
              color: 'var(--color-text-primary)',
              opacity: privacyMode && activeClientId ? 0.6 : 1,
              cursor: privacyMode && activeClientId ? 'not-allowed' : 'text',
              focusRingColor: 'var(--color-primary)'
          }}
          onFocus={(e) => {
              if (!privacyMode || !activeClientId) {
            e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(var(--color-primary-rgb, 0, 122, 255), 0.1)`
              }
          }}
          onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          onClick={searchMake} 
          disabled={loadingMake || (privacyMode && activeClientId)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          style={{ 
            backgroundColor: 'var(--color-secondary)',
            color: 'white'
          }}
        >
          {loadingMake ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Suche…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Suche via Make</span>
              <span className="sm:hidden">Make</span>
            </>
          )}
        </button>
      </div>

      {privacyMode && activeClientId && (
        <div className="mb-4 p-3 rounded-lg border" style={{ 
          backgroundColor: 'rgba(var(--color-primary-rgb, 0, 122, 255), 0.1)', 
          borderColor: 'rgba(var(--color-primary-rgb, 0, 122, 255), 0.3)',
          color: 'var(--color-primary)'
        }}>
          <strong>🔒 Datenschutz-Modus aktiv:</strong> Es wird nur der ausgewählte Client angezeigt.
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-Mail
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((c) => {
                const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase()
                const fullName = `${c.firstName} ${c.lastName}`.trim()
                const address = [c.street, c.houseNumber, c.zip, c.city].filter(Boolean).join(', ') || '-'
                
                return (
              <tr 
                key={c.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (privacyMode) {
                        setActiveClientId(c.id)
                      } else {
                        window.location.href = `/clients/${c.id}`
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ 
                            backgroundColor: 'rgba(var(--color-primary-rgb, 0, 122, 255), 0.1)',
                            color: 'var(--color-primary)'
                          }}
                        >
                          {initials}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 break-all">{c.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                      href={`/clients/${c.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (privacyMode) {
                            setActiveClientId(c.id)
                          }
                        }}
                        className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                        style={{ color: 'var(--color-secondary)' }}
                    >
                      Details
                        <span>→</span>
                    </a>
                </td>
              </tr>
                )
              })}
            {filtered.length === 0 && (
              <tr>
                  <td className="px-6 py-12 text-center" colSpan={4}>
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900 mb-1">Keine Kunden gefunden</p>
                      <p className="text-xs text-gray-500">
                        {query ? 'Versuche eine andere Suche' : 'Erstelle deinen ersten Kunden'}
                      </p>
                    </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Mobile Card View - Apple Style mit Stripes */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Keine Kunden gefunden</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {query ? 'Versuche eine andere Suche' : 'Erstelle deinen ersten Kunden'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            {filtered.map((c, index) => {
              const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase()
              const fullName = `${c.firstName} ${c.lastName}`.trim()
              
              return (
                <div
                  key={c.id}
                  className="client-row-mobile"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    padding: '1rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (privacyMode) {
                      setActiveClientId(c.id)
                    } else {
                      window.location.href = `/clients/${c.id}`
                    }
                  }}
                  onMouseEnter={(e) => {
                    // Hover: Etwas dunkler
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    // Zurück zur ursprünglichen Farbe (wird von CSS-Klasse gesteuert)
                    e.currentTarget.style.backgroundColor = ''
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <div 
                      className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ 
                        backgroundColor: 'rgba(var(--color-primary-rgb, 0, 122, 255), 0.15)',
                        color: 'var(--color-primary)'
                      }}
                    >
                      {initials}
                    </div>
                    
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-base font-semibold break-words"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {fullName}
                      </h3>
                    </div>
                    
                    {/* Chevron Icon */}
                    <div style={{ color: 'var(--color-text-tertiary)' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {makeResults.length > 0 && (
        <div className="rounded-xl p-4 md:p-6 shadow-sm border" style={{ 
          backgroundColor: 'rgba(var(--color-secondary-rgb, 88, 86, 214), 0.05)', 
          borderColor: 'rgba(var(--color-secondary-rgb, 88, 86, 214), 0.2)' 
        }}>
          <h3 className="font-semibold mb-4 text-lg" style={{ color: 'var(--color-secondary)' }}>
            🎯 Gefundene Kunden aus deinem CRM
          </h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-Mail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IBAN</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {makeResults.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{r.firstName} {r.lastName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 break-all">{r.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                      {r.street && r.zip && r.city ? (
                        `${r.street} ${r.houseNumber || ''}, ${r.zip} ${r.city}`
                      ) : (
                            <span className="italic text-gray-400">Keine Adresse</span>
                      )}
                        </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {r.iban ? `${r.iban.substring(0, 8)}...` : <span className="italic text-gray-400">Keine IBAN</span>}
                        </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => importClient(r)}
                        disabled={loadingImport}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            backgroundColor: 'var(--color-primary)',
                            color: 'white'
                          }}
                        >
                          {loadingImport ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Importiere…</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Kunde anlegen</span>
                            </>
                          )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {makeResults.map((r, i) => {
              const initials = `${r.firstName?.[0] || ''}${r.lastName?.[0] || ''}`.toUpperCase()
              const fullName = `${r.firstName} ${r.lastName}`.trim()
              const address = r.street && r.zip && r.city 
                ? `${r.street} ${r.houseNumber || ''}, ${r.zip} ${r.city}`
                : 'Keine Adresse'
              
              return (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ 
                        backgroundColor: 'rgba(var(--color-secondary-rgb, 88, 86, 214), 0.1)',
                        color: 'var(--color-secondary)'
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 break-words">{fullName}</h4>
                      {r.email && (
                        <p className="text-xs text-gray-600 mb-1 break-all">📧 {r.email}</p>
                      )}
                      <p className="text-xs text-gray-500 mb-1 break-words">📍 {address}</p>
                      {r.iban && (
                        <p className="text-xs text-gray-500 font-mono">🏦 {r.iban.substring(0, 8)}...</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => importClient(r)}
                    disabled={loadingImport}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    {loadingImport ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Importiere…</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Kunde anlegen</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-xs mt-4 text-gray-600">
            ℹ️ Alle verfügbaren Daten aus deinem CRM werden automatisch übernommen.
          </p>
        </div>
      )}
    </div>
  )
}

