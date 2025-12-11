import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchCalendlyEvents, 
  fetchCalendlyStats,
  fetchCustomActivitiesStats,
  fetchAdvisorCompletion,
  fetchForecastBackcast,
  syncCustomActivities,
  fetchMatchedActivities
} from '../services/api';
import AppointmentTypeDetail from './AppointmentTypeDetail';

const AnalysisDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // 7, 14, 30, 90 Tage
  const [dataSource, setDataSource] = useState('merged'); // 'custom-activities' | 'calendly' | 'merged'
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Neue States
  const [calendlyStats, setCalendlyStats] = useState(null);
  const [customActivitiesStats, setCustomActivitiesStats] = useState(null);
  const [advisorCompletion, setAdvisorCompletion] = useState([]);
  const [mergedStats, setMergedStats] = useState([]);
  const [selectedType, setSelectedType] = useState(null); // Für Detail-Ansicht
  const [forecastBackcastData, setForecastBackcastData] = useState({ forecast: [], backcast: [] });
  const [selectedAdvisor, setSelectedAdvisor] = useState('all'); // Filter für Berater (Legacy - wird durch selectedBackcastAdvisors ersetzt)
  const [selectedBackcastAdvisors, setSelectedBackcastAdvisors] = useState([]); // Checkboxen für Berater im Backcast
  const [selectedAppointmentType, setSelectedAppointmentType] = useState('all'); // Filter für Gesprächsart
  const [activeSection, setActiveSection] = useState('performance'); // 'performance' | 'forecast-backcast'
  const [selectedForecastAdvisors, setSelectedForecastAdvisors] = useState(['Sina Hinricher', 'Florian Hörning']); // Checkboxen für Berater im Forecast - Default: Sina und Florian
  const [selectedForecastEventType, setSelectedForecastEventType] = useState('all'); // Filter für Terminart im Forecast
  const [forecastTimeRange, setForecastTimeRange] = useState(30); // 7, 14, 30, 90 Tage für Forecast
  const [selectedPerformanceAdvisors, setSelectedPerformanceAdvisors] = useState([]); // Checkboxen für Berater in Performance (Array von user_ids)
  const [dateRangeMode, setDateRangeMode] = useState('preset'); // 'preset' oder 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [matchedEvents, setMatchedEvents] = useState([]);
  const [missingDocsModal, setMissingDocsModal] = useState(null); // { advisor, advisorName, missingEvents }
  const [allCalendlyEvents, setAllCalendlyEvents] = useState([]); // Alle Calendly Events für Abgleich

  // Berechne Datum-Range basierend auf timeRange oder Custom-Dates
  const dateRange = useMemo(() => {
    if (dateRangeMode === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      };
    }
    // Vordefinierter Zeitraum
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }, [timeRange, dateRangeMode, customStartDate, customEndDate]);

  // Data Loading
  useEffect(() => {
    loadAllData();
    loadMatchedEvents();
  }, [dateRange]);
  
  useEffect(() => {
    loadForecastBackcast();
  }, [dateRange, forecastTimeRange]); // forecastTimeRange für Forecast-Zeitraum

  // Lade Matched Events
  const loadMatchedEvents = async () => {
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
        // userId Filter entfernt, da wir alle Events sehen wollen
      };
      console.log('[AnalysisDashboard] Lade matched events mit params:', params);
      const events = await fetchMatchedActivities(params);
      console.log('[AnalysisDashboard] Matched events geladen:', events.length);
      setMatchedEvents(events || []);
    } catch (error) {
      console.error('[AnalysisDashboard] Fehler beim Laden matched events:', error);
      setMatchedEvents([]);
    }
  };

  // Sync Funktion
  const handleSyncCustomActivities = async () => {
    setSyncing(true);
    setSyncMessage('');
    
    try {
      const result = await syncCustomActivities(90);
      setSyncMessage(`✅ ${result.synced} Custom Activities synchronisiert, ${result.matched} zu Events gematched!`);
      
      // Reload Daten
      await Promise.all([
        loadAllData(),
        loadMatchedEvents()
      ]);
    } catch (error) {
      setSyncMessage(`❌ Fehler: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  const loadForecastBackcast = async () => {
    try {
      // Forecast: Nächste 7/14/30/90 Tage (abhängig von forecastTimeRange)
      const forecastEndDate = new Date();
      forecastEndDate.setDate(forecastEndDate.getDate() + forecastTimeRange);
      
      // Backcast: Vergangene Events im gewählten Zeitraum
      const params = {
        startDate: dateRange.startDate, // Für Backcast
        endDate: dateRange.endDate, // Für Backcast
        forecastEndDate: forecastEndDate.toISOString().split('T')[0] // Für Forecast
      };
      
      console.log('[AnalysisDashboard] Lade Forecast/Backcast mit params:', params);
      const data = await fetchForecastBackcast(params);
      console.log('[AnalysisDashboard] Forecast/Backcast geladen:', {
        forecast: data.forecast?.length || 0,
        backcast: data.backcast?.length || 0,
        sampleForecast: data.forecast?.slice(0, 2),
        sampleBackcast: data.backcast?.slice(0, 2)
      });
      setForecastBackcastData(data || { forecast: [], backcast: [] });
    } catch (error) {
      console.error('[AnalysisDashboard] Fehler beim Laden Forecast/Backcast:', error);
      setForecastBackcastData({ forecast: [], backcast: [] });
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
        // Lade alle Daten, Filterung erfolgt im Frontend
      };

      console.log('[AnalysisDashboard] Starte Datenladung...', params);

      // Lade beides parallel mit Timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Datenladung dauerte zu lange')), 30000) // Reduziert auf 30 Sekunden
      );

      const dataPromise = Promise.all([
        fetchCalendlyStats(params).catch(err => {
          console.error('[AnalysisDashboard] Fehler bei Calendly Stats:', err);
          return null;
        }),
        fetchCustomActivitiesStats(params).catch(err => {
          console.error('[AnalysisDashboard] Fehler bei Custom Activities Stats:', err);
          return null;
        }),
        fetchAdvisorCompletion(params).catch(err => {
          console.error('[AnalysisDashboard] Fehler bei Advisor Completion:', err);
          return null;
        })
      ]);

      const [calendly, activities, completion] = await Promise.race([dataPromise, timeoutPromise]);

      console.log('[AnalysisDashboard] Daten geladen:', {
        calendly: !!calendly,
        activities: !!activities,
        completion: !!completion,
        completionLength: completion?.length,
        completionData: completion
      });

      setCalendlyStats(calendly);
      setCustomActivitiesStats(activities);
      setAdvisorCompletion(completion || []);

      // Lade auch alle Calendly Events für geplante Termine
      let allCalendlyEventsData = [];
      try {
        const eventsParams = {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        };
        allCalendlyEventsData = await fetchCalendlyEvents(eventsParams).catch(() => []);
        setAllCalendlyEvents(allCalendlyEventsData);
      } catch (err) {
        console.error('[AnalysisDashboard] Fehler beim Laden aller Calendly Events:', err);
        setAllCalendlyEvents([]);
      }
      
      // Merge Logik - verwende matchedEvents und allCalendlyEvents falls verfügbar
      const merged = mergeDataSources(calendly, activities, completion || [], matchedEvents, allCalendlyEventsData);
      setMergedStats(merged);
    } catch (error) {
      console.error('[AnalysisDashboard] Fehler beim Laden:', error);
      // Zeige Fehler dem User
      alert(`Fehler beim Laden der Daten: ${error.message}. Bitte Seite neu laden.`);
    } finally {
      setLoading(false);
    }
  };

  // Merge Funktion
  function mergeDataSources(calendly, activities, completion, matchedEventsParam = null, allCalendlyEvents = null) {
    // Fallback: Wenn completion leer ist, versuche Berater aus anderen Quellen zu extrahieren
    if (!completion || completion.length === 0) {
      console.log('[AnalysisDashboard] completion ist leer, versuche Fallback');
      
      // Versuche 1: Aus matchedEvents extrahieren und aggregieren (Parameter oder State)
      const eventsToUse = matchedEventsParam || matchedEvents;
      if (eventsToUse && eventsToUse.length > 0) {
        const advisorsMap = new Map();
        
        // Aggregiere Daten aus matchedEvents
        eventsToUse.forEach(event => {
          const advisorName = event.host_name || event.user_name;
          const userId = event.user_id || event.host_email || advisorName;
          
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
              });
            }
            
            const advisor = advisorsMap.get(userId);
            
            // Zähle geplante Termine (nur wenn Event existiert)
            // planned wird später aus allCalendlyEvents gezählt
            
            // Zähle Calendly Status
            if (event.calendly_status === 'active') {
              advisor.calendlyActive++;
            } else if (event.calendly_status === 'canceled') {
              advisor.calendlyCanceled++;
            }
            
            // Zähle Custom Activity Ergebnisse (wenn vorhanden)
            if (event.actual_result) {
              advisor.completed++;
              const result = event.actual_result.toLowerCase();
              if (result.includes('stattgefunden')) {
                advisor.stattgefunden++;
              } else if (result.includes('no-show') || result.includes('no show')) {
                advisor.noShow++;
              } else if (result.includes('ausgefallen')) {
                advisor.ausgefallen++;
              } else if (result.includes('verschoben')) {
                advisor.verschoben++;
              }
            }
          }
        });
        
        // Zähle geplante Termine aus allCalendlyEvents
        if (allCalendlyEvents && allCalendlyEvents.length > 0) {
          allCalendlyEvents.forEach(event => {
            const advisorName = event.host_name || event.user_name;
            const userId = event.user_id || event.host_email || advisorName;
            if (advisorName && advisorsMap.has(userId)) {
              const advisor = advisorsMap.get(userId);
              advisor.planned++;
            }
          });
        } else {
          // Fallback: Zähle aus matchedEvents (wenn kein allCalendlyEvents verfügbar)
          eventsToUse.forEach(event => {
            const advisorName = event.host_name || event.user_name;
            const userId = event.user_id || event.host_email || advisorName;
            if (advisorName && advisorsMap.has(userId)) {
              const advisor = advisorsMap.get(userId);
              advisor.planned++;
            }
          });
        }
        
        const fallbackAdvisors = Array.from(advisorsMap.values());
        console.log('[AnalysisDashboard] Fallback-Advisors aus matchedEvents (aggregiert):', fallbackAdvisors);
        
        if (fallbackAdvisors.length > 0) {
          return fallbackAdvisors.map(advisor => {
            // Berechne Completion Rate
            // Wenn planned = 0 aber documented > 0, dann haben wir nur dokumentierte ohne geplante (z.B. alte Termine)
            let completionRate = 0;
            let missing = 0;
            
            if (advisor.planned > 0) {
              completionRate = Math.round((advisor.completed / advisor.planned) * 100);
              missing = Math.max(0, advisor.planned - advisor.completed);
            } else if (advisor.completed > 0) {
              // Nur dokumentierte, keine geplanten - das ist OK (z.B. alte Termine)
              completionRate = 100; // Alles dokumentiert, was vorhanden ist
              missing = 0;
            }
            
            // Berechne Status
            const activityData = {
              'Stattgefunden': advisor.stattgefunden,
              'No-Show': advisor.noShow,
              'Ausgefallen (Kunde)': 0,
              'Ausgefallen (Berater)': 0,
              'Verschoben': advisor.verschoben
            };
            const status = getStatusFromActivities(activityData, completionRate);
            
            return {
              advisor: advisor.advisor,
              user_id: advisor.user_id,
              planned: advisor.planned,
              documented: advisor.completed, // Anzahl dokumentierter Custom Activities
              completionRate,
              missing,
              stattgefunden: advisor.stattgefunden,
              noShow: advisor.noShow,
              ausgefallen: advisor.ausgefallen,
              verschoben: advisor.verschoben,
              calendlyActive: advisor.calendlyActive,
              calendlyCanceled: advisor.calendlyCanceled,
              status
            };
          });
        }
      }
      
      // Versuche 2: Aus Calendly Stats extrahieren
      if (calendly && calendly.byAdvisor) {
        const advisorsMap = new Map();
        Object.entries(calendly.byAdvisor).forEach(([userId, data]) => {
          const advisorName = data.hostName || data.advisor || userId;
          if (!advisorsMap.has(userId)) {
            advisorsMap.set(userId, {
              advisor: advisorName,
              user_id: userId,
              planned: data.active || 0,
              completed: 0,
              completionRate: 0,
              missing: 0
            });
          }
        });
        const fallbackAdvisors = Array.from(advisorsMap.values());
        console.log('[AnalysisDashboard] Fallback-Advisors aus Calendly:', fallbackAdvisors);
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
          }));
        }
      }
      
      return [];
    }

    // WICHTIG: Wenn advisorCompletion 0 dokumentierte Activities hat, aber matchedEvents vorhanden sind,
    // verwende matchedEvents als Source of Truth für dokumentierte Activities
    const eventsToUse = matchedEventsParam || matchedEvents;
    const matchedEventsByAdvisor = {};
    
    if (eventsToUse && eventsToUse.length > 0) {
      eventsToUse.forEach(event => {
        const advisorName = event.host_name || event.user_name;
        const userId = event.user_id || event.host_email || advisorName;
        
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
            };
          }
          
          const advisor = matchedEventsByAdvisor[userId];
          advisor.documented++;
          
          const result = (event.actual_result || '').toLowerCase();
          if (result.includes('stattgefunden')) {
            advisor.stattgefunden++;
          } else if (result.includes('no-show') || result.includes('no show')) {
            advisor.noShow++;
          } else if (result.includes('ausgefallen')) {
            advisor.ausgefallen++;
          } else if (result.includes('verschoben')) {
            advisor.verschoben++;
          }
        }
      });
    }
    
    return completion.map(advisor => {
      // Priorisierung: Custom Activities > Calendly
      const activityData = activities?.byAdvisor?.[advisor.user_id] || {};
      const calendlyData = calendly?.byAdvisor?.[advisor.user_id] || {};
      
      // WICHTIG: Wenn advisor.completed = 0, aber matchedEvents für diesen Advisor vorhanden sind,
      // verwende matchedEvents als dokumentierte Activities
      const matchedData = matchedEventsByAdvisor[advisor.user_id] || matchedEventsByAdvisor[advisor.advisor];
      const documentedFromMatched = matchedData?.documented || 0;
      
      // Verwende den höheren Wert: advisor.completed ODER documentedFromMatched
      const documented = Math.max(advisor.completed || 0, documentedFromMatched);
      
      // Wenn matchedEvents verwendet werden, nutze auch deren Ergebnisse
      const stattgefunden = matchedData?.stattgefunden || activityData['Stattgefunden'] || 0;
      const noShow = matchedData?.noShow || activityData['No-Show'] || 0;
      const ausgefallen = matchedData?.ausgefallen || (activityData['Ausgefallen (Kunde)'] || 0) + (activityData['Ausgefallen (Berater)'] || 0);
      const verschoben = matchedData?.verschoben || activityData['Verschoben'] || 0;

      // Korrigiere Completion Rate: Wenn planned = 0 aber documented > 0, dann ist alles dokumentiert
      let completionRate = advisor.completionRate || 0;
      let missing = advisor.missing || 0;
      
      if (advisor.planned === 0 && documented > 0) {
        // Nur dokumentierte, keine geplanten - das ist OK (z.B. alte Termine)
        completionRate = 100; // Alles dokumentiert, was vorhanden ist
        missing = 0;
      } else if (advisor.planned > 0) {
        // Normale Berechnung mit korrigiertem documented Wert
        completionRate = Math.round((documented / advisor.planned) * 100);
        missing = Math.max(0, advisor.planned - documented);
      }

      // Status berechnen
      const status = getStatusFromActivities(activityData, completionRate);

      return {
        advisor: advisor.advisor || 'Unbekannt',
        user_id: advisor.user_id,
        
        // Termine geplant (aus Calendly)
        planned: advisor.planned || 0,
        
        // Tatsächlich dokumentiert (aus Custom Activities ODER matchedEvents)
        documented: documented,
        
        // Completion Rate (korrigiert)
        completionRate,
        missing,
        
        // Ergebnisse aus Custom Activities ODER matchedEvents (SOURCE OF TRUTH)
        stattgefunden,
        noShow,
        ausgefallen,
        verschoben,
        
        // Fallback auf Calendly wenn keine Activity
        calendlyActive: calendlyData.active || 0,
        calendlyCanceled: calendlyData.canceled || 0,
        
        // Status-Indicator
        status
      };
    });
  }

  // Status Berechnung
  function getStatusFromActivities(data, completionRate) {
    // Completion Rate Check
    if (completionRate < 50) {
      return { 
        icon: '⚠️', 
        text: 'Dokumentation fehlt', 
        color: '#dc2626' 
      };
    }

    // No-Show Rate aus Custom Activities
    const total = Object.values(data).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    const noShowCount = data['No-Show'] || 0;
    const noShowRate = total > 0 ? (noShowCount / total * 100) : 0;

    if (noShowRate > 20) {
      return { 
        icon: '🔴', 
        text: 'Hohe No-Show-Rate', 
        color: '#dc2626' 
      };
    }

    if (noShowRate > 10) {
      return { 
        icon: '🟡', 
        text: 'Okay', 
        color: '#e3a008' 
      };
    }

    if (completionRate < 80) {
      return { 
        icon: '🟡', 
        text: 'Niedrige Completion', 
        color: '#e3a008' 
      };
    }

    return { 
      icon: '🟢', 
      text: 'Gut', 
      color: '#0ea66e' 
    };
  }

  // Filtere und sortiere merged Stats
  const sortedMergedStats = useMemo(() => {
    // Filter nach ausgewählten Beratern
    let filtered = mergedStats;
    if (selectedPerformanceAdvisors.length > 0) {
      filtered = mergedStats.filter(stat => 
        selectedPerformanceAdvisors.includes(stat.user_id)
      );
    }

    // Sortierung
    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [mergedStats, sortConfig, selectedPerformanceAdvisors]);

  // Re-merge wenn matchedEvents geladen werden (um dokumentierte Activities zu aktualisieren)
  useEffect(() => {
    if (matchedEvents.length > 0 && !loading && advisorCompletion.length > 0) {
      console.log('[AnalysisDashboard] Re-merge mit matchedEvents, um dokumentierte Activities zu aktualisieren');
      // Lade Calendly Events für geplante Termine
      fetchCalendlyEvents({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }).then(allCalendlyEvents => {
        const merged = mergeDataSources(calendlyStats, customActivitiesStats, advisorCompletion, matchedEvents, allCalendlyEvents || []);
        console.log('[AnalysisDashboard] Re-merged Stats:', merged.map(s => ({ advisor: s.advisor, planned: s.planned, documented: s.documented, completionRate: s.completionRate })));
        setMergedStats(merged);
      }).catch(err => {
        console.error('[AnalysisDashboard] Fehler beim Laden Calendly Events für Re-merge:', err);
        const merged = mergeDataSources(calendlyStats, customActivitiesStats, advisorCompletion, matchedEvents, []);
        console.log('[AnalysisDashboard] Re-merged Stats (ohne Calendly Events):', merged.map(s => ({ advisor: s.advisor, planned: s.planned, documented: s.documented, completionRate: s.completionRate })));
        setMergedStats(merged);
      });
    }
  }, [matchedEvents, calendlyStats, customActivitiesStats, advisorCompletion, loading, dateRange]);

  // Initialisiere Standard-Auswahl (Sina und Florian) wenn mergedStats geladen werden
  useEffect(() => {
    if (mergedStats.length > 0 && selectedPerformanceAdvisors.length === 0) {
      const sina = mergedStats.find(s => s.advisor?.toLowerCase().includes('sina'));
      const florian = mergedStats.find(s => s.advisor?.toLowerCase().includes('florian'));
      const defaultSelection = [];
      if (sina) defaultSelection.push(sina.user_id);
      if (florian) defaultSelection.push(florian.user_id);
      if (defaultSelection.length > 0) {
        setSelectedPerformanceAdvisors(defaultSelection);
      }
    }
  }, [mergedStats]);

  // Erweiterte Insights (gefiltert nach ausgewählten Beratern)
  const insights = useMemo(() => {
    const warnings = [];

    // Filtere nach ausgewählten Beratern
    const filteredStats = selectedPerformanceAdvisors.length > 0
      ? mergedStats.filter(stat => selectedPerformanceAdvisors.includes(stat.user_id))
      : mergedStats;

    filteredStats.forEach(stat => {
      // Completion Rate Warnungen - nur wenn wirklich Termine fehlen
      // WICHTIG: Prüfe auch documented > 0, um sicherzustellen, dass wir nicht warnen, wenn alles dokumentiert ist
      if (stat.planned > 0 && stat.completionRate < 50 && stat.missing > 0 && stat.documented < stat.planned) {
        warnings.push({
          type: 'error',
          message: `⚠️ ${stat.advisor} hat ${stat.missing} Termine nicht dokumentiert (${stat.completionRate}% Completion)`,
          consultant: stat.advisor
        });
      } else if (stat.planned > 0 && stat.completionRate === 100 && stat.documented === stat.planned) {
        warnings.push({
          type: 'success',
          message: `✅ ${stat.advisor} hat 100% Completion Rate`,
          consultant: stat.advisor
        });
      }

      // No-Show Warnungen aus Custom Activities
      const total = stat.stattgefunden + stat.noShow + stat.ausgefallen + stat.verschoben;
      if (total > 0) {
        const noShowRate = (stat.noShow / total) * 100;
        if (noShowRate > 20) {
          warnings.push({
            type: 'error',
            message: `🔴 ${stat.advisor} hat hohe No-Show-Rate von ${Math.round(noShowRate)}% laut Custom Activities`,
            consultant: stat.advisor
          });
        }
      }
    });

    return warnings;
  }, [mergedStats, selectedPerformanceAdvisors]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getRowClass = (stat) => {
    if (stat.completionRate < 50) return 'row-critical';
    if (stat.completionRate < 80) return 'row-warning';
    return '';
  };

  const getCompletionClass = (rate) => {
    if (rate < 50) return 'completion-critical';
    if (rate < 80) return 'completion-warning';
    return 'completion-good';
  };

  const appointmentTypes = [
    { key: 'vorqualifizierung', label: 'Vorqualifizierung' },
    { key: 'erstgespraech', label: 'Erstgespräch' },
    { key: 'konzeptgespraech', label: 'Konzeptgespräch' },
    { key: 'umsetzungsgespraech', label: 'Umsetzungsgespräch' },
    { key: 'servicegespraech', label: 'Servicegespräch' }
  ];

  // Funktion zum Formatieren des Activity Types für die Anzeige
  const formatActivityType = (activityType) => {
    if (!activityType) return '-';
    const typeMap = {
      'vorqualifizierung': 'Vorqualifizierung',
      'erstgespraech': 'Erstgespräch',
      'konzeptgespraech': 'Konzeptgespräch',
      'umsetzungsgespraech': 'Umsetzungsgespräch',
      'servicegespraech': 'Servicegespräch'
    };
    // Prüfe exakte Übereinstimmung
    if (typeMap[activityType.toLowerCase()]) {
      return typeMap[activityType.toLowerCase()];
    }
    // Prüfe ob es "gespraech" enthält
    const withoutGespraech = activityType.replace(/gespraech/gi, '').toLowerCase();
    if (withoutGespraech === 'erst') return 'Erstgespräch';
    if (withoutGespraech === 'konzept') return 'Konzeptgespräch';
    if (withoutGespraech === 'umsetzung') return 'Umsetzungsgespräch';
    if (withoutGespraech === 'service') return 'Servicegespräch';
    if (withoutGespraech === 'vorqualifizierung' || withoutGespraech === 'vorqual') return 'Vorqualifizierung';
    // Fallback: Original zurückgeben
    return activityType;
  };

  // Alle verfügbaren Berater für Forecast-Checkboxen
  // Stelle sicher, dass Sina und Florian immer verfügbar sind, auch wenn keine Events vorhanden
  // MUSS VOR forecastData definiert werden, da forecastData darauf zugreift!
  const availableForecastAdvisors = useMemo(() => {
    const events = forecastBackcastData.forecast || [];
    const advisors = new Set(['Sina Hinricher', 'Florian Hörning']); // Standard-Berater immer verfügbar
    events.forEach(event => {
      if (event.host_name) {
        advisors.add(event.host_name);
      }
    });
    return Array.from(advisors).sort();
  }, [forecastBackcastData.forecast]);

  // Forecast-Berechnung (MUSS vor frühen Returns sein!)
  const forecastData = useMemo(() => {
    let events = forecastBackcastData.forecast || [];
    
    // Filter nach Berater (Checkboxen)
    const filteredAdvisors = selectedForecastAdvisors.length > 0 ? selectedForecastAdvisors : availableForecastAdvisors;
    
    if (selectedForecastAdvisors.length > 0) {
      events = events.filter(event => {
        const advisor = event.host_name || 'Unbekannt';
        return selectedForecastAdvisors.includes(advisor);
      });
    }
    
    // Filter nach Terminart
    if (selectedForecastEventType !== 'all') {
      const typeMap = {
        'erstgespraech': ['erstgespräch', 'erstgespraech'],
        'konzeptgespraech': ['konzept'],
        'umsetzungsgespraech': ['umsetzung'],
        'servicegespraech': ['service']
      };
      const searchTerms = typeMap[selectedForecastEventType] || [selectedForecastEventType];
      events = events.filter(e => {
        const eventType = (e.event_type_name || e.event_name || '').toLowerCase();
        return searchTerms.some(term => eventType.includes(term));
      });
    }
    
    const byAdvisor = {};
    
    // Stelle sicher, dass alle ausgewählten Berater in der Tabelle erscheinen, auch wenn keine Events vorhanden
    filteredAdvisors.forEach(advisor => {
      if (!byAdvisor[advisor]) {
        byAdvisor[advisor] = {
          advisor,
          erstgespraeche: 0,
          konzeptgespraeche: 0,
          umsetzungsgespraeche: 0,
          servicegespraeche: 0,
          umsatz: 0
        };
      }
    });
    
    events.forEach(event => {
      const advisor = event.host_name || 'Unbekannt';
      if (!byAdvisor[advisor]) {
        byAdvisor[advisor] = {
          advisor,
          erstgespraeche: 0,
          konzeptgespraeche: 0,
          umsetzungsgespraeche: 0,
          servicegespraeche: 0,
          umsatz: 0
        };
      }
      
      const eventType = (event.event_type_name || event.event_name || '').toLowerCase();
      if (eventType.includes('erstgespräch') || eventType.includes('erstgespraech')) {
        byAdvisor[advisor].erstgespraeche++;
      } else if (eventType.includes('konzept')) {
        byAdvisor[advisor].konzeptgespraeche++;
      } else if (eventType.includes('umsetzung')) {
        byAdvisor[advisor].umsetzungsgespraeche++;
      } else if (eventType.includes('service')) {
        byAdvisor[advisor].servicegespraeche++;
      }
      
      if (event.opportunity_value) {
        byAdvisor[advisor].umsatz += parseFloat(event.opportunity_value) || 0;
      }
    });
    
    // Sortiere nach Berater-Name
    return Object.values(byAdvisor).sort((a, b) => a.advisor.localeCompare(b.advisor));
  }, [forecastBackcastData.forecast, selectedForecastAdvisors, selectedForecastEventType, availableForecastAdvisors]);

  // Alle verfügbaren Berater für Backcast-Checkboxen
  const availableBackcastAdvisors = useMemo(() => {
    const events = forecastBackcastData.backcast || [];
    const advisors = new Set();
    events.forEach(event => {
      if (event.host_name) {
        advisors.add(event.host_name);
      }
    });
    return Array.from(advisors).sort();
  }, [forecastBackcastData.backcast]);

  // Backcast-Berechnung (MUSS vor frühen Returns sein!)
  const backcastData = useMemo(() => {
    let events = forecastBackcastData.backcast || [];
    
    // Filter nach Berater (Checkboxen)
    if (selectedBackcastAdvisors.length > 0) {
      events = events.filter(event => {
        const advisor = event.host_name || 'Unbekannt';
        return selectedBackcastAdvisors.includes(advisor);
      });
    }
    
    // Filter nach Gesprächsart
    if (selectedAppointmentType !== 'all') {
      const typeMap = {
        'erstgespraech': 'erstgespräch',
        'konzeptgespraech': 'konzept',
        'umsetzungsgespraech': 'umsetzung',
        'servicegespraech': 'service'
      };
      const searchTerm = typeMap[selectedAppointmentType] || selectedAppointmentType;
      events = events.filter(e => {
        const eventType = (e.event_type_name || e.event_name || '').toLowerCase();
        return eventType.includes(searchTerm);
      });
    }
    
    const byAdvisor = {};
    
    events.forEach(event => {
      const advisor = event.host_name || 'Unbekannt';
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
        };
      }
      
      byAdvisor[advisor].gespraeche++;
      
      if (event.ergebnis) {
        if (event.ergebnis === 'Stattgefunden') {
          byAdvisor[advisor].stattgefunden++;
        }
        byAdvisor[advisor].ergebnisse[event.ergebnis] = 
          (byAdvisor[advisor].ergebnisse[event.ergebnis] || 0) + 1;
      }
      
      // Folgetermin vereinbart: Prüfe ob es ein Custom Activity mit "Folgetermin" gibt
      // Oder ob das Ergebnis "Stattgefunden" ist (dann wurde wahrscheinlich ein Folgetermin vereinbart)
      if (event.ergebnis === 'Stattgefunden') {
        // Wenn ein Custom Activity vorhanden ist, wurde wahrscheinlich ein Folgetermin vereinbart
        byAdvisor[advisor].folgeterminVereinbart++;
      }
      
      // Folgetermin CA ausgefüllt: Wenn Custom Activity vorhanden ist
      if (event.ergebnis && event.activity_type) {
        byAdvisor[advisor].folgeterminCA++;
      }
    });
    
    // Berechne Prozente
    Object.values(byAdvisor).forEach(stat => {
      if (stat.gespraeche > 0) {
        stat.stattgefundenProzent = Math.round((stat.stattgefunden / stat.gespraeche) * 100);
        stat.folgeterminVereinbartProzent = Math.round((stat.folgeterminVereinbart / stat.gespraeche) * 100);
        stat.folgeterminCAProzent = Math.round((stat.folgeterminCA / stat.gespraeche) * 100);
      }
    });
    
    return Object.values(byAdvisor);
  }, [forecastBackcastData.backcast, selectedAppointmentType]);

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
    ];

    const rows = mergedStats.map(stat => [
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
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `berater_analyse_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Wenn ein Termintyp ausgewählt ist, zeige Detail-Ansicht
  if (selectedType) {
    return (
      <div>
        <AppointmentTypeDetail 
          type={selectedType}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onBack={() => {
            console.log('[AnalysisDashboard] onBack aufgerufen, setze selectedType auf null');
            setSelectedType(null);
          }}
        />
      </div>
    );
  }

  // Wähle Datenquelle basierend auf Filter
  const displayStats = dataSource === 'merged' 
    ? sortedMergedStats 
    : dataSource === 'custom-activities'
    ? sortedMergedStats // Custom Activities sind bereits in merged enthalten
    : sortedMergedStats; // Fallback

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>Lade Analyse-Daten...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header mit Tabs */}
      <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2>📊 Analyse</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveSection('performance')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeSection === 'performance' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeSection === 'performance' ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                color: activeSection === 'performance' ? '#4a90e2' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveSection('forecast-backcast')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeSection === 'forecast-backcast' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeSection === 'forecast-backcast' ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                color: activeSection === 'forecast-backcast' ? '#4a90e2' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Forecast / Backcast
            </button>
          </div>
        </div>
        
        {/* Filter nur bei Performance */}
        {activeSection === 'performance' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Berater:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={selectedPerformanceAdvisors.length === 0 || selectedPerformanceAdvisors.length === mergedStats.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Alle auswählen
                        setSelectedPerformanceAdvisors(mergedStats.map(s => s.user_id));
                      } else {
                        // Alle abwählen
                        setSelectedPerformanceAdvisors([]);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Alle</span>
                </label>
                {loading ? (
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>Lade Berater...</span>
                ) : mergedStats.length > 0 ? (
                  mergedStats.map(stat => (
                    <label key={stat.user_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={selectedPerformanceAdvisors.includes(stat.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPerformanceAdvisors([...selectedPerformanceAdvisors, stat.user_id]);
                          } else {
                            setSelectedPerformanceAdvisors(selectedPerformanceAdvisors.filter(id => id !== stat.user_id));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{stat.advisor}</span>
                    </label>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>Keine Berater gefunden</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Datenquelle:
              </label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value="merged">Merged (Empfohlen)</option>
                <option value="custom-activities">Nur Custom Activities</option>
                <option value="calendly">Nur Calendly</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Zeitraum:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    name="dateRangeMode"
                    value="preset"
                    checked={dateRangeMode === 'preset'}
                    onChange={(e) => setDateRangeMode(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Vordefiniert</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="radio"
                    name="dateRangeMode"
                    value="custom"
                    checked={dateRangeMode === 'custom'}
                    onChange={(e) => setDateRangeMode(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Eigener Zeitraum</span>
                </label>
              </div>
              {dateRangeMode === 'preset' ? (
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="7">Letzte 7 Tage</option>
                  <option value="14">Letzte 14 Tage</option>
                  <option value="30">Letzte 30 Tage</option>
                  <option value="90">Letzte 90 Tage</option>
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#e5e7eb',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>bis</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#e5e7eb',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleSyncCustomActivities}
              disabled={syncing}
              style={{
                padding: '8px 16px',
                backgroundColor: syncing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 144, 226, 0.1)',
                border: `1px solid ${syncing ? 'rgba(255, 255, 255, 0.2)' : 'rgba(74, 144, 226, 0.3)'}`,
                borderRadius: '6px',
                color: syncing ? 'rgba(255, 255, 255, 0.5)' : '#4a90e2',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                opacity: syncing ? 0.6 : 1
              }}
            >
              {syncing ? '⏳ Synchronisiere...' : '🔄 Custom Activities Sync'}
            </button>
            <button
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(14, 166, 110, 0.1)',
                border: '1px solid rgba(14, 166, 110, 0.3)',
                borderRadius: '6px',
                color: '#0ea66e',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              📥 CSV Export
            </button>
          </div>
        )}
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className="stat-card full-width" style={{ 
          marginBottom: '20px',
          backgroundColor: syncMessage.includes('✅') 
            ? 'rgba(14, 166, 110, 0.1)' 
            : 'rgba(220, 38, 38, 0.1)',
          border: `1px solid ${syncMessage.includes('✅') 
            ? 'rgba(14, 166, 110, 0.3)' 
            : 'rgba(220, 38, 38, 0.3)'}`,
          color: syncMessage.includes('✅') ? '#0ea66e' : '#dc2626',
          padding: '12px 16px',
          fontSize: '13px'
        }}>
          {syncMessage}
        </div>
      )}

      {/* Performance Sektion */}
      {activeSection === 'performance' && (
        <>
          {/* Termintyp-Detail-Links - JETZT OBEN */}
          <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
            <h2 style={{ marginBottom: '16px' }}>📋 Termintyp-Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {appointmentTypes.map(type => (
                <button
                  key={type.key}
                  onClick={() => setSelectedType(type.key)}
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    border: '1px solid rgba(74, 144, 226, 0.3)',
                    borderRadius: '6px',
                    color: '#4a90e2',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(74, 144, 226, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
                  }}
                >
                  {type.label} →
                </button>
              ))}
            </div>
          </div>

          {/* Insights/Warnungen */}
          {insights.length > 0 && (
            <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>🔔 Insights & Warnungen</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: insight.type === 'error' 
                    ? 'rgba(220, 38, 38, 0.1)' 
                    : insight.type === 'warning'
                    ? 'rgba(227, 160, 8, 0.1)'
                    : insight.type === 'success'
                    ? 'rgba(14, 166, 110, 0.1)'
                    : 'rgba(74, 144, 226, 0.1)',
                  border: `1px solid ${
                    insight.type === 'error'
                      ? 'rgba(220, 38, 38, 0.3)'
                      : insight.type === 'warning'
                      ? 'rgba(227, 160, 8, 0.3)'
                      : insight.type === 'success'
                      ? 'rgba(14, 166, 110, 0.3)'
                      : 'rgba(74, 144, 226, 0.3)'
                  }`,
                  color: insight.type === 'error'
                    ? '#dc2626'
                    : insight.type === 'warning'
                    ? '#e3a008'
                    : insight.type === 'success'
                    ? '#0ea66e'
                    : '#4a90e2',
                  fontSize: '13px'
                }}
              >
                {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erweiterte Berater-Performance Tabelle */}
      <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '16px' }}>👥 Berater-Performance (Custom Activities = Source of Truth)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th 
                  style={{ 
                    textAlign: 'left', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('advisor')}
                >
                  Berater {sortConfig.key === 'advisor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    textAlign: 'right', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('planned')}
                >
                  Geplant (Calendly) {sortConfig.key === 'planned' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    textAlign: 'right', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('documented')}
                >
                  Dokumentiert (Activities) {sortConfig.key === 'documented' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    textAlign: 'right', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('completionRate')}
                >
                  Completion Rate {sortConfig.key === 'completionRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ 
                    textAlign: 'right', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase'
                  }}
                >
                  Stattgefunden
                </th>
                <th 
                  style={{ 
                    textAlign: 'right', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase'
                  }}
                >
                  No-Show
                </th>
                <th 
                  style={{ 
                    textAlign: 'right', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase'
                  }}
                >
                  Ausgefallen
                </th>
                <th 
                  style={{ 
                    textAlign: 'right', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase'
                  }}
                >
                  Verschoben
                </th>
                <th 
                  style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase'
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {displayStats.map((stat, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    backgroundColor: stat.completionRate < 50
                      ? 'rgba(220, 38, 38, 0.1)' 
                      : stat.completionRate < 80
                      ? 'rgba(227, 160, 8, 0.05)'
                      : 'transparent'
                  }}
                >
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}>
                    {stat.advisor}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>
                    {stat.planned}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>
                    {stat.documented}
                    {stat.missing > 0 && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: 'rgba(220, 38, 38, 0.2)',
                        color: '#dc2626',
                        fontWeight: '500'
                      }}>
                        -{stat.missing}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: stat.completionRate < 50
                        ? 'rgba(220, 38, 38, 0.2)'
                        : stat.completionRate < 80
                        ? 'rgba(227, 160, 8, 0.2)'
                        : 'rgba(14, 166, 110, 0.2)',
                      color: stat.completionRate < 50
                        ? '#dc2626'
                        : stat.completionRate < 80
                        ? '#e3a008'
                        : '#0ea66e'
                    }}>
                      {stat.completionRate}%
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#0ea66e' }}>
                    {stat.stattgefunden}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#dc2626' }}>
                    {stat.noShow}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#e3a008' }}>
                    {stat.ausgefallen}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#4a90e2' }}>
                    {stat.verschoben}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span 
                      style={{ 
                        color: stat.status.color,
                        cursor: stat.missing > 0 ? 'pointer' : 'default',
                        textDecoration: stat.missing > 0 ? 'underline' : 'none'
                      }}
                      onClick={() => {
                        if (stat.missing > 0) {
                          // Finde fehlende Termine: Calendly Events ohne Custom Activity
                          const advisorEvents = allCalendlyEvents.filter(e => {
                            const eventUserId = e.user_id || e.host_email || e.host_name;
                            const statUserId = stat.user_id;
                            return eventUserId === statUserId || 
                                   e.host_name === stat.advisor || 
                                   e.user_name === stat.advisor;
                          });
                          
                          // Finde Events mit Custom Activity (aus matchedEvents)
                          const documentedEventIds = new Set(
                            matchedEvents
                              .filter(e => {
                                const eventUserId = e.user_id || e.host_email || e.host_name;
                                return eventUserId === stat.user_id || 
                                       e.host_name === stat.advisor || 
                                       e.user_name === stat.advisor;
                              })
                              .map(e => e.calendly_event_id || e.id)
                              .filter(Boolean)
                          );
                          
                          // Fehlende Events = Events ohne Custom Activity
                          const missingEvents = advisorEvents.filter(e => 
                            !documentedEventIds.has(e.id) && 
                            e.status === 'active' // Nur aktive Events
                          );
                          
                          setMissingDocsModal({
                            advisor: stat.advisor,
                            advisorName: stat.advisor,
                            missingEvents: missingEvents,
                            documentedEvents: matchedEvents.filter(e => {
                              const eventUserId = e.user_id || e.host_email || e.host_name;
                              return eventUserId === stat.user_id || 
                                     e.host_name === stat.advisor || 
                                     e.user_name === stat.advisor;
                            })
                          });
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

      {/* Matched Events Tabelle - Was wurde aus vergangenen Terminen? */}
      {activeSection === 'performance' && (
        <div className="stat-card full-width" style={{ marginTop: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>
            📊 Termine mit Ergebnissen 
            {matchedEvents.length > 0 && (
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '12px' }}>
                ({matchedEvents.length} gefunden)
              </span>
            )}
          </h2>
          {matchedEvents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
              Keine gematched Events gefunden. Bitte Custom Activities synchronisieren.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Datum</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Kunde</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Berater</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Typ</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Calendly Status</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Tatsächliches Ergebnis</th>
                      <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>
                    Match
                    <span 
                      style={{ 
                        marginLeft: '4px', 
                        fontSize: '10px', 
                        cursor: 'help',
                        borderBottom: '1px dotted rgba(255, 255, 255, 0.3)'
                      }}
                      title="Match-Confidence: Zeigt an, wie sicher das System ist, dass die Custom Activity zu diesem Calendly-Event passt (basierend auf E-Mail-Match und Datumsnähe). Grün >80%, Gelb 60-80%, Rot <60%"
                    >
                      ⓘ
                    </span>
                  </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedEvents.slice(0, 50).map((event, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          {new Date(event.start_time).toLocaleDateString('de-DE', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{event.invitee_name || '-'}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{event.host_name || event.user_name || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {formatActivityType(event.activity_type)}
                    </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: event.calendly_status === 'active' 
                              ? 'rgba(14, 166, 110, 0.2)' 
                              : event.calendly_status === 'canceled'
                              ? 'rgba(220, 38, 38, 0.2)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: event.calendly_status === 'active' 
                              ? '#0ea66e' 
                              : event.calendly_status === 'canceled'
                              ? '#dc2626'
                              : 'rgba(255, 255, 255, 0.6)'
                          }}>
                            {event.calendly_status || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: event.actual_result === 'Stattgefunden' 
                              ? 'rgba(14, 166, 110, 0.2)' 
                              : event.actual_result === 'No-Show'
                              ? 'rgba(220, 38, 38, 0.2)'
                              : event.actual_result === 'Verschoben'
                              ? 'rgba(74, 144, 226, 0.2)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: event.actual_result === 'Stattgefunden' 
                              ? '#0ea66e' 
                              : event.actual_result === 'No-Show'
                              ? '#dc2626'
                              : event.actual_result === 'Verschoben'
                              ? '#4a90e2'
                              : 'rgba(255, 255, 255, 0.6)'
                          }}>
                            {event.actual_result || 'Nicht ausgefüllt'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {event.match_confidence && (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: event.match_confidence > 0.8 
                                ? 'rgba(14, 166, 110, 0.2)' 
                                : event.match_confidence > 0.6
                                ? 'rgba(227, 160, 8, 0.2)'
                                : 'rgba(220, 38, 38, 0.2)',
                              color: event.match_confidence > 0.8 
                                ? '#0ea66e' 
                                : event.match_confidence > 0.6
                                ? '#e3a008'
                                : '#dc2626'
                            }}>
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
                <div style={{ marginTop: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
                  Zeige 50 von {matchedEvents.length} Ergebnissen
                </div>
              )}
            </>
          )}
        </div>
      )}

        </>
      )}

      {/* Forecast / Backcast Sektion */}
      {activeSection === 'forecast-backcast' && (
        <div>
          {/* Filter für Forecast */}
          <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Forecast Filter</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', display: 'block' }}>
                  Zeitraum (nächste X Tage):
                </label>
                <select
                  value={forecastTimeRange}
                  onChange={(e) => setForecastTimeRange(parseInt(e.target.value))}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    marginBottom: '16px'
                  }}
                >
                  <option value="7">Nächste 7 Tage</option>
                  <option value="14">Nächste 14 Tage</option>
                  <option value="30">Nächste 30 Tage</option>
                  <option value="90">Nächste 90 Tage</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', display: 'block' }}>
                  Berater (Checkboxen):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={selectedForecastAdvisors.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForecastAdvisors([]);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Alle</span>
                  </label>
                  {availableForecastAdvisors.map(advisor => (
                    <label key={advisor} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={selectedForecastAdvisors.includes(advisor)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForecastAdvisors([...selectedForecastAdvisors, advisor]);
                          } else {
                            setSelectedForecastAdvisors(selectedForecastAdvisors.filter(a => a !== advisor));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{advisor}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginRight: '8px' }}>
                  Terminart (Forecast):
                </label>
                <select
                  value={selectedForecastEventType}
                  onChange={(e) => setSelectedForecastEventType(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
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

          {/* Forecast Tabelle - DIREKT NACH FILTERN */}
          <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Forecast</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Berater Name</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Erstgespräche</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Konzeptgespräche</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Umsetzungsgespräche</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Servicegespräche</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>pot. Umsatz</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                        Keine Forecast-Daten verfügbar
                      </td>
                    </tr>
                  ) : (
                    forecastData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.advisor}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.erstgespraeche}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.konzeptgespraeche}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.umsetzungsgespraeche}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.servicegespraeche}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#0ea66e' }}>
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
          <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Backcast Filter</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', display: 'block' }}>
                  Berater (Checkboxen):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={selectedBackcastAdvisors.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBackcastAdvisors([]);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Alle</span>
                  </label>
                  {availableBackcastAdvisors.map(advisor => (
                    <label key={advisor} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={selectedBackcastAdvisors.includes(advisor)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBackcastAdvisors([...selectedBackcastAdvisors, advisor]);
                          } else {
                            setSelectedBackcastAdvisors(selectedBackcastAdvisors.filter(a => a !== advisor));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{advisor}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginRight: '8px' }}>
                  Gesprächsart (Backcast):
                </label>
                <select
                  value={selectedAppointmentType}
                  onChange={(e) => setSelectedAppointmentType(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
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
          <div className="stat-card full-width">
            <h3 style={{ marginBottom: '16px' }}>Backcast</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Berater Name</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>
                      {selectedAppointmentType === 'all' ? 'Gespräche' : appointmentTypes.find(t => t.key === selectedAppointmentType)?.label || 'Gespräche'}
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Davon stattgefunden</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Quote in %</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Folgetermin vereinbart</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Quote in %</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Folgetermin CA ausgefüllt</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Quote in %</th>
                  </tr>
                </thead>
                <tbody>
                  {backcastData.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                        Keine Backcast-Daten verfügbar
                      </td>
                    </tr>
                  ) : (
                    backcastData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.advisor}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.gespraeche}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.stattgefunden}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: row.stattgefundenProzent >= 70 ? '#0ea66e' : row.stattgefundenProzent >= 50 ? '#e3a008' : '#dc2626' }}>
                          {row.stattgefundenProzent}%
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.folgeterminVereinbart}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: row.folgeterminVereinbartProzent >= 70 ? '#0ea66e' : row.folgeterminVereinbartProzent >= 50 ? '#e3a008' : '#dc2626' }}>
                          {row.folgeterminVereinbartProzent}%
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{row.folgeterminCA}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: row.folgeterminCAProzent >= 70 ? '#0ea66e' : row.folgeterminCAProzent >= 50 ? '#e3a008' : '#dc2626' }}>
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setMissingDocsModal(null)}
        >
          <div 
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '24px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              width: '100%',
              maxWidth: '1200px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#e5e7eb', fontSize: '18px' }}>
                📋 Fehlende Dokumentationen: {missingDocsModal.advisorName}
              </h3>
              <button
                onClick={() => setMissingDocsModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Übersicht */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px', 
              marginBottom: '24px' 
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                  FEHLENDE DOKUMENTATIONEN
                </div>
                <div style={{ fontSize: '24px', color: '#dc2626', fontWeight: 'bold' }}>
                  {missingDocsModal.missingEvents.length}
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(14, 166, 110, 0.1)',
                border: '1px solid rgba(14, 166, 110, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                  DOKUMENTIERT
                </div>
                <div style={{ fontSize: '24px', color: '#0ea66e', fontWeight: 'bold' }}>
                  {missingDocsModal.documentedEvents.length}
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                  GESAMT (CALENDLY)
                </div>
                <div style={{ fontSize: '24px', color: '#4a90e2', fontWeight: 'bold' }}>
                  {missingDocsModal.missingEvents.length + missingDocsModal.documentedEvents.length}
                </div>
              </div>
            </div>
            
            {/* Tabelle: Fehlende Dokumentationen */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
                ❌ Fehlende Dokumentationen ({missingDocsModal.missingEvents.length})
              </h4>
              {missingDocsModal.missingEvents.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Datum</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Kunde</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Gesprächstyp</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Calendly Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingDocsModal.missingEvents
                        .sort((a, b) => new Date(b.start_time || b.startTime) - new Date(a.start_time || a.startTime))
                        .map((event, idx) => (
                        <tr key={event.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
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
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            {event.invitee_name || event.invitee_email || '-'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            {formatActivityType(event.event_type_name || event.event_name || '')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: event.status === 'active' 
                                ? 'rgba(14, 166, 110, 0.2)' 
                                : 'rgba(220, 38, 38, 0.2)',
                              color: event.status === 'active' ? '#0ea66e' : '#dc2626'
                            }}>
                              {event.status || 'unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: 'rgba(255, 255, 255, 0.4)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }}>
                  ✅ Alle Termine sind dokumentiert!
                </div>
              )}
            </div>
            
            {/* Tabelle: Dokumentierte Termine (zum Vergleich) */}
            {missingDocsModal.documentedEvents.length > 0 && (
              <div>
                <h4 style={{ color: '#0ea66e', marginBottom: '12px', fontSize: '14px' }}>
                  ✅ Dokumentierte Termine ({missingDocsModal.documentedEvents.length})
                </h4>
                <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Datum</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Kunde</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Gesprächstyp</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Ergebnis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingDocsModal.documentedEvents
                        .sort((a, b) => {
                          const dateA = a.start_time || a.startTime || a.date || '';
                          const dateB = b.start_time || b.startTime || b.date || '';
                          return new Date(dateB) - new Date(dateA);
                        })
                        .slice(0, 10) // Zeige nur die ersten 10
                        .map((event, idx) => (
                        <tr key={event.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
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
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            {event.invitee_name || event.invitee_email || '-'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            {formatActivityType(event.activity_type || event.event_type_name || event.event_name || '')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: event.actual_result?.toLowerCase().includes('stattgefunden')
                                ? 'rgba(14, 166, 110, 0.2)'
                                : 'rgba(255, 255, 255, 0.1)',
                              color: event.actual_result?.toLowerCase().includes('stattgefunden')
                                ? '#0ea66e'
                                : 'rgba(255, 255, 255, 0.8)'
                            }}>
                              {event.actual_result || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {missingDocsModal.documentedEvents.length > 10 && (
                    <div style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '12px'
                    }}>
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
  );
};

export default AnalysisDashboard;
