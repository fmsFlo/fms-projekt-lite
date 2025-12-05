"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'

// Activity Type Konfiguration
const ACTIVITY_TYPES: Record<string, { id: string, dbType: string, resultField: string, displayName: string }> = {
  vorqualifizierung: {
    id: 'actitype_1H3wPemMNkfkmT0nJuEBUT',
    dbType: 'vorqualifizierung',
    resultField: 'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg',
    displayName: 'Vorqualifizierung'
  },
  erstgespraech: {
    id: 'actitype_6VB2MiuFziQxyuzfMzHy7q',
    dbType: 'erstgespraech',
    resultField: 'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ',
    displayName: 'Erstgespräch'
  },
  konzeptgespraech: {
    id: 'actitype_6ftbHtxSEz9wIwdLnovYP0',
    dbType: 'konzeptgespraech',
    resultField: 'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT',
    displayName: 'Konzeptgespräch'
  },
  umsetzungsgespraech: {
    id: 'actitype_6nwTHKNbqf3EbQIjORgPg5',
    dbType: 'umsetzungsgespraech',
    resultField: 'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf',
    displayName: 'Umsetzungsgespräch'
  },
  servicegespraech: {
    id: 'actitype_7dOp29fi26OKZQeXd9bCYP',
    dbType: 'servicegespraech',
    resultField: 'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4',
    displayName: 'Servicegespräch'
  }
}

// ResultBar Komponente
const ResultBar = ({ label, value, color, total }: { label: string, value: number, color: string, total: number }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0
  const colorMap: Record<string, string> = {
    green: '#0ea66e',
    red: '#dc2626',
    orange: '#e3a008',
    yellow: '#fbbf24',
    blue: '#4a90e2'
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '4px',
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.8)'
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: '500' }}>{value} ({Math.round(percentage)}%)</span>
      </div>
      <div style={{
        width: '100%',
        height: '24px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: colorMap[color] || colorMap.blue,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

// ResultsBreakdown Komponente
const ResultsBreakdown = ({ results, type }: { results: any, type: string }) => {
  const typeConfig = ACTIVITY_TYPES[type]
  if (!typeConfig) return null

  const total = Object.values(results).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)

  const resultBars: React.ReactNode[] = []
  
  if (type === 'erstgespraech' || type === 'konzeptgespraech') {
    resultBars.push(
      <ResultBar key="stattgefunden" label="Stattgefunden" value={results.stattgefunden || 0} color="green" total={total} />,
      <ResultBar key="noShow" label="No-Show" value={results.noShow || 0} color="red" total={total} />,
      <ResultBar key="ausgefallenKunde" label="Ausgefallen (Kunde)" value={results.ausgefallenKunde || 0} color="orange" total={total} />,
      <ResultBar key="ausgefallenBerater" label="Ausgefallen (Berater)" value={results.ausgefallenBerater || 0} color="yellow" total={total} />,
      <ResultBar key="verschoben" label="Verschoben" value={results.verschoben || 0} color="blue" total={total} />
    )
  } else if (type === 'umsetzungsgespraech') {
    resultBars.push(
      <ResultBar key="won" label="Abgeschlossen (Won)" value={results.won || 0} color="green" total={total} />,
      <ResultBar key="lost" label="Abgelehnt (Lost)" value={results.lost || 0} color="red" total={total} />,
      <ResultBar key="bedenkzeit" label="Bedenkzeit" value={results.bedenkzeit || 0} color="yellow" total={total} />,
      <ResultBar key="verschoben" label="Verschoben" value={results.verschoben || 0} color="blue" total={total} />,
      <ResultBar key="noShow" label="No-Show" value={results.noShow || 0} color="red" total={total} />
    )
  } else if (type === 'servicegespraech') {
    resultBars.push(
      <ResultBar key="stattgefunden" label="Stattgefunden" value={results.stattgefunden || 0} color="green" total={total} />,
      <ResultBar key="crossSell" label="Cross-Sell identifiziert" value={results.crossSell || 0} color="blue" total={total} />,
      <ResultBar key="ausgefallen" label="Ausgefallen" value={results.ausgefallen || 0} color="orange" total={total} />,
      <ResultBar key="verschoben" label="Verschoben" value={results.verschoben || 0} color="blue" total={total} />
    )
  } else if (type === 'vorqualifizierung') {
    resultBars.push(
      <ResultBar key="qualifiziert" label="Qualifiziert → Erstgespräch buchen" value={results.qualifiziert || 0} color="green" total={total} />,
      <ResultBar key="unqualifiziert" label="Unqualifiziert" value={results.unqualifiziert || 0} color="red" total={total} />,
      <ResultBar key="followup" label="Follow-up nötig" value={results.followup || 0} color="yellow" total={total} />,
      <ResultBar key="nichtErreicht" label="Nicht erreicht" value={results.nichtErreicht || 0} color="orange" total={total} />,
      <ResultBar key="keinInteresse" label="Kein Interesse" value={results.keinInteresse || 0} color="red" total={total} />
    )
  }

  return (
    <div className="stat-card" style={{ marginBottom: '20px', background: '#1a1f2e', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '20px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>
        Ergebnisse Breakdown
      </h3>
      {resultBars}
    </div>
  )
}

export default function AppointmentTypeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const type = params.type as string
  
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [loading, setLoading] = useState(true)
  const [calendlyEvents, setCalendlyEvents] = useState<any[]>([])
  const [customActivities, setCustomActivities] = useState<any[]>([])
  const [mergedData, setMergedData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'debug'>('overview')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState(30)
  const [dateRangeMode, setDateRangeMode] = useState<'preset' | 'custom'>('preset')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const typeConfig = ACTIVITY_TYPES[type]

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUserRole(data.role)
        if (data.role !== 'admin') {
          router.push('/dashboard')
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
      })
  }, [router])

  // Berechne Datum-Range
  const dateRange = useMemo(() => {
    if (dateRangeMode === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      }
    }
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }, [timeRange, dateRangeMode, customStartDate, customEndDate])

  useEffect(() => {
    if (userRole === 'admin' && typeConfig) {
      loadData()
    }
  }, [type, dateRange, userRole])

  const loadData = async () => {
    if (!typeConfig) return
    setLoading(true)
    try {
      // Lade Calendly Events
      const eventsParams = new URLSearchParams({
        limit: '10000',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      const eventsResponse = await fetch(`/api/dashboard/calendly/events?${eventsParams}`)
      const events = eventsResponse.ok ? await eventsResponse.json() : []

      // Filtere nach Event Type Name
      const filteredEvents = events.filter((event: any) => {
        const eventTypeName = (event.event_type_name || event.event_name || '').toLowerCase()
        const typeName = typeConfig.displayName.toLowerCase()
        const typeVariants = [
          typeName,
          typeName.replace('gespräch', '').replace('gespraech', ''),
          type.replace('gespraech', '').replace('gespräch', ''),
          type.replace('gespraech', ' gespräch'),
        ]
        return typeVariants.some(variant => 
          eventTypeName.includes(variant.toLowerCase()) || 
          variant.toLowerCase().includes(eventTypeName)
        )
      })

      // Lade Custom Activities
      const activitiesParams = new URLSearchParams({
        activityType: type,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      const activitiesResponse = await fetch(`/api/dashboard/custom-activities/by-type?${activitiesParams}`)
      const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : { activities: [] }

      setCalendlyEvents(filteredEvents)
      setCustomActivities(activitiesData.activities || [])

      // Merge Daten
      const merged = mergeEventsWithActivities(filteredEvents, activitiesData.activities || [])
      setMergedData(merged)
    } catch (error: any) {
      console.error('[AppointmentTypeDetail] Fehler beim Laden:', error)
    } finally {
      setLoading(false)
    }
  }

  const mergeEventsWithActivities = (events: any[], activities: any[]) => {
    return events.map(event => {
      const eventDate = new Date(event.start_time)
      const eventEmail = event.invitee_email?.toLowerCase() || event.lead_email?.toLowerCase()

      const matchedActivity = activities.find(activity => {
        const activityDate = new Date(activity.date_created || activity.created || activity.activity_at)
        const daysDiff = Math.abs((eventDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
        
        const activityEmail = activity.lead?.email?.toLowerCase() || 
                             activity.invitee_email?.toLowerCase() ||
                             activity.email?.toLowerCase() ||
                             activity.lead_email?.toLowerCase()
        
        const emailMatch = eventEmail && activityEmail && 
                         eventEmail.trim() === activityEmail.trim()
        
        const leadIdMatch = event.lead_close_id && activity.lead_id && 
                           (activity.lead_id === event.lead_close_id)
        
        const dbLeadIdMatch = event.lead_id && activity.lead_db_id && 
                             (activity.lead_db_id === event.lead_id)
        
        const dateMatch = daysDiff <= 3
        
        return (emailMatch || leadIdMatch || dbLeadIdMatch) && dateMatch
      })

      const matchStatus = matchedActivity 
        ? 'matched' 
        : eventDate < new Date() 
        ? 'missing' 
        : 'pending'

      return {
        ...event,
        activity: matchedActivity,
        matchStatus,
        activityResult: matchedActivity 
          ? (matchedActivity.result || 'Nicht ausgefüllt')
          : null
      }
    })
  }

  const availableAdvisors = useMemo(() => {
    const advisors = new Set<string>()
    mergedData.forEach(item => {
      const advisor = item.host_name || item.user_name
      if (advisor) advisors.add(advisor)
    })
    return Array.from(advisors).sort()
  }, [mergedData])

  const filteredMergedData = useMemo(() => {
    if (selectedAdvisors.length === 0) return mergedData
    return mergedData.filter(item => {
      const advisor = item.host_name || item.user_name
      return advisor && selectedAdvisors.includes(advisor)
    })
  }, [mergedData, selectedAdvisors])

  const filteredStats = useMemo(() => {
    const planned = filteredMergedData.length
    const documented = filteredMergedData.filter(item => item.activity).length
    const completion = planned > 0 ? Math.round((documented / planned) * 100 * 10) / 10 : 0
    return { planned, documented, completion }
  }, [filteredMergedData])

  const results = useMemo(() => {
    if (!typeConfig) return {}
    
    const resultCounts: any = {}
    const filteredActivities = filteredMergedData
      .filter(item => item.activity)
      .map(item => item.activity)

    filteredActivities.forEach((activity: any) => {
      const result = activity.result || 'Nicht ausgefüllt'
      
      if (type === 'erstgespraech' || type === 'konzeptgespraech') {
        if (result === 'Stattgefunden') resultCounts.stattgefunden = (resultCounts.stattgefunden || 0) + 1
        else if (result === 'No-Show') resultCounts.noShow = (resultCounts.noShow || 0) + 1
        else if (result === 'Ausgefallen (Kunde)') resultCounts.ausgefallenKunde = (resultCounts.ausgefallenKunde || 0) + 1
        else if (result === 'Ausgefallen (Berater)') resultCounts.ausgefallenBerater = (resultCounts.ausgefallenBerater || 0) + 1
        else if (result === 'Verschoben') resultCounts.verschoben = (resultCounts.verschoben || 0) + 1
      } else if (type === 'umsetzungsgespraech') {
        if (result.includes('Won') || result.includes('Abgeschlossen')) resultCounts.won = (resultCounts.won || 0) + 1
        else if (result.includes('Lost') || result.includes('Abgelehnt')) resultCounts.lost = (resultCounts.lost || 0) + 1
        else if (result === 'Bedenkzeit') resultCounts.bedenkzeit = (resultCounts.bedenkzeit || 0) + 1
        else if (result === 'Verschoben') resultCounts.verschoben = (resultCounts.verschoben || 0) + 1
        else if (result === 'No-Show') resultCounts.noShow = (resultCounts.noShow || 0) + 1
      } else if (type === 'servicegespraech') {
        if (result === 'Stattgefunden') resultCounts.stattgefunden = (resultCounts.stattgefunden || 0) + 1
        else if (result === 'Cross-Sell identifiziert') resultCounts.crossSell = (resultCounts.crossSell || 0) + 1
        else if (result === 'Ausgefallen') resultCounts.ausgefallen = (resultCounts.ausgefallen || 0) + 1
        else if (result === 'Verschoben') resultCounts.verschoben = (resultCounts.verschoben || 0) + 1
      } else if (type === 'vorqualifizierung') {
        if (result.includes('Qualifiziert')) resultCounts.qualifiziert = (resultCounts.qualifiziert || 0) + 1
        else if (result === 'Unqualifiziert') resultCounts.unqualifiziert = (resultCounts.unqualifiziert || 0) + 1
        else if (result === 'Follow-up nötig') resultCounts.followup = (resultCounts.followup || 0) + 1
        else if (result === 'Nicht erreicht') resultCounts.nichtErreicht = (resultCounts.nichtErreicht || 0) + 1
        else if (result === 'Kein Interesse') resultCounts.keinInteresse = (resultCounts.keinInteresse || 0) + 1
      }
    })

    return resultCounts
  }, [filteredMergedData, type, typeConfig])

  const handleSyncCustomActivities = async () => {
    setSyncing(true)
    setSyncMessage('Synchronisiere Custom Activities...')
    try {
      const response = await fetch('/api/dashboard/custom-activities/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 90 })
      })
      if (!response.ok) throw new Error('Failed to sync')
      const result = await response.json()
      setSyncMessage(`✅ ${result.synced || 0} Custom Activities synchronisiert, ${result.matched || 0} gematched`)
      await loadData()
      setTimeout(() => setSyncMessage(null), 3000)
    } catch (error: any) {
      setSyncMessage('❌ Fehler: ' + error.message)
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  if (!typeConfig) {
    return (
      <div className="min-h-screen bg-[#0a0e14] text-[#e5e7eb] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-6">
            <p>Ungültiger Termintyp: {type}</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0e14] text-[#e5e7eb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a90e2] mx-auto"></div>
          <p className="mt-4 text-[rgba(255,255,255,0.6)]">Lade {typeConfig.displayName} Details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e5e7eb] p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-[1920px] mx-auto">
        {/* Zurück-Button */}
        <div className="mb-5">
          <button
            onClick={() => router.push('/sales-dashboard/analyse')}
            className="px-4 py-2 bg-[rgba(74,144,226,0.1)] border border-[rgba(74,144,226,0.3)] rounded-md text-[#4a90e2] text-sm font-medium hover:bg-[rgba(74,144,226,0.2)] transition-colors"
          >
            ← Zurück zur Analyse
          </button>
        </div>

        <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-3 sm:gap-4 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold">📋 {typeConfig.displayName} - Detailansicht</h2>
            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={handleSyncCustomActivities}
                disabled={syncing}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  syncing
                    ? 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] cursor-not-allowed'
                    : 'bg-[rgba(14,166,110,0.2)] border border-[rgba(14,166,110,0.5)] text-[#0ea66e] hover:bg-[rgba(14,166,110,0.3)]'
                }`}
              >
                {syncing ? '⏳ Synchronisiere...' : '🔄 Sync Activities'}
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[rgba(74,144,226,0.2)] border border-[rgba(74,144,226,0.5)] text-[#4a90e2]'
                    : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                Übersicht
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'debug'
                    ? 'bg-[rgba(227,160,8,0.2)] border border-[rgba(227,160,8,0.5)] text-[#e3a008]'
                    : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                🔍 Debug
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              syncMessage.includes('✅') 
                ? 'bg-[rgba(14,166,110,0.1)] border border-[rgba(14,166,110,0.2)] text-[#0ea66e]'
                : 'bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.2)] text-[#dc2626]'
            }`}>
              {syncMessage}
            </div>
          )}

          {/* Zeitraum-Filter */}
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <label className="text-sm text-[rgba(255,255,255,0.6)]">Zeitraum:</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="dateRangeMode"
                  value="preset"
                  checked={dateRangeMode === 'preset'}
                  onChange={(e) => setDateRangeMode(e.target.value as 'preset' | 'custom')}
                  className="cursor-pointer"
                />
                <span>Vordefiniert</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="dateRangeMode"
                  value="custom"
                  checked={dateRangeMode === 'custom'}
                  onChange={(e) => setDateRangeMode(e.target.value as 'preset' | 'custom')}
                  className="cursor-pointer"
                />
                <span>Eigener Zeitraum</span>
              </label>
            </div>
            {dateRangeMode === 'preset' ? (
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="px-3 py-1 bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-md text-sm text-[#e5e7eb]"
              >
                <option value="7">Letzte 7 Tage</option>
                <option value="14">Letzte 14 Tage</option>
                <option value="30">Letzte 30 Tage</option>
                <option value="90">Letzte 90 Tage</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1 bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-md text-sm text-[#e5e7eb]"
                />
                <span className="text-sm text-[rgba(255,255,255,0.6)]">bis</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1 bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-md text-sm text-[#e5e7eb]"
                />
              </div>
            )}
          </div>

          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-4">🔍 Debug-Informationen</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-[rgba(255,255,255,0.6)] mb-2">Geladene Daten:</h4>
                  <div className="p-3 bg-[rgba(255,255,255,0.02)] rounded-md text-xs font-mono">
                    <div>Calendly Events: {calendlyEvents.length}</div>
                    <div>Custom Activities: {customActivities.length}</div>
                    <div>Merged Data: {mergedData.length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Berater-Filter */}
              {availableAdvisors.length > 0 && (
                <div className="mb-5 p-3 bg-[rgba(255,255,255,0.02)] rounded-md">
                  <label className="block text-xs text-[rgba(255,255,255,0.6)] mb-2 font-medium">
                    Berater filtern:
                  </label>
                  <div className="flex flex-wrap gap-3 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedAdvisors.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAdvisors([])
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span>Alle</span>
                    </label>
                    {availableAdvisors.map(advisor => (
                      <label key={advisor} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedAdvisors.includes(advisor)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAdvisors([...selectedAdvisors, advisor])
                            } else {
                              setSelectedAdvisors(selectedAdvisors.filter(a => a !== advisor))
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <span>{advisor}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-4">
                  <div className="text-xs text-[rgba(255,255,255,0.4)] uppercase mb-1">Geplant (Calendly)</div>
                  <div className="text-4xl font-bold text-[#4a90e2]">{filteredStats.planned}</div>
                </div>
                <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-4">
                  <div className="text-xs text-[rgba(255,255,255,0.4)] uppercase mb-1">Dokumentiert</div>
                  <div className="text-4xl font-bold text-[#0ea66e]">{filteredStats.documented}</div>
                </div>
                <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-4">
                  <div className="text-xs text-[rgba(255,255,255,0.4)] uppercase mb-1">Completion</div>
                  <div className={`text-4xl font-bold ${
                    filteredStats.completion < 80 ? 'text-[#dc2626]' : filteredStats.completion < 100 ? 'text-[#e3a008]' : 'text-[#0ea66e]'
                  }`}>
                    {filteredStats.completion}%
                  </div>
                </div>
              </div>

              {/* Results Breakdown */}
              <ResultsBreakdown results={results} type={type} />

              {/* Detail Table */}
              <div className="mt-5">
                <h3 className="text-base font-semibold mb-4">
                  Alle Termine im Detail {selectedAdvisors.length > 0 && `(${selectedAdvisors.length} Berater ausgewählt)`}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.1)]">
                        <th className="text-left p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Datum</th>
                        <th className="text-left p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Kunde</th>
                        <th className="text-left p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Berater</th>
                        <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Calendly Status</th>
                        <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Activity Result</th>
                        <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Match Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMergedData.map((item, idx) => {
                        const eventDate = new Date(item.start_time)
                        const isPast = eventDate < new Date()
                        
                        return (
                          <tr 
                            key={idx}
                            className={`border-b border-[rgba(255,255,255,0.05)] ${
                              item.matchStatus === 'missing' && isPast
                                ? 'bg-[rgba(220,38,38,0.05)]'
                                : item.matchStatus === 'matched'
                                ? 'bg-[rgba(14,166,110,0.05)]'
                                : ''
                            }`}
                          >
                            <td className="p-3 text-sm">
                              {eventDate.toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3 text-sm">{item.invitee_name || item.lead_name || '-'}</td>
                            <td className="p-3 text-sm">{item.host_name || '-'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.status === 'active' 
                                  ? 'bg-[rgba(14,166,110,0.1)] text-[#0ea66e]' 
                                  : 'bg-[rgba(220,38,38,0.1)] text-[#dc2626]'
                              }`}>
                                {item.status === 'active' ? 'Aktiv' : 'Abgesagt'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {item.activityResult ? (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-[rgba(74,144,226,0.1)] text-[#4a90e2]">
                                  {item.activityResult}
                                </span>
                              ) : (
                                <span className="text-[rgba(255,255,255,0.3)]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.matchStatus === 'matched'
                                  ? 'bg-[rgba(14,166,110,0.1)] text-[#0ea66e]'
                                  : item.matchStatus === 'missing'
                                  ? 'bg-[rgba(220,38,38,0.1)] text-[#dc2626]'
                                  : 'bg-[rgba(227,160,8,0.1)] text-[#e3a008]'
                              }`}>
                                {item.matchStatus === 'matched' ? '✅ Matched' : 
                                 item.matchStatus === 'missing' ? '❌ Fehlt' : 
                                 '⏳ Pending'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

