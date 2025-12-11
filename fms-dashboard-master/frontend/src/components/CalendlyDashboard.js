import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { fetchCalendlyStats, fetchCalendlyEvents, syncCalendly } from '../services/api';

const CalendlyDashboard = ({ selectedUser, startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]); // Alle Events ohne Filter
  const [filteredEvents, setFilteredEvents] = useState([]); // Gefilterte Events
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [monthsBack, setMonthsBack] = useState(6);
  
  // Forecast States
  const [forecastDays, setForecastDays] = useState(30); // 7, 14, 30, 90 Tage
  const [forecastEvents, setForecastEvents] = useState([]);
  const [filteredForecastEvents, setFilteredForecastEvents] = useState([]);
  const [isForecastSyncing, setIsForecastSyncing] = useState(false);
  const [forecastSyncMessage, setForecastSyncMessage] = useState('');
  
  // Forecast Filter States
  const [forecastHostFilter, setForecastHostFilter] = useState([]); // Default: alle
  const [forecastEventTypeFilter, setForecastEventTypeFilter] = useState([]); // Default: alle
  
  // Filter States (wie im Python-Dashboard)
  const [statusFilter, setStatusFilter] = useState(['active']); // Default: nur active
  const [hostFilter, setHostFilter] = useState([]); // Default: alle
  const [eventTypeFilter, setEventTypeFilter] = useState([]); // Default: alle
  const [filterDateRange, setFilterDateRange] = useState({ start: null, end: null }); // Lokaler Datum-Filter

  // Lade ALLE Events (ohne Backend-Filter)
  useEffect(() => {
    loadAllEvents();
  }, []);

  // Wende Filter an wenn Events oder Filter sich ändern
  useEffect(() => {
    applyFilters();
  }, [allEvents, statusFilter, hostFilter, eventTypeFilter, filterDateRange]);

  // Lade Forecast-Events (ab heute, nur active)
  useEffect(() => {
    if (allEvents && allEvents.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + forecastDays);
      endDate.setHours(23, 59, 59, 999);

      console.log('[Forecast] Filtere Events...');
      console.log('[Forecast] Heute:', today.toISOString());
      console.log('[Forecast] End-Datum:', endDate.toISOString());
      console.log('[Forecast] Forecast-Tage:', forecastDays);
      console.log('[Forecast] Alle Events:', allEvents.length);

      // Debug: Zeige erste paar Events mit Datum
      const sampleEvents = allEvents.slice(0, 5);
      console.log('[Forecast] Sample Events:', sampleEvents.map(e => ({
        start_time: e.start_time,
        status: e.status,
        date: new Date(e.start_time).toISOString(),
        isFuture: new Date(e.start_time) >= today
      })));

      const forecast = allEvents.filter(event => {
        if (!event.start_time) {
          console.warn('[Forecast] Event ohne start_time:', event);
          return false;
        }
        
        const eventDate = new Date(event.start_time);
        
        // Prüfe ob Datum gültig ist
        if (isNaN(eventDate.getTime())) {
          console.warn('[Forecast] Ungültiges Datum:', event.start_time);
          return false;
        }

        const isInRange = eventDate >= today && eventDate <= endDate;
        const isActive = event.status === 'active';
        
        if (isInRange && !isActive) {
          console.log('[Forecast] Event in Range aber nicht active:', {
            date: eventDate.toISOString(),
            status: event.status
          });
        }

        return isInRange && isActive;
      });

      console.log('[Forecast] ✅ Gefundene Forecast-Events:', forecast.length, 'von', allEvents.length, 'total');
      if (forecast.length > 0) {
        console.log('[Forecast] Erste Forecast-Events:', forecast.slice(0, 3).map(e => ({
          date: new Date(e.start_time).toISOString(),
          host: e.host_name,
          type: e.event_type_name || e.event_name,
          status: e.status
        })));
      } else {
        console.warn('[Forecast] ⚠️ Keine Forecast-Events gefunden!');
        // Debug: Zeige warum Events nicht matchen
        const futureEvents = allEvents.filter(e => {
          if (!e.start_time) return false;
          const ed = new Date(e.start_time);
          return !isNaN(ed.getTime()) && ed >= today;
        });
        console.log('[Forecast] Zukünftige Events (alle Status):', futureEvents.length);
        const activeEvents = allEvents.filter(e => e.status === 'active');
        console.log('[Forecast] Aktive Events (alle Daten):', activeEvents.length);
      }

      setForecastEvents(forecast);
    } else {
      console.log('[Forecast] Keine Events geladen');
      setForecastEvents([]);
    }
  }, [allEvents, forecastDays]);

  // Wende Forecast-Filter an
  useEffect(() => {
    let filtered = [...forecastEvents];

    // Host-Filter
    if (forecastHostFilter.length > 0) {
      filtered = filtered.filter(e => forecastHostFilter.includes(e.host_name));
    }

    // Event-Type-Filter
    if (forecastEventTypeFilter.length > 0) {
      filtered = filtered.filter(e => {
        const eventType = e.event_type_name || e.event_name;
        return forecastEventTypeFilter.includes(eventType);
      });
    }

    setFilteredForecastEvents(filtered);
  }, [forecastEvents, forecastHostFilter, forecastEventTypeFilter]);

  const loadAllEvents = async () => {
    setLoading(true);
    try {
      // Lade ALLE Events ohne Filter (inkl. zukünftige Events)
      // Kein Datum-Filter, damit auch zukünftige Events geladen werden
      // Sortiere nach start_time ASC, damit wir auch zukünftige Events bekommen
      const eventsData = await fetchCalendlyEvents({ limit: 10000 });
      console.log('[CalendlyDashboard] Geladene Events:', eventsData?.length || 0);
      
      // Debug: Zeige Datum-Range der Events
      if (eventsData && eventsData.length > 0) {
        const dates = eventsData.map(e => new Date(e.start_time)).filter(d => !isNaN(d.getTime()));
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const futureEvents = dates.filter(d => {
            const dDate = new Date(d);
            dDate.setHours(0, 0, 0, 0);
            return dDate >= today;
          });
          
          const activeFutureEvents = eventsData.filter(e => {
            if (!e.start_time) return false;
            const ed = new Date(e.start_time);
            if (isNaN(ed.getTime())) return false;
            ed.setHours(0, 0, 0, 0);
            return ed >= today && e.status === 'active';
          });
          
          console.log('[CalendlyDashboard] Event-Datum-Range:', minDate.toISOString(), 'bis', maxDate.toISOString());
          console.log('[CalendlyDashboard] Heute:', today.toISOString());
          console.log('[CalendlyDashboard] Zukünftige Events (alle Status):', futureEvents.length);
          console.log('[CalendlyDashboard] Zukünftige aktive Events:', activeFutureEvents.length);
          
          // Zeige Beispiel zukünftiger Events
          if (activeFutureEvents.length > 0) {
            console.log('[CalendlyDashboard] Beispiel zukünftige Events:', activeFutureEvents.slice(0, 3).map(e => ({
              date: new Date(e.start_time).toISOString(),
              host: e.host_name,
              type: e.event_type_name || e.event_name,
              status: e.status
            })));
          }
        }
      }
      
      setAllEvents(eventsData || []);
      initializeFilters(eventsData || []);
    } catch (error) {
      console.error('[CalendlyDashboard] Fehler beim Laden:', error);
      setAllEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialisiere Filter mit allen verfügbaren Optionen
  const initializeFilters = (events) => {
    if (!events || events.length === 0) return;
    
    // Setze Default-Filter: alle auswählen (wie Python-Dashboard)
    const allStatuses = [...new Set(events.map(e => e.status).filter(Boolean))];
    const allHosts = [...new Set(events.map(e => e.host_name).filter(Boolean))].sort();
    const allEventTypes = [...new Set(events.map(e => e.event_type_name || e.event_name).filter(Boolean))].sort();
    
    // Default: alle ausgewählt
    setStatusFilter(allStatuses.length > 0 ? allStatuses : ['active']);
    setHostFilter(allHosts);
    setEventTypeFilter(allEventTypes);
    
    // Datum-Range: min/max aus Events
    if (events.length > 0) {
      const dates = events.map(e => new Date(e.start_time)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        setFilterDateRange({ start: minDate, end: maxDate });
      }
    }
  };

  // Filter anwenden (lokal, wie im Python-Dashboard)
  const applyFilters = () => {
    if (!allEvents || allEvents.length === 0) {
      setFilteredEvents([]);
      return;
    }

    let filtered = [...allEvents];

    // Status-Filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(e => statusFilter.includes(e.status));
    }

    // Host-Filter
    if (hostFilter.length > 0) {
      filtered = filtered.filter(e => hostFilter.includes(e.host_name));
    }

    // Event-Type-Filter
    if (eventTypeFilter.length > 0) {
      filtered = filtered.filter(e => {
        const eventType = e.event_type_name || e.event_name;
        return eventTypeFilter.includes(eventType);
      });
    }

    // Datum-Filter
    if (filterDateRange.start && filterDateRange.end) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.start_time);
        return eventDate >= filterDateRange.start && eventDate <= filterDateRange.end;
      });
    }

    setFilteredEvents(filtered);
  };

  const COLORS = ['#4a90e2', '#0ea66e', '#e3a008', '#dc2626', '#06b6d4'];

  // Berechne Statistiken aus gefilterten Events (wie Python-Dashboard)
  const stats = React.useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) {
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
      };
    }

    const total = filteredEvents.length;
    const active = filteredEvents.filter(e => e.status === 'active').length;
    const canceled = filteredEvents.filter(e => e.status === 'canceled').length;
    const uniqueClients = new Set(filteredEvents.map(e => e.invitee_email).filter(Boolean)).size;
    
    // Event Types
    const eventTypeCounts = {};
    filteredEvents.forEach(e => {
      const type = e.event_type_name || e.event_name || 'Unbekannt';
      eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
    });
    const eventTypes = Object.entries(eventTypeCounts)
      .map(([name, count]) => ({
        event_name: name,
        count,
        active: filteredEvents.filter(e => (e.event_type_name || e.event_name) === name && e.status === 'active').length,
        canceled: filteredEvents.filter(e => (e.event_type_name || e.event_name) === name && e.status === 'canceled').length
      }))
      .sort((a, b) => b.count - a.count);

    // Events pro Tag
    const dayCounts = {};
    filteredEvents.forEach(e => {
      const date = new Date(e.start_time).toISOString().split('T')[0];
      if (!dayCounts[date]) {
        dayCounts[date] = { active: 0, canceled: 0 };
      }
      if (e.status === 'active') dayCounts[date].active++;
      if (e.status === 'canceled') dayCounts[date].canceled++;
    });
    const eventsByDay = Object.entries(dayCounts)
      .map(([date, counts]) => ({
        date,
        active: counts.active,
        canceled: counts.canceled,
        count: counts.active + counts.canceled
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-90); // Letzte 90 Tage

    // Beste Buchungszeiten (Stunde)
    const hourCounts = {};
    filteredEvents.forEach(e => {
      const hour = new Date(e.start_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const bestTime = Object.entries(hourCounts)
      .map(([hour, totalEvents]) => ({
        hour: parseInt(hour),
        totalEvents
      }))
      .filter(h => h.totalEvents >= 2)
      .sort((a, b) => b.totalEvents - a.totalEvents);

    // Wochentag-Analyse
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayCounts = {};
    filteredEvents.forEach(e => {
      const weekday = weekdayNames[new Date(e.start_time).getDay()];
      weekdayCounts[weekday] = (weekdayCounts[weekday] || 0) + 1;
    });
    const weekdayStats = Object.entries(weekdayCounts)
      .map(([weekday, count]) => ({ weekday, count }))
      .sort((a, b) => {
        const order = weekdayNames;
        return order.indexOf(a.weekday) - order.indexOf(b.weekday);
      });

    // Durchschnittliche Dauer
    const durations = filteredEvents
      .map(e => e.duration_minutes)
      .filter(d => d && d > 0);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return {
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
    };
  }, [filteredEvents]);

  // Team-Analyse
  const teamAnalysis = React.useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return [];
    
    const hostStats = {};
    filteredEvents.forEach(event => {
      const hostName = event.host_name || 'Unbekannt';
      if (!hostStats[hostName]) {
        hostStats[hostName] = { total: 0, active: 0, canceled: 0 };
      }
      hostStats[hostName].total++;
      if (event.status === 'active') {
        hostStats[hostName].active++;
      } else if (event.status === 'canceled') {
        hostStats[hostName].canceled++;
      }
    });

    return Object.entries(hostStats).map(([name, stats]) => ({
      name,
      total: stats.total,
      active: stats.active,
      canceled: stats.canceled,
      cancelRate: stats.total > 0 ? Math.round((stats.canceled / stats.total) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.total - a.total);
  }, [filteredEvents]);

  // Forecast-Sync Funktion
  const handleForecastSync = async () => {
    setIsForecastSyncing(true);
    setForecastSyncMessage('');
    try {
      // Berechne wie viele Monate zurück wir brauchen (mindestens forecastDays)
      const monthsNeeded = Math.ceil(forecastDays / 30) + 1; // +1 für Sicherheit
      setForecastSyncMessage(`⏳ Lade Forecast-Daten für nächste ${forecastDays} Tage...`);
      
      // Lade Events neu (inkl. zukünftige)
      await loadAllEvents();
      
      setForecastSyncMessage(`✅ Forecast-Daten aktualisiert!`);
      setTimeout(() => setForecastSyncMessage(''), 3000);
    } catch (error) {
      console.error('[Forecast] Fehler beim Synchronisieren:', error);
      setForecastSyncMessage(`❌ Fehler: ${error.message || 'Unbekannter Fehler'}`);
      setTimeout(() => setForecastSyncMessage(''), 5000);
    } finally {
      setIsForecastSyncing(false);
    }
  };

  // Initialisiere Forecast-Filter
  useEffect(() => {
    if (forecastEvents && forecastEvents.length > 0) {
      const allHosts = [...new Set(forecastEvents.map(e => e.host_name).filter(Boolean))].sort();
      const allEventTypes = [...new Set(forecastEvents.map(e => e.event_type_name || e.event_name).filter(Boolean))].sort();
      
      // Default: alle ausgewählt
      if (forecastHostFilter.length === 0) {
        setForecastHostFilter(allHosts);
      }
      if (forecastEventTypeFilter.length === 0) {
        setForecastEventTypeFilter(allEventTypes);
      }
    }
  }, [forecastEvents]);

  // Forecast-Daten berechnen (verwendet gefilterte Events)
  const forecastData = React.useMemo(() => {
    if (!filteredForecastEvents || filteredForecastEvents.length === 0) {
      return {
        forecastByDay: [],
        forecastByHost: [],
        avgPerDay: 0,
        totalEvents: 0,
        uniqueHosts: 0
      };
    }

    // Gruppiere Events nach Tag
    const dayCounts = {};
    filteredForecastEvents.forEach(event => {
      const date = new Date(event.start_time).toISOString().split('T')[0];
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    });
    const forecastByDay = Object.entries(dayCounts)
      .map(([date, count]) => ({
        date,
        count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Gruppiere Events nach Berater
    const hostCounts = {};
    filteredForecastEvents.forEach(event => {
      const hostName = event.host_name || 'Unbekannt';
      hostCounts[hostName] = (hostCounts[hostName] || 0) + 1;
    });
    const forecastByHost = Object.entries(hostCounts)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);

    const totalEvents = filteredForecastEvents.length;
    const avgPerDay = forecastDays > 0 ? Math.round((totalEvents / forecastDays) * 10) / 10 : 0;
    const uniqueHosts = Object.keys(hostCounts).length;

    return {
      forecastByDay,
      forecastByHost,
      avgPerDay,
      totalEvents,
      uniqueHosts
    };
  }, [filteredForecastEvents, forecastDays]);

  // Calendly Sync
  const handleCalendlySync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const daysBack = monthsBack * 30;
      setSyncMessage(`⏳ Synchronisiere letzte ${monthsBack} Monate... (kann länger dauern)`);
      const result = await syncCalendly(daysBack);
      setSyncMessage(`✅ ${result.message || `Calendly-Daten erfolgreich synchronisiert! ${result.syncedCount || 0} Events`}`);
      setTimeout(() => setSyncMessage(''), 8000);
      // Lade Daten neu nach Sync
      await loadAllEvents();
    } catch (error) {
      console.error('[CalendlyDashboard] Fehler beim Synchronisieren:', error);
      setSyncMessage(`❌ Fehler beim Synchronisieren: ${error.message || 'Unbekannter Fehler'}`);
      setTimeout(() => setSyncMessage(''), 8000);
    } finally {
      setIsSyncing(false);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!filteredEvents || filteredEvents.length === 0) return;
    
    const headers = ['Datum', 'Uhrzeit', 'Termintyp', 'Berater', 'Kunde', 'E-Mail', 'Status', 'Dauer (Min)'];
    const rows = filteredEvents.map(event => {
      const startDate = new Date(event.start_time);
      return [
        startDate.toLocaleDateString('de-DE'),
        startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        event.event_type_name || event.event_name || '-',
        event.host_name || '-',
        event.invitee_name || '-',
        event.invitee_email || '-',
        event.status === 'active' ? 'Aktiv' : 'Abgesagt',
        event.duration_minutes || '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calendly_termine_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Verfügbare Filter-Optionen
  const availableStatuses = React.useMemo(() => {
    return [...new Set(allEvents.map(e => e.status).filter(Boolean))].sort();
  }, [allEvents]);

  const availableHosts = React.useMemo(() => {
    return [...new Set(allEvents.map(e => e.host_name).filter(Boolean))].sort();
  }, [allEvents]);

  const availableEventTypes = React.useMemo(() => {
    return [...new Set(allEvents.map(e => e.event_type_name || e.event_name).filter(Boolean))].sort();
  }, [allEvents]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>Lade Calendly-Daten...</p>
      </div>
    );
  }

  if (!allEvents || allEvents.length === 0) {
    return (
      <div className="dashboard">
        <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>🔄 Daten synchronisieren</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="months-back" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Monate zurück:
              </label>
              <select
                id="months-back"
                value={monthsBack}
                onChange={(e) => setMonthsBack(parseInt(e.target.value))}
                disabled={isSyncing}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '13px',
                  cursor: isSyncing ? 'not-allowed' : 'pointer'
                }}
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
              style={{
                padding: '10px 20px',
                backgroundColor: isSyncing ? 'rgba(74, 144, 226, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                border: '1px solid rgba(220, 38, 38, 0.5)',
                borderRadius: '6px',
                color: isSyncing ? 'rgba(255, 255, 255, 0.5)' : '#dc2626',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              {isSyncing ? '⏳' : '🔄'} {isSyncing ? 'Synchronisiere...' : 'Daten laden'}
            </button>
            {syncMessage && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: syncMessage.includes('✅') ? 'rgba(14, 166, 110, 0.1)' : syncMessage.includes('⏳') ? 'rgba(227, 160, 8, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                color: syncMessage.includes('✅') ? '#0ea66e' : syncMessage.includes('⏳') ? '#e3a008' : '#dc2626'
              }}>
                {syncMessage}
              </div>
            )}
          </div>
        </div>
        <div className="stat-card full-width">
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Keine Calendly-Daten verfügbar. Bitte synchronisieren.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Forecast Section */}
      <div className="stat-card full-width" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2>📅 Geplante Termine (Forecast)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select 
              value={forecastDays} 
              onChange={(e) => setForecastDays(parseInt(e.target.value))}
              disabled={isForecastSyncing}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#e5e7eb',
                fontSize: '13px',
                cursor: isForecastSyncing ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="7">Nächste 7 Tage</option>
              <option value="14">Nächste 14 Tage</option>
              <option value="30">Nächste 30 Tage</option>
              <option value="90">Nächste 90 Tage</option>
            </select>
            <button
              onClick={handleForecastSync}
              disabled={isForecastSyncing}
              style={{
                padding: '8px 16px',
                backgroundColor: isForecastSyncing ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                borderRadius: '6px',
                color: isForecastSyncing ? 'rgba(255, 255, 255, 0.5)' : '#06b6d4',
                cursor: isForecastSyncing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isForecastSyncing ? '⏳' : '🔄'} {isForecastSyncing ? 'Lädt...' : 'Synchronisieren'}
            </button>
            {forecastSyncMessage && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: forecastSyncMessage.includes('✅') ? 'rgba(14, 166, 110, 0.1)' : forecastSyncMessage.includes('⏳') ? 'rgba(227, 160, 8, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                color: forecastSyncMessage.includes('✅') ? '#0ea66e' : forecastSyncMessage.includes('⏳') ? '#e3a008' : '#dc2626'
              }}>
                {forecastSyncMessage}
              </div>
            )}
          </div>
        </div>

        {/* Forecast Filter */}
        {forecastEvents && forecastEvents.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '500', marginBottom: '12px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Filter
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {/* Berater Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                  Berater
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {/* Stelle sicher, dass Sina Hinricher immer verfügbar ist */}
                  {(() => {
                    const uniqueHosts = new Set(forecastEvents.map(e => e.host_name).filter(Boolean));
                    uniqueHosts.add('Sina Hinricher'); // Immer hinzufügen
                    return Array.from(uniqueHosts).sort();
                  })().map(host => (
                    <label key={host} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={forecastHostFilter.includes(host)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForecastHostFilter([...forecastHostFilter, host]);
                          } else {
                            setForecastHostFilter(forecastHostFilter.filter(h => h !== host));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{host}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gesprächsart Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                  Gesprächsart
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {[...new Set(forecastEvents.map(e => e.event_type_name || e.event_name).filter(Boolean))].sort().map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={forecastEventTypeFilter.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForecastEventTypeFilter([...forecastEventTypeFilter, type]);
                          } else {
                            setForecastEventTypeFilter(forecastEventTypeFilter.filter(t => t !== type));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State für Forecast */}
        {isForecastSyncing && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Lade Forecast-Daten...</p>
          </div>
        )}

        {/* Forecast Metrics Grid */}
        <div className="stats-grid" style={{ marginTop: '16px' }}>
          <div className="stat-card metric-card">
            <div className="metric-label">GEPLANTE TERMINE</div>
            <div className="metric-value" style={{ color: '#06b6d4' }}>
              {forecastData.totalEvents}
            </div>
          </div>
          <div className="stat-card metric-card">
            <div className="metric-label">Ø PRO TAG</div>
            <div className="metric-value" style={{ color: '#06b6d4' }}>
              {forecastData.avgPerDay}
            </div>
          </div>
          <div className="stat-card metric-card">
            <div className="metric-label">AKTIVE BERATER</div>
            <div className="metric-value" style={{ color: '#06b6d4' }}>
              {forecastData.uniqueHosts}
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        {forecastData.forecastByDay && forecastData.forecastByDay.length > 0 && (
          <div style={{ marginTop: '20px' }}>
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
        )}

        {/* Forecast by Host */}
        {forecastData.forecastByHost && forecastData.forecastByHost.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Geplante Termine pro Berater
            </h3>
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
        )}
      </div>

      {/* Sync Section */}
      <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '16px' }}>🔄 Daten synchronisieren</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="months-back" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Monate zurück:
            </label>
            <select
              id="months-back"
              value={monthsBack}
              onChange={(e) => setMonthsBack(parseInt(e.target.value))}
              disabled={isSyncing}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#e5e7eb',
                fontSize: '13px',
                cursor: isSyncing ? 'not-allowed' : 'pointer'
              }}
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
            style={{
              padding: '10px 20px',
              backgroundColor: isSyncing ? 'rgba(74, 144, 226, 0.3)' : 'rgba(220, 38, 38, 0.2)',
              border: '1px solid rgba(220, 38, 38, 0.5)',
              borderRadius: '6px',
              color: isSyncing ? 'rgba(255, 255, 255, 0.5)' : '#dc2626',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            {isSyncing ? '⏳' : '🔄'} {isSyncing ? 'Synchronisiere...' : 'Daten laden'}
          </button>
          {syncMessage && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: syncMessage.includes('✅') ? 'rgba(14, 166, 110, 0.1)' : syncMessage.includes('⏳') ? 'rgba(227, 160, 8, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              color: syncMessage.includes('✅') ? '#0ea66e' : syncMessage.includes('⏳') ? '#e3a008' : '#dc2626'
            }}>
              {syncMessage}
            </div>
          )}
        </div>
        {isSyncing && (
          <p style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
            Bitte warten... Dies kann bei vielen Daten einige Minuten dauern.
          </p>
        )}
      </div>

      {/* Filter Section - wie im Python-Dashboard */}
      <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '16px' }}>🔍 Filter</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              Status
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
              {availableStatuses.map(status => (
                <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setStatusFilter([...statusFilter, status]);
                      } else {
                        setStatusFilter(statusFilter.filter(s => s !== status));
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{status === 'active' ? 'Aktiv' : 'Abgesagt'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Host/Berater Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              Gastgeber
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
              {availableHosts.map(host => (
                <label key={host} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hostFilter.includes(host)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setHostFilter([...hostFilter, host]);
                      } else {
                        setHostFilter(hostFilter.filter(h => h !== host));
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{host}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Event Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              Termintyp
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
              {availableEventTypes.map(type => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={eventTypeFilter.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEventTypeFilter([...eventTypeFilter, type]);
                      } else {
                        setEventTypeFilter(eventTypeFilter.filter(t => t !== type));
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Datum Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              Zeitraum
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="date"
                value={filterDateRange.start ? filterDateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value ? new Date(e.target.value) : null })}
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '13px'
                }}
              />
              <input
                type="date"
                value={filterDateRange.end ? filterDateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value ? new Date(e.target.value) : null })}
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <div className="stat-card metric-card">
          <div className="metric-label">GESAMT TERMINE</div>
          <div className="metric-value">{stats.totalEvents || 0}</div>
        </div>
        <div className="stat-card metric-card">
          <div className="metric-label">AKTIVE</div>
          <div className="metric-value" style={{ color: '#0ea66e' }}>{stats.activeEvents || 0}</div>
        </div>
        <div className="stat-card metric-card">
          <div className="metric-label">CANCELED</div>
          <div className="metric-value" style={{ color: '#dc2626' }}>{stats.canceledEvents || 0}</div>
        </div>
        <div className="stat-card metric-card">
          <div className="metric-label">EINZIGARTIGE KUNDEN</div>
          <div className="metric-value" style={{ color: '#4a90e2' }}>{stats.uniqueClients || 0}</div>
        </div>
        <div className="stat-card metric-card">
          <div className="metric-label">Ø DAUER (MIN)</div>
          <div className="metric-value" style={{ color: '#e3a008' }}>{stats.avgDuration || 0}</div>
        </div>
      </div>

      {/* Analysen Section - wie Python-Dashboard */}
      <div style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>📈 Analysen</h2>
        
        {/* Tabs würden hier kommen - für jetzt zeige ich die Charts direkt */}

      {/* Events Over Time */}
      {stats.eventsByDay && stats.eventsByDay.length > 0 && (
          <div className="stat-card chart-card full-width" style={{ marginBottom: '20px' }}>
            <h2>Termine pro Tag</h2>
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.eventsByDay}>
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
              />
              <Legend />
                <Line type="monotone" dataKey="count" stroke="#4a90e2" name="Anzahl Termine" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts Grid */}
      <div className="stats-grid">
        {/* Event Types */}
        {stats.eventTypes && stats.eventTypes.length > 0 && (
          <div className="stat-card chart-card">
              <h2>Verteilung Termintypen</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.eventTypes}
                  dataKey="count"
                  nameKey="event_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                    label={({ name, percent }) => `${name.substring(0, 20)}: ${(percent * 100).toFixed(1)}%`}
                >
                  {stats.eventTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

          {/* Termintypen nach Status */}
          {stats.eventTypes && stats.eventTypes.length > 0 && (
          <div className="stat-card chart-card">
              <h2>Termintypen nach Status</h2>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.eventTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis type="number" stroke="rgba(255, 255, 255, 0.4)" style={{ fontSize: '11px' }} />
                <YAxis 
                    dataKey="event_name" 
                    type="category" 
                  stroke="rgba(255, 255, 255, 0.4)"
                  style={{ fontSize: '11px' }}
                    width={150}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1f2e', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#e5e7eb'
                  }}
                />
                  <Legend />
                  <Bar dataKey="active" stackId="a" fill="#0ea66e" name="Aktiv" />
                  <Bar dataKey="canceled" stackId="a" fill="#dc2626" name="Abgesagt" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        </div>

        {/* Team-Analyse */}
        {teamAnalysis && teamAnalysis.length > 0 && (
          <div className="stats-grid" style={{ marginTop: '20px' }}>
            <div className="stat-card chart-card">
              <h2>Termine pro Berater</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={teamAnalysis} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis type="number" stroke="rgba(255, 255, 255, 0.4)" style={{ fontSize: '11px' }} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255, 255, 255, 0.4)" style={{ fontSize: '11px' }} width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f2e', 
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#e5e7eb'
                    }}
                  />
                  <Bar dataKey="total" fill="#4a90e2" name="Gesamt" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          <div className="stat-card chart-card">
              <h2>Absage-Rate pro Berater</h2>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={teamAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                    dataKey="name" 
                  stroke="rgba(255, 255, 255, 0.4)"
                  style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                />
                  <Bar dataKey="cancelRate" fill="#dc2626" name="Absage-Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      {filteredEvents && filteredEvents.length > 0 && (
        <div className="stat-card full-width" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>📋 Alle Termine im Detail</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(74, 144, 226, 0.1)',
                  border: '1px solid rgba(74, 144, 226, 0.3)',
                  borderRadius: '6px',
                  color: '#4a90e2',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {showAllEvents ? 'Weniger anzeigen' : 'Alle anzeigen'}
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
                📥 Als CSV herunterladen
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Datum</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Uhrzeit</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Termintyp</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Berater</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Kunde</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Dauer (Min)</th>
                </tr>
              </thead>
              <tbody>
                {(showAllEvents ? filteredEvents : filteredEvents.slice(0, 20)).map((event) => {
                  const startDate = new Date(event.start_time);
                  return (
                  <tr key={event.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {startDate.toLocaleDateString('de-DE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{event.event_type_name || event.event_name || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{event.host_name || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{event.invitee_name || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: event.status === 'active' ? 'rgba(14, 166, 110, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: event.status === 'active' ? '#0ea66e' : '#dc2626'
                      }}>
                        {event.status === 'active' ? 'Aktiv' : 'Abgesagt'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{event.duration_minutes || '-'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendlyDashboard;
