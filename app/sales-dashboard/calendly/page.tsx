"use client"
export const runtime = "nodejs";

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

export default function CalendlyDashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [loading, setLoading] = useState(true)
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [monthsBack, setMonthsBack] = useState(6)
  
  // Forecast States
  const [forecastDays, setForecastDays] = useState(30)
  const [forecastEvents, setForecastEvents] = useState<any[]>([])
  const [filteredForecastEvents, setFilteredForecastEvents] = useState<any[]>([])
  const [isForecastSyncing, setIsForecastSyncing] = useState(false)
  const [forecastSyncMessage, setForecastSyncMessage] = useState('')
  
  // Forecast Filter States
  const [forecastHostFilter, setForecastHostFilter] = useState<string[]>([])
  const [forecastEventTypeFilter, setForecastEventTypeFilter] = useState<string[]>([])
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string[]>(['active'])
  const [hostFilter, setHostFilter] = useState<string[]>([])
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([])
  const [filterDateRange, setFilterDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null })

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-store'
        })
        if (!response.ok) {
          router.push('/login')
          setLoading(false)
          return
        }
        const user = await response.json()
        if (user.role === 'admin') {
          setUserRole('admin')
          loadAllEvents()
        } else {
          router.push('/dashboard')
          setLoading(false)
          return
        }
        setLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  useEffect(() => {
    applyFilters()
  }, [allEvents, statusFilter, hostFilter, eventTypeFilter, filterDateRange])

  useEffect(() => {
    if (allEvents && allEvents.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + forecastDays)
      endDate.setHours(23, 59, 59, 999)

      const forecast = allEvents.filter((event: any) => {
        if (!event.start_time) return false
        const eventDate = new Date(event.start_time)
        if (isNaN(eventDate.getTime())) return false
        const isInRange = eventDate >= today && eventDate <= endDate
        const isActive = event.status === 'active'
        return isInRange && isActive
      })

      setForecastEvents(forecast)
    } else {
      setForecastEvents([])
    }
  }, [allEvents, forecastDays])

  useEffect(() => {
    let filtered = [...forecastEvents]
    if (forecastHostFilter.length > 0) {
      filtered = filtered.filter(e => forecastHostFilter.includes(e.host_name))
    }
    if (forecastEventTypeFilter.length > 0) {
      filtered = filtered.filter(e => {
        const eventType = e.event_type_name || e.event_name
        return forecastEventTypeFilter.includes(eventType)
      })
    }
    setFilteredForecastEvents(filtered)
  }, [forecastEvents, forecastHostFilter, forecastEventTypeFilter])

  useEffect(() => {
    // Verwende alle Events (nicht nur Forecast-Events) für die Filter-Optionen
    if (allEvents && allEvents.length > 0) {
      const allHosts = [...new Set(allEvents.map((e: any) => e.host_name).filter(Boolean))].sort() as string[]
      const allEventTypes = [...new Set(allEvents.map((e: any) => e.event_type_name || e.event_name).filter(Boolean))].sort() as string[]
      if (forecastHostFilter.length === 0) {
        setForecastHostFilter(allHosts)
      }
      if (forecastEventTypeFilter.length === 0) {
        // Für Event Types: Nur die, die auch in Forecast-Events vorkommen (falls vorhanden)
        const forecastEventTypes = forecastEvents && forecastEvents.length > 0
          ? [...new Set(forecastEvents.map((e: any) => e.event_type_name || e.event_name).filter(Boolean))].sort() as string[]
          : allEventTypes
        setForecastEventTypeFilter(forecastEventTypes)
      }
    }
  }, [allEvents, forecastEvents])

  const loadAllEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/calendly/events?limit=10000')
      if (!response.ok) throw new Error('Failed to fetch events')
      const eventsData = await response.json()
      setAllEvents(eventsData || [])
      initializeFilters(eventsData || [])
    } catch (error: any) {
      console.error('[CalendlyDashboard] Fehler beim Laden:', error)
      setAllEvents([])
      setFilteredEvents([])
    } finally {
      setLoading(false)
    }
  }

  const initializeFilters = (events: any[]) => {
    if (!events || events.length === 0) return
    
    const allStatuses = [...new Set(events.map((e: any) => e.status).filter(Boolean))].sort()
    const allHosts = [...new Set(events.map((e: any) => e.host_name).filter(Boolean))].sort()
    const allEventTypes = [...new Set(events.map((e: any) => e.event_type_name || e.event_name).filter(Boolean))].sort()
    
    setStatusFilter(allStatuses.length > 0 ? allStatuses : ['active'])
    setHostFilter(allHosts)
    setEventTypeFilter(allEventTypes)
    
    if (events.length > 0) {
      const dates = events.map((e: any) => new Date(e.start_time)).filter(d => !isNaN(d.getTime()))
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        setFilterDateRange({ start: minDate, end: maxDate })
      }
    }
  }

  const applyFilters = () => {
    if (!allEvents || allEvents.length === 0) {
      setFilteredEvents([])
      return
    }

    let filtered = [...allEvents]

    if (statusFilter.length > 0) {
      filtered = filtered.filter(e => statusFilter.includes(e.status))
    }

    if (hostFilter.length > 0) {
      filtered = filtered.filter(e => hostFilter.includes(e.host_name))
    }

    if (eventTypeFilter.length > 0) {
      filtered = filtered.filter(e => {
        const eventType = e.event_type_name || e.event_name
        return eventTypeFilter.includes(eventType)
      })
    }

    if (filterDateRange.start && filterDateRange.end) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.start_time)
        return eventDate >= filterDateRange.start! && eventDate <= filterDateRange.end!
      })
    }

    setFilteredEvents(filtered)
  }

  const COLORS = ['#4a90e2', '#0ea66e', '#e3a008', '#dc2626', '#06b6d4']

  const stats = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) {
      console.log('[CalendlyDashboard] Keine gefilterten Events:', { filteredEvents, allEvents: allEvents?.length })
      return {
        totalEvents: 0,
        activeEvents: 0,
        canceledEvents: 0,
        uniqueClients: 0,
        cancelRate: 0,
        avgDuration: 0,
        eventTypes: [],
        eventsByDay: [],
        bestTime: [],
        weekdayStats: []
      }
    }
    
    console.log('[CalendlyDashboard] Berechne Stats für', filteredEvents.length, 'Events')

    const total = filteredEvents.length
    const active = filteredEvents.filter(e => e.status === 'active').length
    const canceled = filteredEvents.filter(e => e.status === 'canceled').length
    const uniqueClients = new Set(filteredEvents.map(e => e.invitee_email).filter(Boolean)).size
    
    const eventTypeCounts: Record<string, any> = {}
    filteredEvents.forEach(e => {
      const type = e.event_type_name || e.event_name || 'Unbekannt'
      if (!eventTypeCounts[type]) {
        eventTypeCounts[type] = { count: 0, active: 0, canceled: 0 }
      }
      eventTypeCounts[type].count++
      if (e.status === 'active') eventTypeCounts[type].active++
      if (e.status === 'canceled') eventTypeCounts[type].canceled++
    })
    const eventTypes = Object.entries(eventTypeCounts)
      .map(([name, data]: [string, any]) => ({
        event_name: name,
        count: data.count,
        active: data.active,
        canceled: data.canceled
      }))
      .sort((a, b) => b.count - a.count)

    const dayCounts: Record<string, { active: number, canceled: number }> = {}
    filteredEvents.forEach(e => {
      const date = new Date(e.start_time).toISOString().split('T')[0]
      if (!dayCounts[date]) {
        dayCounts[date] = { active: 0, canceled: 0 }
      }
      if (e.status === 'active') dayCounts[date].active++
      if (e.status === 'canceled') dayCounts[date].canceled++
    })
    const eventsByDay = Object.entries(dayCounts)
      .map(([date, counts]) => ({
        date,
        active: counts.active,
        canceled: counts.canceled,
        count: counts.active + counts.canceled
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-90)

    const hourCounts: Record<number, number> = {}
    filteredEvents.forEach(e => {
      const hour = new Date(e.start_time).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const bestTime = Object.entries(hourCounts)
      .map(([hour, totalEvents]) => ({
        hour: parseInt(hour),
        totalEvents
      }))
      .filter(h => h.totalEvents >= 2)
      .sort((a, b) => b.totalEvents - a.totalEvents)

    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const weekdayCounts: Record<string, number> = {}
    filteredEvents.forEach(e => {
      const weekday = weekdayNames[new Date(e.start_time).getDay()]
      weekdayCounts[weekday] = (weekdayCounts[weekday] || 0) + 1
    })
    const weekdayStats = Object.entries(weekdayCounts)
      .map(([weekday, count]) => ({ weekday, count }))
      .sort((a, b) => {
        const order = weekdayNames
        return order.indexOf(a.weekday) - order.indexOf(b.weekday)
      })

    const durations = filteredEvents
      .map(e => e.duration_minutes)
      .filter(d => d && d > 0)
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0

    const result = {
      totalEvents: total,
      activeEvents: active,
      canceledEvents: canceled,
      uniqueClients,
      cancelRate: total > 0 ? Math.round((canceled / total) * 100 * 10) / 10 : 0,
      avgDuration,
      eventTypes,
      eventsByDay,
      bestTime,
      weekdayStats
    }
    
    console.log('[CalendlyDashboard] Stats berechnet:', {
      totalEvents: result.totalEvents,
      eventTypesCount: result.eventTypes.length,
      eventsByDayCount: result.eventsByDay.length
    })
    
    return result
  }, [filteredEvents])

  const teamAnalysis = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return []
    
    const hostStats: Record<string, { total: number, active: number, canceled: number }> = {}
    filteredEvents.forEach(event => {
      const hostName = event.host_name || 'Unbekannt'
      if (!hostStats[hostName]) {
        hostStats[hostName] = { total: 0, active: 0, canceled: 0 }
      }
      hostStats[hostName].total++
      if (event.status === 'active') {
        hostStats[hostName].active++
      } else if (event.status === 'canceled') {
        hostStats[hostName].canceled++
      }
    })

    return Object.entries(hostStats).map(([name, stats]) => ({
      name,
      total: stats.total,
      active: stats.active,
      canceled: stats.canceled,
      cancelRate: stats.total > 0 ? Math.round((stats.canceled / stats.total) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.total - a.total)
  }, [filteredEvents])

  const forecastData = useMemo(() => {
    if (!filteredForecastEvents || filteredForecastEvents.length === 0) {
      return {
        forecastByDay: [],
        forecastByHost: [],
        avgPerDay: 0,
        totalEvents: 0,
        uniqueHosts: 0
      }
    }

    const dayCounts: Record<string, number> = {}
    filteredForecastEvents.forEach(event => {
      const date = new Date(event.start_time).toISOString().split('T')[0]
      dayCounts[date] = (dayCounts[date] || 0) + 1
    })
    const forecastByDay = Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const hostCounts: Record<string, number> = {}
    filteredForecastEvents.forEach(event => {
      const hostName = event.host_name || 'Unbekannt'
      hostCounts[hostName] = (hostCounts[hostName] || 0) + 1
    })
    const forecastByHost = Object.entries(hostCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const totalEvents = filteredForecastEvents.length
    const avgPerDay = forecastDays > 0 ? Math.round((totalEvents / forecastDays) * 10) / 10 : 0
    const uniqueHosts = Object.keys(hostCounts).length

    return {
      forecastByDay,
      forecastByHost,
      avgPerDay,
      totalEvents,
      uniqueHosts
    }
  }, [filteredForecastEvents, forecastDays])

  const handleForecastSync = async () => {
    setIsForecastSyncing(true)
    setForecastSyncMessage('')
    try {
      setForecastSyncMessage(`⏳ Lade Forecast-Daten für nächste ${forecastDays} Tage...`)
      await loadAllEvents()
      setForecastSyncMessage(`✅ Forecast-Daten aktualisiert!`)
      setTimeout(() => setForecastSyncMessage(''), 3000)
    } catch (error: any) {
      console.error('[Forecast] Fehler beim Synchronisieren:', error)
      setForecastSyncMessage(`❌ Fehler: ${error.message || 'Unbekannter Fehler'}`)
      setTimeout(() => setForecastSyncMessage(''), 5000)
    } finally {
      setIsForecastSyncing(false)
    }
  }

  const handleCalendlySync = async () => {
    setIsSyncing(true)
    setSyncMessage('')
    try {
      const daysBack = monthsBack * 30
      setSyncMessage(`⏳ Synchronisiere letzte ${monthsBack} Monate... (kann länger dauern)`)
      const response = await fetch('/api/dashboard/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'calendly', daysBack })
      })
      const result = await response.json()
      setSyncMessage(`✅ ${result.message || `Calendly-Daten erfolgreich synchronisiert! ${result.syncedCount || 0} Events`}`)
      setTimeout(() => setSyncMessage(''), 8000)
      await loadAllEvents()
    } catch (error: any) {
      console.error('[CalendlyDashboard] Fehler beim Synchronisieren:', error)
      setSyncMessage(`❌ Fehler beim Synchronisieren: ${error.message || 'Unbekannter Fehler'}`)
      setTimeout(() => setSyncMessage(''), 8000)
    } finally {
      setIsSyncing(false)
    }
  }

  const exportToCSV = () => {
    if (!filteredEvents || filteredEvents.length === 0) return
    
    const headers = ['Datum', 'Uhrzeit', 'Termintyp', 'Berater', 'Kunde', 'E-Mail', 'Status', 'Dauer (Min)']
    const rows = filteredEvents.map(event => {
      const startDate = new Date(event.start_time)
      return [
        startDate.toLocaleDateString('de-DE'),
        startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        event.event_type_name || event.event_name || '-',
        event.host_name || '-',
        event.invitee_name || '-',
        event.invitee_email || '-',
        event.status === 'active' ? 'Aktiv' : 'Abgesagt',
        event.duration_minutes || '-'
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `calendly_termine_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const availableStatuses = useMemo(() => {
    return [...new Set(allEvents.map(e => e.status).filter(Boolean))].sort()
  }, [allEvents])

  const availableHosts = useMemo(() => {
    return [...new Set(allEvents.map(e => e.host_name).filter(Boolean))].sort()
  }, [allEvents])

  const availableEventTypes = useMemo(() => {
    return [...new Set(allEvents.map(e => e.event_type_name || e.event_name).filter(Boolean))].sort()
  }, [allEvents])

  return (
    <AuthGuard>
      {loading ? (
        <div className="loading-container min-h-[200px] flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="loading-spinner w-6 h-6 border-2 border-b-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Lade Calendly-Daten...</p>
        </div>
      ) : userRole !== 'admin' ? null : !allEvents || allEvents.length === 0 ? (
      <div className="dashboard p-2 sm:p-4 lg:p-6">
        <div className="w-full max-w-[1920px] mx-auto">
          <div className="stat-card full-width mb-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">🔄 Daten synchronisieren</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Monate zurück:</label>
                <select
                  value={monthsBack}
                  onChange={(e) => setMonthsBack(parseInt(e.target.value))}
                  disabled={isSyncing}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                >
                  <option value={1}>1 Monat</option>
                  <option value={3}>3 Monate</option>
                  <option value={6}>6 Monate</option>
                  <option value={9}>9 Monate</option>
                  <option value={12}>12 Monate</option>
                </select>
              </div>
              <button
                onClick={handleCalendlySync}
                disabled={isSyncing}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-700 text-red-400 rounded text-xs font-medium border border-red-600/50"
              >
                {isSyncing ? '⏳' : '🔄'} {isSyncing ? 'Synchronisiere...' : 'Daten laden'}
              </button>
              {syncMessage && (
                <div className={`px-3 py-2 rounded text-xs ${
                  syncMessage.includes('✅') ? 'bg-green-900/30 text-green-400' :
                  syncMessage.includes('⏳') ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {syncMessage}
                </div>
              )}
            </div>
          </div>
          <div className="stat-card full-width">
            <p className="text-gray-400">Keine Calendly-Daten verfügbar. Bitte synchronisieren.</p>
          </div>
        </div>
      </div>
      ) : (
        <div className="dashboard p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-[1920px] mx-auto space-y-4">
        {/* Forecast Section */}
        <div className="stat-card full-width">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-gray-300">📅 Geplante Termine (Forecast)</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <select 
                value={forecastDays} 
                onChange={(e) => setForecastDays(parseInt(e.target.value))}
                disabled={isForecastSyncing}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xs"
              >
                <option value={7}>Nächste 7 Tage</option>
                <option value={14}>Nächste 14 Tage</option>
                <option value={30}>Nächste 30 Tage</option>
                <option value={90}>Nächste 90 Tage</option>
              </select>
              <button
                onClick={handleForecastSync}
                disabled={isForecastSyncing}
                className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 disabled:bg-gray-700 text-cyan-400 rounded text-xs font-medium border border-cyan-600/50"
              >
                {isForecastSyncing ? '⏳' : '🔄'} {isForecastSyncing ? 'Lädt...' : 'Synchronisieren'}
              </button>
              {forecastSyncMessage && (
                <div className={`px-3 py-2 rounded text-xs ${
                  forecastSyncMessage.includes('✅') ? 'bg-green-900/30 text-green-400' :
                  forecastSyncMessage.includes('⏳') ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {forecastSyncMessage}
                </div>
              )}
            </div>
          </div>

          {/* Forecast Filter */}
          {allEvents && allEvents.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase">Filter</h3>
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Berater:</label>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {/* Zeige alle Berater aus allen Events, nicht nur aus Forecast-Events */}
                    {availableHosts.map((host: string) => (
                      <label key={host} className="flex items-center gap-1.5 text-xs text-white cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={forecastHostFilter.includes(host)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForecastHostFilter([...forecastHostFilter, host])
                            } else {
                              setForecastHostFilter(forecastHostFilter.filter(h => h !== host))
                            }
                          }}
                          className="cursor-pointer w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                        />
                        <span>{host}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Gesprächsart:</label>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {/* Zeige nur Event Types, die in Forecast-Events vorkommen (falls vorhanden) */}
                    {(() => {
                      const forecastEventTypes = forecastEvents && forecastEvents.length > 0
                        ? [...new Set(forecastEvents.map((e: any) => e.event_type_name || e.event_name).filter(Boolean))].sort()
                        : availableEventTypes
                      return forecastEventTypes.map((type: string) => (
                        <label key={type} className="flex items-center gap-1.5 text-xs text-white cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={forecastEventTypeFilter.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForecastEventTypeFilter([...forecastEventTypeFilter, type])
                              } else {
                                setForecastEventTypeFilter(forecastEventTypeFilter.filter(t => t !== type))
                              }
                            }}
                            className="cursor-pointer w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                          />
                          <span>{type}</span>
                        </label>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Metrics Grid */}
          <div className="key-metrics-row mt-4">
            <div className="metric-card">
              <div className="metric-label">GEPLANTE TERMINE</div>
              <div className="metric-value" style={{ color: '#06b6d4' }}>
                {forecastData.totalEvents}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Ø PRO TAG</div>
              <div className="metric-value" style={{ color: '#06b6d4' }}>
                {forecastData.avgPerDay}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">AKTIVE BERATER</div>
              <div className="metric-value" style={{ color: '#06b6d4' }}>
                {forecastData.uniqueHosts}
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          {forecastData.forecastByDay && forecastData.forecastByDay.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-medium text-gray-400 mb-3">Timeline</h3>
              <div className="stat-card chart-card">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={forecastData.forecastByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255, 255, 255, 0.4)"
                      style={{ fontSize: '11px' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.4)"
                      style={{ fontSize: '11px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1f2e', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#e5e7eb'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    />
                    <Bar dataKey="count" fill="#06b6d4" name="Geplante Termine" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Forecast by Host */}
          {forecastData.forecastByHost && forecastData.forecastByHost.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-medium text-gray-400 mb-3">Geplante Termine pro Berater</h3>
              <div className="stat-card chart-card">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={forecastData.forecastByHost} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis type="number" stroke="rgba(255, 255, 255, 0.4)" style={{ fontSize: '11px' }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="rgba(255, 255, 255, 0.4)" 
                      style={{ fontSize: '11px' }} 
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1f2e', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#e5e7eb'
                      }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" name="Geplante Termine" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Sync Section */}
        <div className="stat-card full-width">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">🔄 Daten synchronisieren</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Monate zurück:</label>
              <select
                value={monthsBack}
                onChange={(e) => setMonthsBack(parseInt(e.target.value))}
                disabled={isSyncing}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xs"
              >
                <option value={1}>1 Monat</option>
                <option value={3}>3 Monate</option>
                <option value={6}>6 Monate</option>
                <option value={9}>9 Monate</option>
                <option value={12}>12 Monate</option>
              </select>
            </div>
            <button
              onClick={handleCalendlySync}
              disabled={isSyncing}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-700 text-red-400 rounded text-xs font-medium border border-red-600/50"
            >
              {isSyncing ? '⏳' : '🔄'} {isSyncing ? 'Synchronisiere...' : 'Daten laden'}
            </button>
            {syncMessage && (
              <div className={`px-3 py-2 rounded text-xs ${
                syncMessage.includes('✅') ? 'bg-green-900/30 text-green-400' :
                syncMessage.includes('⏳') ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-red-900/30 text-red-400'
              }`}>
                {syncMessage}
              </div>
            )}
          </div>
          {isSyncing && (
            <p className="mt-3 text-xs text-gray-500 italic">
              Bitte warten... Dies kann bei vielen Daten einige Minuten dauern.
            </p>
          )}
        </div>

        {/* Filter Section */}
        <div className="stat-card full-width">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">🔍 Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Status</label>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {availableStatuses.map(status => (
                  <label key={status} className="flex items-center gap-1.5 text-xs text-white cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter([...statusFilter, status])
                        } else {
                          setStatusFilter(statusFilter.filter(s => s !== status))
                        }
                      }}
                      className="cursor-pointer w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                    />
                    <span>{status === 'active' ? 'Aktiv' : 'Abgesagt'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Host/Berater Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Gastgeber</label>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {availableHosts.map(host => (
                  <label key={host} className="flex items-center gap-1.5 text-xs text-white cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={hostFilter.includes(host)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHostFilter([...hostFilter, host])
                        } else {
                          setHostFilter(hostFilter.filter(h => h !== host))
                        }
                      }}
                      className="cursor-pointer w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                    />
                    <span>{host}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Termintyp</label>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {availableEventTypes.map(type => (
                  <label key={type} className="flex items-center gap-1.5 text-xs text-white cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={eventTypeFilter.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEventTypeFilter([...eventTypeFilter, type])
                        } else {
                          setEventTypeFilter(eventTypeFilter.filter(t => t !== type))
                        }
                      }}
                      className="cursor-pointer w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Datum Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Zeitraum</label>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={filterDateRange.start ? filterDateRange.start.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value ? new Date(e.target.value) : null })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                />
                <input
                  type="date"
                  value={filterDateRange.end ? filterDateRange.end.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value ? new Date(e.target.value) : null })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="key-metrics-row mt-4">
          <div className="metric-card">
            <div className="metric-label">GESAMT TERMINE</div>
            <div className="metric-value">{stats.totalEvents || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">AKTIVE</div>
            <div className="metric-value" style={{ color: '#0ea66e' }}>{stats.activeEvents || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">CANCELED</div>
            <div className="metric-value" style={{ color: '#dc2626' }}>{stats.canceledEvents || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">EINZIGARTIGE KUNDEN</div>
            <div className="metric-value" style={{ color: '#4a90e2' }}>{stats.uniqueClients || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Ø DAUER (MIN)</div>
            <div className="metric-value" style={{ color: '#e3a008' }}>{stats.avgDuration || 0}</div>
          </div>
        </div>

        {/* Analysen Section */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">📈 Analysen</h2>
          
          {/* Events Over Time */}
          <div className="stat-card chart-card full-width mb-4">
            <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Termine pro Tag</h2>
            {stats.eventsByDay && stats.eventsByDay.length > 0 ? (
              <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.eventsByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#e5e7eb"
                      tick={{ fill: '#e5e7eb', fontSize: 12 }}
                      style={{ fontSize: '12px', color: '#e5e7eb' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis 
                      stroke="#e5e7eb"
                      tick={{ fill: '#e5e7eb', fontSize: 12 }}
                      style={{ fontSize: '12px', color: '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1f2e', 
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: '#e5e7eb',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', color: '#e5e7eb' }}
                      iconSize={14}
                    />
                    <Line type="monotone" dataKey="count" stroke="#4a90e2" name="Anzahl Termine" strokeWidth={2} dot={{ fill: '#4a90e2', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                <p>Keine Daten verfügbar (Gefilterte Events: {filteredEvents?.length || 0})</p>
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div className="stats-grid">
            {/* Event Types */}
            <div className="stat-card chart-card">
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Verteilung Termintypen</h2>
              {stats.eventTypes && stats.eventTypes.length > 0 ? (
                <div style={{ height: '280px', width: '100%', minHeight: '280px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats.eventTypes}
                        dataKey="count"
                        nameKey="event_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(props: any) => {
                          const name = props.name || ''
                          const percent = props.percent || 0
                          const shortName = name && name.length > 15 ? name.substring(0, 15) + '...' : name
                          return `${shortName}: ${(percent * 100).toFixed(1)}%`
                        }}
                        labelLine={false}
                        style={{ fontSize: '11px', fill: '#e5e7eb' }}
                      >
                        {stats.eventTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1f2e', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          color: '#e5e7eb',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', color: '#e5e7eb' }}
                        iconSize={14}
                        formatter={(value) => <span style={{ color: '#e5e7eb' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                  <p>Keine Daten verfügbar (Event Types: {stats.eventTypes?.length || 0})</p>
                </div>
              )}
            </div>

            {/* Termintypen nach Status */}
            <div className="stat-card chart-card">
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Termintypen nach Status</h2>
              {stats.eventTypes && stats.eventTypes.length > 0 ? (
                <div style={{ height: '280px', width: '100%', minHeight: '280px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.eventTypes} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        type="number" 
                        stroke="#e5e7eb"
                        tick={{ fill: '#e5e7eb', fontSize: 12 }}
                        style={{ fontSize: '12px', color: '#e5e7eb' }}
                      />
                      <YAxis 
                        dataKey="event_name" 
                        type="category" 
                        stroke="#e5e7eb"
                        style={{ fontSize: '12px', color: '#e5e7eb' }}
                        width={150}
                        tick={{ fill: '#e5e7eb', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1f2e', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          color: '#e5e7eb',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', color: '#e5e7eb' }}
                        iconSize={14}
                        formatter={(value) => <span style={{ color: '#e5e7eb' }}>{value}</span>}
                      />
                      <Bar dataKey="active" stackId="a" fill="#0ea66e" name="Aktiv" />
                      <Bar dataKey="canceled" stackId="a" fill="#dc2626" name="Abgesagt" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                  <p>Keine Daten verfügbar (Event Types: {stats.eventTypes?.length || 0})</p>
                </div>
              )}
            </div>
          </div>

          {/* Team-Analyse */}
          <div className="stats-grid mt-4">
            <div className="stat-card chart-card">
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Termine pro Berater</h2>
              {teamAnalysis && teamAnalysis.length > 0 ? (
                <div style={{ height: '280px', width: '100%', minHeight: '280px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={teamAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        type="number" 
                        stroke="#e5e7eb"
                        tick={{ fill: '#e5e7eb', fontSize: 12 }}
                        style={{ fontSize: '12px', color: '#e5e7eb' }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#e5e7eb"
                        style={{ fontSize: '12px', color: '#e5e7eb' }} 
                        width={120}
                        tick={{ fill: '#e5e7eb', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1f2e', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          color: '#e5e7eb',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', color: '#e5e7eb' }}
                        iconSize={14}
                        formatter={(value) => <span style={{ color: '#e5e7eb' }}>{value}</span>}
                      />
                      <Bar dataKey="total" fill="#4a90e2" name="Gesamt" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                  <p>Keine Daten verfügbar (Team Analysis: {teamAnalysis?.length || 0})</p>
                </div>
              )}
            </div>

            <div className="stat-card chart-card">
              <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Absage-Rate pro Berater</h2>
              {teamAnalysis && teamAnalysis.length > 0 ? (
                <div style={{ height: '280px', width: '100%', minHeight: '280px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={teamAnalysis} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#e5e7eb"
                        style={{ fontSize: '12px', color: '#e5e7eb' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fill: '#e5e7eb', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#e5e7eb"
                        style={{ fontSize: '12px', color: '#e5e7eb' }}
                        tick={{ fill: '#e5e7eb', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1f2e', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          color: '#e5e7eb',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#e5e7eb', fontSize: '12px' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', color: '#e5e7eb' }}
                        iconSize={14}
                        formatter={(value) => <span style={{ color: '#e5e7eb' }}>{value}</span>}
                      />
                      <Bar dataKey="cancelRate" fill="#dc2626" name="Absage-Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                  <p>Keine Daten verfügbar (Team Analysis: {teamAnalysis?.length || 0})</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events Table */}
        {filteredEvents && filteredEvents.length > 0 && (
          <div className="stat-card full-width mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-300">📋 Alle Termine im Detail</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs font-medium border border-blue-600/50"
                >
                  {showAllEvents ? 'Weniger anzeigen' : 'Alle anzeigen'}
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs font-medium border border-green-600/50"
                >
                  📥 Als CSV herunterladen
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-xs text-gray-400 uppercase">Datum</th>
                    <th className="text-left p-3 text-xs text-gray-400 uppercase">Uhrzeit</th>
                    <th className="text-left p-3 text-xs text-gray-400 uppercase">Termintyp</th>
                    <th className="text-left p-3 text-xs text-gray-400 uppercase">Berater</th>
                    <th className="text-left p-3 text-xs text-gray-400 uppercase">Kunde</th>
                    <th className="text-left p-3 text-xs text-gray-400 uppercase">Status</th>
                    <th className="text-left p-3 text-xs text-gray-400 uppercase">Dauer (Min)</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllEvents ? filteredEvents : filteredEvents.slice(0, 20)).map((event) => {
                    const startDate = new Date(event.start_time)
                    return (
                      <tr key={event.id} className="border-b border-gray-800">
                        <td className="p-3 text-xs text-gray-300">
                          {startDate.toLocaleDateString('de-DE', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-3 text-xs text-gray-300">
                          {startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-xs text-gray-300">{event.event_type_name || event.event_name || '-'}</td>
                        <td className="p-3 text-xs text-gray-300">{event.host_name || '-'}</td>
                        <td className="p-3 text-xs text-gray-300">{event.invitee_name || '-'}</td>
                        <td className="p-3 text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            event.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                          }`}>
                            {event.status === 'active' ? 'Aktiv' : 'Abgesagt'}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-300">{event.duration_minutes || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </AuthGuard>
  )
}
