"use client"
export const runtime = "nodejs";

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import KeyMetrics from '@/components/dashboard/KeyMetrics'
import CallStatsChart from '@/components/dashboard/CallStatsChart'
import OutcomesChart from '@/components/dashboard/OutcomesChart'
import BestTimeChart from '@/components/dashboard/BestTimeChart'

export default function TelefonieDashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateRange, setDateRange] = useState<7 | 14 | 30>(7)
  
  // Dashboard Daten
  const [callStats, setCallStats] = useState<any[]>([])
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [bestTime, setBestTime] = useState<any[]>([])
  const [funnelStats, setFunnelStats] = useState<any>(null)
  const [duration, setDuration] = useState<any>(null)
      const [unassignedCalls, setUnassignedCalls] = useState(0)

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
          loadUsers()
          // Standard: letzte 7 Tage
          const end = new Date()
          const start = new Date()
          start.setDate(start.getDate() - 7)
          setEndDate(end.toISOString().split('T')[0])
          setStartDate(start.toISOString().split('T')[0])
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
    if (startDate && endDate) {
      loadDashboardData()
    }
  }, [selectedUser, startDate, endDate])

  const handleDateRangeChange = (days: 7 | 14 | 30) => {
    setDateRange(days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/dashboard/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    }
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedUser && { userId: selectedUser })
      })

      const [statsRes, outcomesRes, bestTimeRes, funnelRes, durationRes, unassignedRes] = await Promise.all([
        fetch(`/api/dashboard/stats/calls?${params}&period=day`),
        fetch(`/api/dashboard/stats/outcomes?${params}`),
        fetch(`/api/dashboard/stats/best-time?${params}`),
        fetch(`/api/dashboard/stats/funnel?${params}`),
        fetch(`/api/dashboard/stats/duration?${params}`),
        fetch(`/api/dashboard/stats/unassigned?${params}`)
      ])

      if (statsRes.ok) {
        const stats = await statsRes.json()
        setCallStats(stats || [])
      }
      if (outcomesRes.ok) {
        const outcomes = await outcomesRes.json()
        setOutcomes(outcomes || [])
      }
      if (bestTimeRes.ok) {
        const bestTime = await bestTimeRes.json()
        setBestTime(bestTime || [])
      }
      if (funnelRes.ok) {
        const funnel = await funnelRes.json()
        console.log('[Dashboard] Funnel Stats geladen:', funnel)
        setFunnelStats(funnel || null)
      }
      if (durationRes.ok) {
        const duration = await durationRes.json()
        setDuration(duration || null)
      }
      if (unassignedRes.ok) {
        const unassignedData = await unassignedRes.json()
        setUnassignedCalls(unassignedData.unassignedCalls || 0)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 Min'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes} Min`
    }
    return `${minutes} Min`
  }

  return (
    <AuthGuard>
      {loading && !callStats.length ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Lade Dashboard-Daten...</p>
          </div>
        </div>
      ) : userRole !== 'admin' ? null : (
        <div className="dashboard p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-[1920px] mx-auto">
        {/* Unassigned Warning */}
        {unassignedCalls > 0 && (
          <div className="unassigned-warning mb-4">
            <span>⚠️ {unassignedCalls} Call{unassignedCalls !== 1 ? 's' : ''} ohne zugeordneten Berater</span>
          </div>
        )}

        {/* Filter */}
        <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">Berater</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle Berater</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || 'Unbekannt'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">Zeitraum</label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(Number(e.target.value) as 7 | 14 | 30)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Letzte 7 Tage</option>
                <option value={14}>Letzte 14 Tage</option>
                <option value={30}>Letzte 30 Tage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">Von</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">Bis</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={loadDashboardData}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Aktualisieren
              </button>
              <button
                onClick={async () => {
                  try {
                    // Berechne daysBack basierend auf dem aktuellen Datumsbereich
                    const daysBack = startDate && endDate 
                      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 7 // +7 Tage Puffer
                      : 7 // Fallback: 7 Tage
                    
                    const res = await fetch('/api/dashboard/sync', { 
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'calls', daysBack })
                    })
                    
                    if (!res.ok) {
                      const errorText = await res.text()
                      console.error('Sync-Fehler Response:', errorText)
                      try {
                        const errorJson = JSON.parse(errorText)
                        alert(`Fehler: ${errorJson.error || 'Unbekannter Fehler'}`)
                      } catch {
                        alert(`Fehler: ${res.status} ${res.statusText}`)
                      }
                      return
                    }
                    
                    const result = await res.json()
                    alert(result.message || 'Synchronisation erfolgreich!')
                    loadDashboardData()
                  } catch (error: any) {
                    console.error('Sync-Fehler:', error)
                    alert(`Fehler bei der Synchronisation: ${error.message}`)
                  }
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                title="Calls von Close CRM synchronisieren"
              >
                ↻ Sync Calls
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <KeyMetrics funnelStats={funnelStats} callStats={callStats} />

        {/* Conversion Funnel */}
        {funnelStats && (
          <div className="stat-card full-width conversion-card mb-4">
            <div className="conversion-funnel-compact">
              <div className="funnel-header-compact">
                <span className="funnel-title">CONVERSION</span>
                <span className="funnel-metrics">
                  Ø {funnelStats.avgAttemptsToReach || 0} Versuche · {funnelStats.meetingRate || 0}% Terminquote
                </span>
              </div>
              <div className="funnel-flow">
                {[
                  { value: funnelStats.leadsCreated || 0, label: 'Leads', rate: 100 },
                  { value: funnelStats.contacted || 0, label: 'Kontaktiert', rate: funnelStats.leadsCreated ? Math.round((funnelStats.contacted / funnelStats.leadsCreated) * 100) : 0 },
                  { value: funnelStats.reached || 0, label: 'Erreicht', rate: funnelStats.contacted ? Math.round((funnelStats.reached / funnelStats.contacted) * 100) : 0 },
                  { value: funnelStats.meetingSet || 0, label: 'Termine', rate: funnelStats.reached ? Math.round((funnelStats.meetingSet / funnelStats.reached) * 100) : 0 }
                ].map((step, index, arr) => (
                  <React.Fragment key={index}>
                    <div className="funnel-step-compact">
                      <div className="step-value-compact">{step.value}</div>
                      <div className="step-label-compact">{step.label}</div>
                      <div className="step-rate-compact">{step.rate}%</div>
                    </div>
                    {index < arr.length - 1 && <div className="funnel-arrow">→</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid - 2x2 */}
        <div className="stats-grid mb-4">
          <div className="stat-card chart-card">
            <h2>Anrufversuche</h2>
            <CallStatsChart data={callStats} />
          </div>

          <div className="stat-card chart-card">
            <h2>Call Outcomes</h2>
            <OutcomesChart data={outcomes} />
          </div>

          <div className="stat-card chart-card">
            <h2>Erreichbarkeit</h2>
            <BestTimeChart data={bestTime} />
          </div>

          <div className="stat-card chart-card">
            <h2>Response Time</h2>
            <div className="p-4 text-gray-400 text-sm">Wird in zukünftiger Version verfügbar sein</div>
          </div>
        </div>

        {/* Gesprächszeiten */}
        {duration && (
          <div className="stat-card full-width compact-card mb-4">
            <h2>Gesprächszeiten</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Gesamt</div>
                <div className="text-2xl font-bold text-white">{formatDuration(duration.total_duration)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Durchschnitt</div>
                <div className="text-2xl font-bold text-white">{formatDuration(duration.avg_duration)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Termine vereinbart</div>
                <div className="text-2xl font-bold text-white">{duration.appointment_count || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </AuthGuard>
  )
}
