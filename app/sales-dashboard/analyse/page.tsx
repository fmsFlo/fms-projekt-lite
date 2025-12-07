export const runtime = "nodejs";
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'

export default function AnalyseDashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [timeRange, setTimeRange] = useState(30) // 7, 14, 30, 90 Tage
  const [dataSource, setDataSource] = useState('merged') // 'custom-activities' | 'calendly' | 'merged'
  const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' })

  // Neue States
  const [calendlyStats, setCalendlyStats] = useState<any>(null)
  const [customActivitiesStats, setCustomActivitiesStats] = useState<any>(null)
  const [advisorCompletion, setAdvisorCompletion] = useState<any[]>([])
  const [mergedStats, setMergedStats] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null) // Für Detail-Ansicht
  const [forecastBackcastData, setForecastBackcastData] = useState<{ forecast: any[], backcast: any[] }>({ forecast: [], backcast: [] })
  const [selectedBackcastAdvisors, setSelectedBackcastAdvisors] = useState<string[]>([]) // Checkboxen für Berater im Backcast
  const [selectedAppointmentType, setSelectedAppointmentType] = useState('all') // Filter für Gesprächsart
  const [activeSection, setActiveSection] = useState<'performance' | 'forecast-backcast'>('performance')
  const [selectedForecastAdvisors, setSelectedForecastAdvisors] = useState<string[]>(['Sina Hinricher', 'Florian Hörning']) // Checkboxen für Berater im Forecast - Default: Sina und Florian
  const [selectedForecastEventType, setSelectedForecastEventType] = useState('all') // Filter für Terminart im Forecast
  const [forecastTimeRange, setForecastTimeRange] = useState(30) // 7, 14, 30, 90 Tage für Forecast
  const [selectedPerformanceAdvisors, setSelectedPerformanceAdvisors] = useState<string[]>([]) // Checkboxen für Berater in Performance (Array von user_ids)
  const [dateRangeMode, setDateRangeMode] = useState<'preset' | 'custom'>('preset')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [matchedEvents, setMatchedEvents] = useState<any[]>([])
  const [missingDocsModal, setMissingDocsModal] = useState<{ advisor: string, advisorName: string, missingEvents: any[], documentedEvents: any[] } | null>(null)
  const [allCalendlyEvents, setAllCalendlyEvents] = useState<any[]>([])

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile && profile.role === 'admin') {
          setUserRole('admin')
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
  }, [router, supabase])

  // Berechne Datum-Range basierend auf timeRange oder Custom-Dates
  const dateRange = useMemo(() => {
    if (dateRangeMode === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      }
    }
    // Vordefinierter Zeitraum
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }, [timeRange, dateRangeMode, customStartDate, customEndDate])

  // Data Loading
  useEffect(() => {
    if (userRole === 'admin') {
      loadAllData()
      loadMatchedEvents()
    }
  }, [dateRange, userRole])
  
  useEffect(() => {
    if (userRole === 'admin') {
      loadForecastBackcast()
    }
  }, [dateRange, forecastTimeRange, userRole])

  // Lade Matched Events
  const loadMatchedEvents = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      console.log('[AnalysisDashboard] Lade matched events für:', dateRange)
      const response = await fetch(`/api/dashboard/custom-activities/matched?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch matched activities')
      }
      const events = await response.json()
      console.log('[AnalysisDashboard] Matched events geladen:', events.length)
      setMatchedEvents(events || [])
    } catch (error: any) {
      console.error('[AnalysisDashboard] Fehler beim Laden matched events:', error)
      setMatchedEvents([])
    }
  }

  // Sync Funktion mit Fortschrittsanzeige
  const handleSyncCustomActivities = async () => {
    setSyncing(true)
    setSyncMessage('🔄 Starte Synchronisation mit Close...')
    
    try {
      const response = await fetch('/api/dashboard/custom-activities/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 90 })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync')
      }
      const result = await response.json()
      
      let message = `✅ Sync abgeschlossen!\n\n`
      message += `📊 ${result.synced || 0} Custom Activities synchronisiert\n`
      message += `🔗 ${result.matched || 0} zu Calendly Events gematched\n`
      message += `📈 ${result.found || 0} Activities in Close gefunden\n`
      message += `⚙️ ${result.processed || 0} Activities verarbeitet`
      
      if (result.progress && result.progress.length > 0) {
        message += `\n\n📋 Fortschritt:\n`
        result.progress.forEach((msg: string) => {
          message += `${msg}\n`
        })
      }
      
      setSyncMessage(message)
      
      // Reload Daten nach kurzer Verzögerung
      setTimeout(async () => {
        await Promise.all([
          loadAllData(),
          loadMatchedEvents()
        ])
        // Nach 5 Sekunden Nachricht ausblenden
        setTimeout(() => setSyncMessage(''), 5000)
      }, 1000)
    } catch (error: any) {
      let errorMessage = `❌ Fehler: ${error.message}`
      if (error.message.includes('CLOSE_API_KEY') || error.message.includes('Close API Key')) {
        errorMessage += '\n\nBitte konfigurieren Sie den Close API Key in den Einstellungen.'
      } else {
        errorMessage += '\n\nBitte prüfen Sie die Logs für Details.'
      }
      setSyncMessage(errorMessage)
      setTimeout(() => setSyncMessage(''), 10000)
    } finally {
      setSyncing(false)
    }
  }
  
  const loadForecastBackcast = async () => {
    try {
      // Forecast: Nächste 7/14/30/90 Tage (abhängig von forecastTimeRange)
      const forecastEndDate = new Date()
      forecastEndDate.setDate(forecastEndDate.getDate() + forecastTimeRange)
      
      // Backcast: Vergangene Events im gewählten Zeitraum
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        forecastEndDate: forecastEndDate.toISOString().split('T')[0]
      })
      
      const response = await fetch(`/api/dashboard/forecast-backcast?${params}`)
      if (!response.ok) throw new Error('Failed to fetch forecast/backcast')
      const data = await response.json()
      setForecastBackcastData(data || { forecast: [], backcast: [] })
    } catch (error) {
      console.error('[AnalysisDashboard] Fehler beim Laden Forecast/Backcast:', error)
      setForecastBackcastData({ forecast: [], backcast: [] })
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      // Lade beides parallel mit Timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Datenladung dauerte zu lange')), 30000)
      )

      const dataPromise = Promise.all([
        fetch(`/api/dashboard/calendly/stats?${params}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`/api/dashboard/custom-activities/stats?${params}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`/api/dashboard/custom-activities/advisor-completion?${params}`).then(r => r.ok ? r.json() : null).catch(() => null)
      ])

      const [calendly, activities, completion] = await Promise.race([dataPromise, timeoutPromise]) as [any, any, any[]]

      setCalendlyStats(calendly)
      setCustomActivitiesStats(activities)
      setAdvisorCompletion(completion || [])

      // Lade auch alle Calendly Events für geplante Termine
      let allCalendlyEventsData: any[] = []
      try {
        const eventsParams = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
        const eventsResponse = await fetch(`/api/dashboard/calendly/events?${eventsParams}`)
        if (eventsResponse.ok) {
          allCalendlyEventsData = await eventsResponse.json()
        }
        setAllCalendlyEvents(allCalendlyEventsData)
      } catch (err) {
        console.error('[AnalysisDashboard] Fehler beim Laden aller Calendly Events:', err)
        setAllCalendlyEvents([])
      }
      
      // Merge Logik
      const merged = mergeDataSources(calendly, activities, completion || [], matchedEvents, allCalendlyEventsData)
      setMergedStats(merged)
    } catch (error: any) {
      console.error('[AnalysisDashboard] Fehler beim Laden:', error)
      alert(`Fehler beim Laden der Daten: ${error.message}. Bitte Seite neu laden.`)
    } finally {
      setLoading(false)
    }
  }

  // Merge Funktion
  function mergeDataSources(calendly: any, activities: any, completion: any[], matchedEventsParam: any[] | null = null, allCalendlyEvents: any[] | null = null) {
    // Fallback: Wenn completion leer ist, versuche Berater aus anderen Quellen zu extrahieren
    if (!completion || completion.length === 0) {
      console.log('[AnalysisDashboard] completion ist leer, versuche Fallback')
      
      // Versuche 1: Aus matchedEvents extrahieren und aggregieren
      const eventsToUse = matchedEventsParam || matchedEvents
      if (eventsToUse && eventsToUse.length > 0) {
        const advisorsMap = new Map<string, any>()
        
        // Aggregiere Daten aus matchedEvents
        eventsToUse.forEach((event: any) => {
          const advisorName = event.host_name || event.user_name
          const userId = event.user_id || event.host_email || advisorName
          
          if (advisorName) {
            if (!advisorsMap.has(userId)) {
              advisorsMap.set(userId, {
                advisor: advisorName,
                user_id: userId,
                planned: 0,
                completed: 0,
                stattgefunden: 0,
                noShow: 0,
                ausgefallen: 0,
                verschoben: 0,
                calendlyActive: 0,
                calendlyCanceled: 0
              })
            }
            
            const advisor = advisorsMap.get(userId)!
            
            if (event.calendly_status === 'active') {
              advisor.calendlyActive++
            } else if (event.calendly_status === 'canceled') {
              advisor.calendlyCanceled++
            }
            
            if (event.actual_result) {
              advisor.completed++
              const result = event.actual_result.toLowerCase()
              if (result.includes('stattgefunden')) {
                advisor.stattgefunden++
              } else if (result.includes('no-show') || result.includes('no show')) {
                advisor.noShow++
              } else if (result.includes('ausgefallen')) {
                advisor.ausgefallen++
              } else if (result.includes('verschoben')) {
                advisor.verschoben++
              }
            }
          }
        })
        
        // Zähle geplante Termine aus allCalendlyEvents
        if (allCalendlyEvents && allCalendlyEvents.length > 0) {
          allCalendlyEvents.forEach((event: any) => {
            const advisorName = event.host_name || event.user_name
            const userId = event.user_id || event.host_email || advisorName
            if (advisorName && advisorsMap.has(userId)) {
              const advisor = advisorsMap.get(userId)!
              advisor.planned++
            }
          })
        }
        
        const fallbackAdvisors = Array.from(advisorsMap.values())
        if (fallbackAdvisors.length > 0) {
          return fallbackAdvisors.map(advisor => {
            let completionRate = 0
            let missing = 0
            
            if (advisor.planned > 0) {
              completionRate = Math.round((advisor.completed / advisor.planned) * 100)
              missing = Math.max(0, advisor.planned - advisor.completed)
            } else if (advisor.completed > 0) {
              completionRate = 100
              missing = 0
            }
            
            const activityData = {
              'Stattgefunden': advisor.stattgefunden,
              'No-Show': advisor.noShow,
              'Ausgefallen (Kunde)': 0,
              'Ausgefallen (Berater)': 0,
              'Verschoben': advisor.verschoben
            }
            const status = getStatusFromActivities(activityData, completionRate)
            
            return {
              advisor: advisor.advisor,
              user_id: advisor.user_id,
              planned: advisor.planned,
              documented: advisor.completed,
              completionRate,
              missing,
              stattgefunden: advisor.stattgefunden,
              noShow: advisor.noShow,
              ausgefallen: advisor.ausgefallen,
              verschoben: advisor.verschoben,
              calendlyActive: advisor.calendlyActive,
              calendlyCanceled: advisor.calendlyCanceled,
              status
            }
          })
        }
      }
      
      // Versuche 2: Aus Calendly Stats extrahieren
      if (calendly && calendly.byAdvisor) {
        const advisorsMap = new Map<string, any>()
        Object.entries(calendly.byAdvisor).forEach(([userId, data]: [string, any]) => {
          const advisorName = data.hostName || data.advisor || userId
          if (!advisorsMap.has(userId)) {
            advisorsMap.set(userId, {
              advisor: advisorName,
              user_id: userId,
              planned: data.active || 0,
              completed: 0,
              completionRate: 0,
              missing: 0
            })
          }
        })
        const fallbackAdvisors = Array.from(advisorsMap.values())
        if (fallbackAdvisors.length > 0) {
          return fallbackAdvisors.map(advisor => ({
            ...advisor,
            stattgefunden: 0,
            noShow: 0,
            ausgefallen: 0,
            verschoben: 0,
            calendlyActive: advisor.planned || 0,
            calendlyCanceled: 0,
            status: { icon: '🟡', text: 'Daten werden geladen...', color: '#e3a008' }
          }))
        }
      }
      
      return []
    }

    // WICHTIG: Wenn advisorCompletion 0 dokumentierte Activities hat, aber matchedEvents vorhanden sind,
    // verwende matchedEvents als Source of Truth für dokumentierte Activities
    const eventsToUse = matchedEventsParam || matchedEvents
    const matchedEventsByAdvisor: Record<string, any> = {}
    
    if (eventsToUse && eventsToUse.length > 0) {
      eventsToUse.forEach((event: any) => {
        const advisorName = event.host_name || event.user_name
        const userId = event.user_id || event.host_email || advisorName
        
        if (advisorName && event.actual_result) {
          if (!matchedEventsByAdvisor[userId]) {
            matchedEventsByAdvisor[userId] = {
              advisor: advisorName,
              user_id: userId,
              documented: 0,
              stattgefunden: 0,
              noShow: 0,
              ausgefallen: 0,
              verschoben: 0
            }
          }
          
          const advisor = matchedEventsByAdvisor[userId]
          advisor.documented++
          
          const result = (event.actual_result || '').toLowerCase()
          if (result.includes('stattgefunden')) {
            advisor.stattgefunden++
          } else if (result.includes('no-show') || result.includes('no show')) {
            advisor.noShow++
          } else if (result.includes('ausgefallen')) {
            advisor.ausgefallen++
          } else if (result.includes('verschoben')) {
            advisor.verschoben++
          }
        }
      })
    }
    
    return completion.map((advisor: any) => {
      const activityData = activities?.byAdvisor?.[advisor.user_id] || {}
      const calendlyData = calendly?.byAdvisor?.[advisor.user_id] || {}
      
      const matchedData = matchedEventsByAdvisor[advisor.user_id] || matchedEventsByAdvisor[advisor.advisor]
      const documentedFromMatched = matchedData?.documented || 0
      
      const documented = Math.max(advisor.completed || 0, documentedFromMatched)
      
      const stattgefunden = matchedData?.stattgefunden || activityData['Stattgefunden'] || 0
      const noShow = matchedData?.noShow || activityData['No-Show'] || 0
      const ausgefallen = matchedData?.ausgefallen || (activityData['Ausgefallen (Kunde)'] || 0) + (activityData['Ausgefallen (Berater)'] || 0)
      const verschoben = matchedData?.verschoben || activityData['Verschoben'] || 0

      let completionRate = advisor.completionRate || 0
      let missing = advisor.missing || 0
      
      if (advisor.planned === 0 && documented > 0) {
        completionRate = 100
        missing = 0
      } else if (advisor.planned > 0) {
        completionRate = Math.round((documented / advisor.planned) * 100)
        missing = Math.max(0, advisor.planned - documented)
      }

      const status = getStatusFromActivities(activityData, completionRate)

      return {
        advisor: advisor.advisor || 'Unbekannt',
        user_id: advisor.user_id,
        planned: advisor.planned || 0,
        documented: documented,
        completionRate,
        missing,
        stattgefunden,
        noShow,
        ausgefallen,
        verschoben,
        calendlyActive: calendlyData.active || 0,
        calendlyCanceled: calendlyData.canceled || 0,
        status
      }
    })
  }

  // Status Berechnung
  function getStatusFromActivities(data: any, completionRate: number) {
    if (completionRate < 50) {
      return { 
        icon: '⚠️', 
        text: 'Dokumentation fehlt', 
        color: '#dc2626' 
      }
    }

    const total = Object.values(data).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
    const noShowCount = data['No-Show'] || 0
    const noShowRate = total > 0 ? (noShowCount / total * 100) : 0

    if (noShowRate > 20) {
      return { 
        icon: '🔴', 
        text: 'Hohe No-Show-Rate', 
        color: '#dc2626' 
      }
    }

    if (noShowRate > 10) {
      return { 
        icon: '🟡', 
        text: 'Okay', 
        color: '#e3a008' 
      }
    }

    if (completionRate < 80) {
      return { 
        icon: '🟡', 
        text: 'Niedrige Completion', 
        color: '#e3a008' 
      }
    }

    return { 
      icon: '🟢', 
      text: 'Gut', 
      color: '#0ea66e' 
    }
  }

  // Filtere und sortiere merged Stats
  const sortedMergedStats = useMemo(() => {
    let filtered = mergedStats
    if (selectedPerformanceAdvisors.length > 0) {
      filtered = mergedStats.filter(stat => 
        selectedPerformanceAdvisors.includes(stat.user_id)
      )
    }

    if (!sortConfig.key) return filtered

    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key!]
      const bVal = b[sortConfig.key!]

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [mergedStats, sortConfig, selectedPerformanceAdvisors])

  // Re-merge wenn matchedEvents geladen werden
  useEffect(() => {
    if (matchedEvents.length > 0 && !loading && advisorCompletion.length > 0) {
      const merged = mergeDataSources(calendlyStats, customActivitiesStats, advisorCompletion, matchedEvents, allCalendlyEvents)
      setMergedStats(merged)
    }
  }, [matchedEvents, calendlyStats, customActivitiesStats, advisorCompletion, loading, dateRange, allCalendlyEvents])

  // Initialisiere Standard-Auswahl (Sina und Florian) wenn mergedStats geladen werden
  useEffect(() => {
    if (mergedStats.length > 0 && selectedPerformanceAdvisors.length === 0) {
      const sina = mergedStats.find((s: any) => s.advisor?.toLowerCase().includes('sina'))
      const florian = mergedStats.find((s: any) => s.advisor?.toLowerCase().includes('florian'))
      const defaultSelection: string[] = []
      if (sina) defaultSelection.push(sina.user_id)
      if (florian) defaultSelection.push(florian.user_id)
      if (defaultSelection.length > 0) {
        setSelectedPerformanceAdvisors(defaultSelection)
      }
    }
  }, [mergedStats])

  // Erweiterte Insights
  const insights = useMemo(() => {
    const warnings: any[] = []

    const filteredStats = selectedPerformanceAdvisors.length > 0
      ? mergedStats.filter((stat: any) => selectedPerformanceAdvisors.includes(stat.user_id))
      : mergedStats

    filteredStats.forEach((stat: any) => {
      if (stat.planned > 0 && stat.completionRate < 50 && stat.missing > 0 && stat.documented < stat.planned) {
        warnings.push({
          type: 'error',
          message: `⚠️ ${stat.advisor} hat ${stat.missing} Termine nicht dokumentiert (${stat.completionRate}% Completion)`,
          consultant: stat.advisor
        })
      } else if (stat.planned > 0 && stat.completionRate === 100 && stat.documented === stat.planned) {
        warnings.push({
          type: 'success',
          message: `✅ ${stat.advisor} hat 100% Completion Rate`,
          consultant: stat.advisor
        })
      }

      const total = stat.stattgefunden + stat.noShow + stat.ausgefallen + stat.verschoben
      if (total > 0) {
        const noShowRate = (stat.noShow / total) * 100
        if (noShowRate > 20) {
          warnings.push({
            type: 'error',
            message: `🔴 ${stat.advisor} hat hohe No-Show-Rate von ${Math.round(noShowRate)}% laut Custom Activities`,
            consultant: stat.advisor
          })
        }
      }
    })

    return warnings
  }, [mergedStats, selectedPerformanceAdvisors])

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const appointmentTypes = [
    { key: 'vorqualifizierung', label: 'Vorqualifizierung' },
    { key: 'erstgespraech', label: 'Erstgespräch' },
    { key: 'konzeptgespraech', label: 'Konzeptgespräch' },
    { key: 'umsetzungsgespraech', label: 'Umsetzungsgespräch' },
    { key: 'servicegespraech', label: 'Servicegespräch' }
  ]

  const formatActivityType = (activityType: string) => {
    if (!activityType) return '-'
    const typeMap: Record<string, string> = {
      'vorqualifizierung': 'Vorqualifizierung',
      'erstgespraech': 'Erstgespräch',
      'konzeptgespraech': 'Konzeptgespräch',
      'umsetzungsgespraech': 'Umsetzungsgespräch',
      'servicegespraech': 'Servicegespräch'
    }
    if (typeMap[activityType.toLowerCase()]) {
      return typeMap[activityType.toLowerCase()]
    }
    const withoutGespraech = activityType.replace(/gespraech/gi, '').toLowerCase()
    if (withoutGespraech === 'erst') return 'Erstgespräch'
    if (withoutGespraech === 'konzept') return 'Konzeptgespräch'
    if (withoutGespraech === 'umsetzung') return 'Umsetzungsgespräch'
    if (withoutGespraech === 'service') return 'Servicegespräch'
    if (withoutGespraech === 'vorqualifizierung' || withoutGespraech === 'vorqual') return 'Vorqualifizierung'
    return activityType
  }

  // Alle verfügbaren Berater für Forecast-Checkboxen
  const availableForecastAdvisors = useMemo(() => {
    const events = forecastBackcastData.forecast || []
    const advisors = new Set<string>(['Sina Hinricher', 'Florian Hörning'])
    events.forEach((event: any) => {
      if (event.host_name) {
        advisors.add(event.host_name)
      }
    })
    return Array.from(advisors).sort()
  }, [forecastBackcastData.forecast])

  // Forecast-Berechnung
  const forecastData = useMemo(() => {
    let events = forecastBackcastData.forecast || []
    
    const filteredAdvisors = selectedForecastAdvisors.length > 0 ? selectedForecastAdvisors : availableForecastAdvisors
    
    if (selectedForecastAdvisors.length > 0) {
      events = events.filter((event: any) => {
        const advisor = event.host_name || 'Unbekannt'
        return selectedForecastAdvisors.includes(advisor)
      })
    }
    
    if (selectedForecastEventType !== 'all') {
      const typeMap: Record<string, string[]> = {
        'erstgespraech': ['erstgespräch', 'erstgespraech'],
        'konzeptgespraech': ['konzept'],
        'umsetzungsgespraech': ['umsetzung'],
        'servicegespraech': ['service']
      }
      const searchTerms = typeMap[selectedForecastEventType] || [selectedForecastEventType]
      events = events.filter((e: any) => {
        const eventType = (e.event_type_name || e.event_name || '').toLowerCase()
        return searchTerms.some(term => eventType.includes(term))
      })
    }
    
    const byAdvisor: Record<string, any> = {}
    
    filteredAdvisors.forEach(advisor => {
      if (!byAdvisor[advisor]) {
        byAdvisor[advisor] = {
          advisor,
          erstgespraeche: 0,
          konzeptgespraeche: 0,
          umsetzungsgespraeche: 0,
          servicegespraeche: 0,
          umsatz: 0
        }
      }
    })
    
    events.forEach((event: any) => {
      const advisor = event.host_name || 'Unbekannt'
      if (!byAdvisor[advisor]) {
        byAdvisor[advisor] = {
          advisor,
          erstgespraeche: 0,
          konzeptgespraeche: 0,
          umsetzungsgespraeche: 0,
          servicegespraeche: 0,
          umsatz: 0
        }
      }
      
      const eventType = (event.event_type_name || event.event_name || '').toLowerCase()
      if (eventType.includes('erstgespräch') || eventType.includes('erstgespraech')) {
        byAdvisor[advisor].erstgespraeche++
      } else if (eventType.includes('konzept')) {
        byAdvisor[advisor].konzeptgespraeche++
      } else if (eventType.includes('umsetzung')) {
        byAdvisor[advisor].umsetzungsgespraeche++
      } else if (eventType.includes('service')) {
        byAdvisor[advisor].servicegespraeche++
      }
      
      if (event.opportunity_value) {
        byAdvisor[advisor].umsatz += parseFloat(event.opportunity_value) || 0
      }
    })
    
    return Object.values(byAdvisor).sort((a: any, b: any) => a.advisor.localeCompare(b.advisor))
  }, [forecastBackcastData.forecast, selectedForecastAdvisors, selectedForecastEventType, availableForecastAdvisors])

  // Alle verfügbaren Berater für Backcast-Checkboxen
  const availableBackcastAdvisors = useMemo(() => {
    const events = forecastBackcastData.backcast || []
    const advisors = new Set<string>()
    events.forEach((event: any) => {
      if (event.host_name) {
        advisors.add(event.host_name)
      }
    })
    return Array.from(advisors).sort()
  }, [forecastBackcastData.backcast])

  // Backcast-Berechnung
  const backcastData = useMemo(() => {
    let events = forecastBackcastData.backcast || []
    
    if (selectedBackcastAdvisors.length > 0) {
      events = events.filter((event: any) => {
        const advisor = event.host_name || 'Unbekannt'
        return selectedBackcastAdvisors.includes(advisor)
      })
    }
    
    if (selectedAppointmentType !== 'all') {
      const typeMap: Record<string, string> = {
        'erstgespraech': 'erstgespräch',
        'konzeptgespraech': 'konzept',
        'umsetzungsgespraech': 'umsetzung',
        'servicegespraech': 'service'
      }
      const searchTerm = typeMap[selectedAppointmentType] || selectedAppointmentType
      events = events.filter((e: any) => {
        const eventType = (e.event_type_name || e.event_name || '').toLowerCase()
        return eventType.includes(searchTerm)
      })
    }
    
    const byAdvisor: Record<string, any> = {}
    
    events.forEach((event: any) => {
      const advisor = event.host_name || 'Unbekannt'
      if (!byAdvisor[advisor]) {
        byAdvisor[advisor] = {
          advisor,
          gespraeche: 0,
          stattgefunden: 0,
          stattgefundenProzent: 0,
          folgeterminVereinbart: 0,
          folgeterminVereinbartProzent: 0,
          folgeterminCA: 0,
          folgeterminCAProzent: 0,
          ergebnisse: {
            'Stattgefunden': 0,
            'No-Show': 0,
            'Ausgefallen (Kunde)': 0,
            'Ausgefallen (Berater)': 0,
            'Verschoben': 0
          }
        }
      }
      
      byAdvisor[advisor].gespraeche++
      
      if (event.ergebnis) {
        if (event.ergebnis === 'Stattgefunden') {
          byAdvisor[advisor].stattgefunden++
        }
        byAdvisor[advisor].ergebnisse[event.ergebnis] = 
          (byAdvisor[advisor].ergebnisse[event.ergebnis] || 0) + 1
      }
      
      if (event.ergebnis === 'Stattgefunden') {
        byAdvisor[advisor].folgeterminVereinbart++
      }
      
      if (event.ergebnis && event.activity_type) {
        byAdvisor[advisor].folgeterminCA++
      }
    })
    
    Object.values(byAdvisor).forEach((stat: any) => {
      if (stat.gespraeche > 0) {
        stat.stattgefundenProzent = Math.round((stat.stattgefunden / stat.gespraeche) * 100)
        stat.folgeterminVereinbartProzent = Math.round((stat.folgeterminVereinbart / stat.gespraeche) * 100)
        stat.folgeterminCAProzent = Math.round((stat.folgeterminCA / stat.gespraeche) * 100)
      }
    })
    
    return Object.values(byAdvisor)
  }, [forecastBackcastData.backcast, selectedAppointmentType, selectedBackcastAdvisors])

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'Berater',
      'Geplant (Calendly)',
      'Dokumentiert (Activities)',
      'Completion Rate (%)',
      'Fehlend',
      'Stattgefunden',
      'No-Show',
      'Ausgefallen',
      'Verschoben',
      'Status'
    ]

    const rows = mergedStats.map((stat: any) => [
      stat.advisor,
      stat.planned,
      stat.documented,
      stat.completionRate,
      stat.missing,
      stat.stattgefunden,
      stat.noShow,
      stat.ausgefallen,
      stat.verschoben,
      stat.status.text
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `berater_analyse_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Wenn ein Termintyp ausgewählt ist, navigiere zur Detail-Ansicht
  if (selectedType) {
    router.push(`/sales-dashboard/analyse/${selectedType}`)
    return null
  }

  const displayStats = dataSource === 'merged' 
    ? sortedMergedStats 
    : sortedMergedStats

  return (
    <AuthGuard>
      {loading || userRole !== 'admin' ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Lade Analyse-Daten...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[#0a0e14] text-[#e5e7eb] p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-[1920px] mx-auto">
        {/* Header mit Tabs */}
        <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[rgba(255,255,255,0.9)]">📊 Analyse</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSection('performance')}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSection === 'performance'
                    ? 'bg-[rgba(74,144,226,0.2)] border border-[rgba(74,144,226,0.5)] text-[#4a90e2]'
                    : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                Performance
              </button>
              <button
                onClick={() => setActiveSection('forecast-backcast')}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSection === 'forecast-backcast'
                    ? 'bg-[rgba(74,144,226,0.2)] border border-[rgba(74,144,226,0.5)] text-[#4a90e2]'
                    : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                Forecast / Backcast
              </button>
            </div>
          </div>
          
          {/* Filter nur bei Performance */}
          {activeSection === 'performance' && (
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap w-full sm:w-auto">
                  <label className="text-xs sm:text-sm text-[rgba(255,255,255,0.6)] whitespace-nowrap">Berater:</label>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPerformanceAdvisors.length === 0 || selectedPerformanceAdvisors.length === mergedStats.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPerformanceAdvisors(mergedStats.map((s: any) => s.user_id))
                        } else {
                          setSelectedPerformanceAdvisors([])
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <span>Alle</span>
                  </label>
                  {mergedStats.length > 0 ? (
                    mergedStats.map((stat: any) => (
                      <label key={stat.user_id} className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPerformanceAdvisors.includes(stat.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPerformanceAdvisors([...selectedPerformanceAdvisors, stat.user_id])
                            } else {
                              setSelectedPerformanceAdvisors(selectedPerformanceAdvisors.filter(id => id !== stat.user_id))
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <span>{stat.advisor}</span>
                      </label>
                    ))
                  ) : (
                    <span className="text-xs text-[rgba(255,255,255,0.4)]">Keine Berater gefunden</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs sm:text-sm text-[rgba(255,255,255,0.6)] whitespace-nowrap">Datenquelle:</label>
                <select
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="px-2 sm:px-3 py-1 bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-md text-xs sm:text-sm text-[#e5e7eb] flex-1 sm:flex-initial"
                >
                  <option value="merged">Merged (Empfohlen)</option>
                  <option value="custom-activities">Nur Custom Activities</option>
                  <option value="calendly">Nur Calendly</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap w-full sm:w-auto">
                <label className="text-xs sm:text-sm text-[rgba(255,255,255,0.6)] whitespace-nowrap">Zeitraum:</label>
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
                    className="px-2 sm:px-3 py-1 bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-md text-xs sm:text-sm text-[#e5e7eb] w-full sm:w-auto"
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
                      className="px-2 sm:px-3 py-1 bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-md text-xs sm:text-sm text-[#e5e7eb] flex-1 sm:flex-initial"
                    />
                    <span className="text-xs sm:text-sm text-[rgba(255,255,255,0.6)] whitespace-nowrap">bis</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2 sm:px-3 py-1 bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-md text-xs sm:text-sm text-[#e5e7eb] flex-1 sm:flex-initial"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleSyncCustomActivities}
                disabled={syncing}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  syncing
                    ? 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] cursor-not-allowed'
                    : 'bg-[rgba(74,144,226,0.2)] border border-[rgba(74,144,226,0.5)] text-[#4a90e2] hover:bg-[rgba(74,144,226,0.3)]'
                }`}
              >
                {syncing ? '⏳ Sync...' : '🔄 Sync'}
              </button>
              <button
                onClick={exportToCSV}
                className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-[rgba(14,166,110,0.2)] border border-[rgba(14,166,110,0.5)] text-[#0ea66e] rounded-md hover:bg-[rgba(14,166,110,0.3)] text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                📥 CSV Export
              </button>
            </div>
          )}
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div className={`p-3 sm:p-4 rounded-lg mb-6 border text-xs sm:text-sm whitespace-pre-line max-h-96 overflow-y-auto ${
            syncMessage.includes('✅') 
              ? 'bg-[rgba(14,166,110,0.1)] border-[rgba(14,166,110,0.2)] text-[#0ea66e]' 
              : syncMessage.includes('🔄')
              ? 'bg-[rgba(74,144,226,0.1)] border-[rgba(74,144,226,0.2)] text-[#4a90e2]'
              : 'bg-[rgba(220,38,38,0.1)] border-[rgba(220,38,38,0.2)] text-[#dc2626]'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">{syncMessage}</div>
              <button
                onClick={() => setSyncMessage('')}
                className="ml-4 text-gray-400 hover:text-white text-lg"
                title="Schließen"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Performance Sektion */}
        {activeSection === 'performance' && (
          <>
            {/* Termintyp-Detail-Links */}
            <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-[rgba(255,255,255,0.8)]">📋 Termintyp-Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {appointmentTypes.map(type => (
                  <button
                    key={type.key}
                    onClick={() => router.push(`/sales-dashboard/analyse/${type.key}`)}
                    className="p-2 sm:p-3 lg:p-4 bg-[rgba(74,144,226,0.1)] border border-[rgba(74,144,226,0.3)] rounded-lg text-[#4a90e2] hover:bg-[rgba(74,144,226,0.2)] transition-colors text-left font-medium text-xs sm:text-sm lg:text-base"
                  >
                    {type.label} →
                  </button>
                ))}
              </div>
            </div>

            {/* Insights/Warnungen */}
            {insights.length > 0 && (
              <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">🔔 Insights & Warnungen</h3>
                <div className="space-y-2">
                  {insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md text-sm ${
                        insight.type === 'error'
                          ? 'bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.2)] text-[#dc2626]'
                          : insight.type === 'success'
                          ? 'bg-[rgba(14,166,110,0.1)] border border-[rgba(14,166,110,0.2)] text-[#0ea66e]'
                          : 'bg-[rgba(227,160,8,0.1)] border border-[rgba(227,160,8,0.2)] text-[#e3a008]'
                      }`}
                    >
                      {insight.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Erweiterte Berater-Performance Tabelle */}
            <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">👥 Berater-Performance (Custom Activities = Source of Truth)</h2>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)]">
                      <th 
                        className="text-left p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase cursor-pointer select-none whitespace-nowrap"
                        onClick={() => handleSort('advisor')}
                      >
                        Berater {sortConfig.key === 'advisor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-right p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase cursor-pointer select-none whitespace-nowrap"
                        onClick={() => handleSort('planned')}
                      >
                        Geplant {sortConfig.key === 'planned' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-right p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase cursor-pointer select-none whitespace-nowrap"
                        onClick={() => handleSort('documented')}
                      >
                        Dokumentiert {sortConfig.key === 'documented' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-right p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase cursor-pointer select-none whitespace-nowrap"
                        onClick={() => handleSort('completionRate')}
                      >
                        Completion {sortConfig.key === 'completionRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-right p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Stattgef.</th>
                      <th className="text-right p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">No-Show</th>
                      <th className="text-right p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Ausgefallen</th>
                      <th className="text-right p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Verschoben</th>
                      <th className="text-center p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayStats.map((stat: any, idx: number) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-[rgba(255,255,255,0.05)] ${
                          stat.completionRate < 50
                            ? 'bg-[rgba(220,38,38,0.05)]'
                            : stat.completionRate < 80
                            ? 'bg-[rgba(227,160,8,0.05)]'
                            : ''
                        }`}
                      >
                        <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-[rgba(255,255,255,0.8)]">{stat.advisor}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-[rgba(255,255,255,0.8)]">{stat.planned}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-[rgba(255,255,255,0.8)]">
                          {stat.documented}
                          {stat.missing > 0 && (
                            <span className="ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 bg-[rgba(220,38,38,0.2)] text-[#dc2626] rounded text-[10px] sm:text-xs font-medium">
                              -{stat.missing}
                            </span>
                          )}
                        </td>
                        <td className="p-2 sm:p-3 text-right">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium ${
                            stat.completionRate < 50
                              ? 'bg-[rgba(220,38,38,0.2)] text-[#dc2626]'
                              : stat.completionRate < 80
                              ? 'bg-[rgba(227,160,8,0.2)] text-[#e3a008]'
                              : 'bg-[rgba(14,166,110,0.2)] text-[#0ea66e]'
                          }`}>
                            {stat.completionRate}%
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-[#0ea66e]">{stat.stattgefunden}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-[#dc2626]">{stat.noShow}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-[#e3a008]">{stat.ausgefallen}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-right text-[#4a90e2]">{stat.verschoben}</td>
                        <td className="p-3 text-center">
                          <span 
                            className={`cursor-${stat.missing > 0 ? 'pointer' : 'default'} ${stat.missing > 0 ? 'underline' : ''}`}
                            style={{ color: stat.status.color }}
                            onClick={() => {
                              if (stat.missing > 0) {
                                const advisorEvents = allCalendlyEvents.filter((e: any) => {
                                  const eventUserId = e.user_id || e.host_email || e.host_name
                                  const statUserId = stat.user_id
                                  return eventUserId === statUserId || 
                                         e.host_name === stat.advisor || 
                                         e.user_name === stat.advisor
                                })
                                
                                const documentedEventIds = new Set(
                                  matchedEvents
                                    .filter((e: any) => {
                                      const eventUserId = e.user_id || e.host_email || e.host_name
                                      return eventUserId === stat.user_id || 
                                             e.host_name === stat.advisor || 
                                             e.user_name === stat.advisor
                                    })
                                    .map((e: any) => e.calendly_event_id || e.id)
                                    .filter(Boolean)
                                )
                                
                                const missingEvents = advisorEvents.filter((e: any) => 
                                  !documentedEventIds.has(e.id) && 
                                  e.status === 'active'
                                )
                                
                                setMissingDocsModal({
                                  advisor: stat.advisor,
                                  advisorName: stat.advisor,
                                  missingEvents: missingEvents,
                                  documentedEvents: matchedEvents.filter((e: any) => {
                                    const eventUserId = e.user_id || e.host_email || e.host_name
                                    return eventUserId === stat.user_id || 
                                           e.host_name === stat.advisor || 
                                           e.user_name === stat.advisor
                                  })
                                })
                              }
                            }}
                            title={stat.missing > 0 ? `Klicken für Details: ${stat.missing} fehlende Dokumentationen` : ''}
                          >
                            {stat.status.icon} {stat.status.text}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matched Events Tabelle */}
            <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">
                📊 Termine mit Ergebnissen 
                {matchedEvents.length > 0 && (
                  <span className="text-xs sm:text-sm text-[rgba(255,255,255,0.5)] ml-2">
                    ({matchedEvents.length} gefunden)
                  </span>
                )}
              </h2>
              {matchedEvents.length === 0 ? (
                <div className="p-4 sm:p-6 lg:p-8 text-center">
                  <div className="text-[rgba(255,255,255,0.4)] text-sm mb-4">
                    Keine gematched Events gefunden.
                  </div>
                  <div className="text-xs text-[rgba(255,255,255,0.3)] mb-4">
                    Die Daten werden aus der lokalen Datenbank geladen. Wenn keine Events angezeigt werden, 
                    wurden noch keine Custom Activities mit Calendly Events verknüpft.
                  </div>
                  <button
                    onClick={handleSyncCustomActivities}
                    disabled={syncing}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      syncing 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {syncing ? '⏳ Synchronisiere...' : '🔄 Jetzt mit Close synchronisieren'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
                    <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)]">
                      <th className="text-left p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Datum</th>
                      <th className="text-left p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Kunde</th>
                      <th className="text-left p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Berater</th>
                      <th className="text-left p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Typ</th>
                      <th className="text-center p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Status</th>
                      <th className="text-center p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">Ergebnis</th>
                      <th className="text-center p-2 sm:p-3 text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] uppercase whitespace-nowrap">
                            Match
                            <span 
                              className="ml-1 text-xs cursor-help border-b border-dotted border-gray-400"
                              title="Match-Confidence: Zeigt an, wie sicher das System ist, dass die Custom Activity zu diesem Calendly-Event passt"
                            >
                              ⓘ
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedEvents.slice(0, 50).map((event: any, idx: number) => (
                          <tr key={idx} className="border-b border-[rgba(255,255,255,0.05)]">
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-[rgba(255,255,255,0.8)] whitespace-nowrap">
                              {new Date(event.start_time).toLocaleDateString('de-DE', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-[rgba(255,255,255,0.8)]">{event.invitee_name || '-'}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-[rgba(255,255,255,0.8)]">{event.host_name || event.user_name || '-'}</td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-[rgba(255,255,255,0.8)]">{formatActivityType(event.activity_type)}</td>
                            <td className="p-2 sm:p-3 text-center">
                              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                                event.calendly_status === 'active' 
                                  ? 'bg-[rgba(14,166,110,0.2)] text-[#0ea66e]' 
                                  : event.calendly_status === 'canceled'
                                  ? 'bg-[rgba(220,38,38,0.2)] text-[#dc2626]'
                                  : 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)]'
                              }`}>
                                {event.calendly_status || '-'}
                              </span>
                            </td>
                            <td className="p-2 sm:p-3 text-center">
                              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                                event.actual_result === 'Stattgefunden' 
                                  ? 'bg-[rgba(14,166,110,0.2)] text-[#0ea66e]' 
                                  : event.actual_result === 'No-Show'
                                  ? 'bg-[rgba(220,38,38,0.2)] text-[#dc2626]'
                                  : event.actual_result === 'Verschoben'
                                  ? 'bg-[rgba(74,144,226,0.2)] text-[#4a90e2]'
                                  : 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)]'
                              }`}>
                                {event.actual_result || 'Nicht ausgefüllt'}
                              </span>
                            </td>
                            <td className="p-2 sm:p-3 text-center">
                              {event.match_confidence && (
                                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                                  event.match_confidence > 0.8 
                                    ? 'bg-[rgba(14,166,110,0.2)] text-[#0ea66e]' 
                                    : event.match_confidence > 0.6
                                    ? 'bg-[rgba(227,160,8,0.2)] text-[#e3a008]'
                                    : 'bg-[rgba(220,38,38,0.2)] text-[#dc2626]'
                                }`}>
                                  {(event.match_confidence * 100).toFixed(0)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {matchedEvents.length > 50 && (
                    <div className="mt-4 text-center text-sm text-[rgba(255,255,255,0.4)]">
                      Zeige 50 von {matchedEvents.length} Ergebnissen
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Forecast / Backcast Sektion */}
        {activeSection === 'forecast-backcast' && (
          <div>
            {/* Filter für Forecast */}
            <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Forecast Filter</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Zeitraum (nächste X Tage):
                  </label>
                  <select
                    value={forecastTimeRange}
                    onChange={(e) => setForecastTimeRange(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="7">Nächste 7 Tage</option>
                    <option value="14">Nächste 14 Tage</option>
                    <option value="30">Nächste 30 Tage</option>
                    <option value="90">Nächste 90 Tage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Berater (Checkboxen):
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedForecastAdvisors.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForecastAdvisors([])
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span>Alle</span>
                    </label>
                    {availableForecastAdvisors.map(advisor => (
                      <label key={advisor} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedForecastAdvisors.includes(advisor)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForecastAdvisors([...selectedForecastAdvisors, advisor])
                            } else {
                              setSelectedForecastAdvisors(selectedForecastAdvisors.filter(a => a !== advisor))
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <span>{advisor}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mr-2">Terminart (Forecast):</label>
                  <select
                    value={selectedForecastEventType}
                    onChange={(e) => setSelectedForecastEventType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Alle</option>
                    <option value="erstgespraech">Erstgespräch</option>
                    <option value="konzeptgespraech">Konzeptgespräch</option>
                    <option value="umsetzungsgespraech">Umsetzungsgespräch</option>
                    <option value="servicegespraech">Servicegespräch</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Forecast Tabelle */}
            <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Forecast</h3>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)]">
                      <th className="text-left p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Berater Name</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Erstgespräche</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Konzeptgespräche</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Umsetzungsgespräche</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Servicegespräche</th>
                      <th className="text-right p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">pot. Umsatz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[rgba(255,255,255,0.4)]">
                          Keine Forecast-Daten verfügbar
                        </td>
                      </tr>
                    ) : (
                      forecastData.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-[rgba(255,255,255,0.05)]">
                          <td className="p-3 text-sm text-[rgba(255,255,255,0.8)]">{row.advisor}</td>
                          <td className="p-3 text-sm text-center">{row.erstgespraeche}</td>
                          <td className="p-3 text-sm text-center">{row.konzeptgespraeche}</td>
                          <td className="p-3 text-sm text-center">{row.umsetzungsgespraeche}</td>
                          <td className="p-3 text-sm text-center">{row.servicegespraeche}</td>
                          <td className="p-3 text-sm text-right font-semibold text-green-600">
                            {row.umsatz > 0 ? `€${row.umsatz.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Filter für Backcast */}
            <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Backcast Filter</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Berater (Checkboxen):
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedBackcastAdvisors.length === 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBackcastAdvisors([])
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span>Alle</span>
                    </label>
                    {availableBackcastAdvisors.map(advisor => (
                      <label key={advisor} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedBackcastAdvisors.includes(advisor)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBackcastAdvisors([...selectedBackcastAdvisors, advisor])
                            } else {
                              setSelectedBackcastAdvisors(selectedBackcastAdvisors.filter(a => a !== advisor))
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <span>{advisor}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mr-2">Gesprächsart (Backcast):</label>
                  <select
                    value={selectedAppointmentType}
                    onChange={(e) => setSelectedAppointmentType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Alle</option>
                    <option value="erstgespraech">Erstgespräch</option>
                    <option value="konzeptgespraech">Konzeptgespräch</option>
                    <option value="umsetzungsgespraech">Umsetzungsgespräch</option>
                    <option value="servicegespraech">Servicegespräch</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Backcast Tabelle */}
            <div className="bg-[#1a1f2e] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 sm:p-4 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Backcast</h3>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)]">
                      <th className="text-left p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Berater Name</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">
                        {selectedAppointmentType === 'all' ? 'Gespräche' : appointmentTypes.find(t => t.key === selectedAppointmentType)?.label || 'Gespräche'}
                      </th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Davon stattgefunden</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Quote in %</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Folgetermin vereinbart</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Quote in %</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Folgetermin CA ausgefüllt</th>
                      <th className="text-center p-3 text-xs text-[rgba(255,255,255,0.4)] uppercase">Quote in %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backcastData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-[rgba(255,255,255,0.4)]">
                          Keine Backcast-Daten verfügbar
                        </td>
                      </tr>
                    ) : (
                      backcastData.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-[rgba(255,255,255,0.05)]">
                          <td className="p-3 text-sm text-[rgba(255,255,255,0.8)]">{row.advisor}</td>
                          <td className="p-3 text-sm text-center">{row.gespraeche}</td>
                          <td className="p-3 text-sm text-center">{row.stattgefunden}</td>
                          <td className={`p-3 text-sm text-center ${
                            row.stattgefundenProzent >= 70 ? 'text-green-600' : row.stattgefundenProzent >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {row.stattgefundenProzent}%
                          </td>
                          <td className="p-3 text-sm text-center">{row.folgeterminVereinbart}</td>
                          <td className={`p-3 text-sm text-center ${
                            row.folgeterminVereinbartProzent >= 70 ? 'text-green-600' : row.folgeterminVereinbartProzent >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {row.folgeterminVereinbartProzent}%
                          </td>
                          <td className="p-3 text-sm text-center">{row.folgeterminCA}</td>
                          <td className={`p-3 text-sm text-center ${
                            row.folgeterminCAProzent >= 70 ? 'text-green-600' : row.folgeterminCAProzent >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {row.folgeterminCAProzent}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal für fehlende Dokumentationen */}
        {missingDocsModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-5"
            onClick={() => setMissingDocsModal(null)}
          >
            <div 
              className="bg-gray-900 rounded-lg p-6 max-h-[90vh] overflow-auto border border-gray-700 w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  📋 Fehlende Dokumentationen: {missingDocsModal.advisorName}
                </h3>
                <button
                  onClick={() => setMissingDocsModal(null)}
                  className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              {/* Übersicht */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">FEHLENDE DOKUMENTATIONEN</div>
                  <div className="text-2xl font-bold text-red-400">
                    {missingDocsModal.missingEvents.length}
                  </div>
                </div>
                <div className="p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">DOKUMENTIERT</div>
                  <div className="text-2xl font-bold text-green-400">
                    {missingDocsModal.documentedEvents.length}
                  </div>
                </div>
                <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">GESAMT (CALENDLY)</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {missingDocsModal.missingEvents.length + missingDocsModal.documentedEvents.length}
                  </div>
                </div>
              </div>
              
              {/* Tabelle: Fehlende Dokumentationen */}
              <div className="mb-8">
                <h4 className="text-red-400 mb-3 font-semibold">
                  ❌ Fehlende Dokumentationen ({missingDocsModal.missingEvents.length})
                </h4>
                {missingDocsModal.missingEvents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Datum</th>
                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Kunde</th>
                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Gesprächstyp</th>
                          <th className="text-center p-3 text-xs text-gray-400 uppercase">Calendly Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missingDocsModal.missingEvents
                          .sort((a: any, b: any) => new Date(b.start_time || b.startTime).getTime() - new Date(a.start_time || a.startTime).getTime())
                          .map((event: any, idx: number) => (
                          <tr key={event.id || idx} className="border-b border-gray-800">
                            <td className="p-3 text-sm text-gray-300">
                              {event.start_time || event.startTime 
                                ? new Date(event.start_time || event.startTime).toLocaleString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </td>
                            <td className="p-3 text-sm text-gray-300">{event.invitee_name || event.invitee_email || '-'}</td>
                            <td className="p-3 text-sm text-gray-300">
                              {formatActivityType(event.event_type_name || event.event_name || '')}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                event.status === 'active' 
                                  ? 'bg-green-900 bg-opacity-50 text-green-400' 
                                  : 'bg-red-900 bg-opacity-50 text-red-400'
                              }`}>
                                {event.status || 'unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 bg-gray-800 rounded-lg">
                    ✅ Alle Termine sind dokumentiert!
                  </div>
                )}
              </div>
              
              {/* Tabelle: Dokumentierte Termine */}
              {missingDocsModal.documentedEvents.length > 0 && (
                <div>
                  <h4 className="text-green-400 mb-3 font-semibold">
                    ✅ Dokumentierte Termine ({missingDocsModal.documentedEvents.length})
                  </h4>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Datum</th>
                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Kunde</th>
                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Gesprächstyp</th>
                          <th className="text-center p-3 text-xs text-gray-400 uppercase">Ergebnis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missingDocsModal.documentedEvents
                          .sort((a: any, b: any) => {
                            const dateA = a.start_time || a.startTime || a.date || ''
                            const dateB = b.start_time || b.startTime || b.date || ''
                            return new Date(dateB).getTime() - new Date(dateA).getTime()
                          })
                          .slice(0, 10)
                          .map((event: any, idx: number) => (
                          <tr key={event.id || idx} className="border-b border-gray-800">
                            <td className="p-3 text-sm text-gray-300">
                              {event.start_time || event.startTime || event.date
                                ? new Date(event.start_time || event.startTime || event.date).toLocaleString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </td>
                            <td className="p-3 text-sm text-gray-300">{event.invitee_name || event.invitee_email || '-'}</td>
                            <td className="p-3 text-sm text-gray-300">
                              {formatActivityType(event.activity_type || event.event_type_name || event.event_name || '')}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                event.actual_result?.toLowerCase().includes('stattgefunden')
                                  ? 'bg-green-900 bg-opacity-50 text-green-400'
                                  : 'bg-gray-800 text-gray-300'
                              }`}>
                                {event.actual_result || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {missingDocsModal.documentedEvents.length > 10 && (
                      <div className="p-3 text-center text-xs text-gray-400">
                        ... und {missingDocsModal.documentedEvents.length - 10} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </AuthGuard>
  )
}
