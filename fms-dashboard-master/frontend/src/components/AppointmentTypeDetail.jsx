import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchCalendlyEvents, 
  fetchCustomActivitiesByType,
  syncCustomActivities
} from '../services/api';

// Activity Type Konfiguration (muss mit Backend übereinstimmen)
const ACTIVITY_TYPES = {
  vorqualifizierung: {
    id: 'actitype_1H3wPemMNkfkmT0nJuEBUT',
    resultField: 'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg',
    possibleResults: [
      'Qualifiziert → Erstgespräch buchen',
      'Unqualifiziert',
      'Follow-up nötig',
      'Nicht erreicht',
      'Kein Interesse'
    ],
    displayName: 'Vorqualifizierung'
  },
  erstgespraech: {
    id: 'actitype_6VB2MiuFziQxyuzfMzHy7q',
    resultField: 'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ',
    possibleResults: [
      'Stattgefunden',
      'Ausgefallen (Kunde)',
      'Ausgefallen (Berater)',
      'Verschoben',
      'No-Show'
    ],
    displayName: 'Erstgespräch'
  },
  konzeptgespraech: {
    id: 'actitype_6ftbHtxSEz9wIwdLnovYP0',
    resultField: 'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT',
    possibleResults: [
      'Stattgefunden',
      'Ausgefallen (Kunde)',
      'Ausgefallen (Berater)',
      'Verschoben',
      'No-Show'
    ],
    displayName: 'Konzeptgespräch'
  },
  umsetzungsgespraech: {
    id: 'actitype_6nwTHKNbqf3EbQIjORgPg5',
    resultField: 'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf',
    possibleResults: [
      'Abgeschlossen (Won) ✅',
      'Abgelehnt (Lost) ❌',
      'Bedenkzeit',
      'Verschoben',
      'No-Show',
      'Neuer Closing Termin notwendig'
    ],
    displayName: 'Umsetzungsgespräch'
  },
  servicegespraech: {
    id: 'actitype_7dOp29fi26OKZQeXd9bCYP',
    resultField: 'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4',
    possibleResults: [
      'Stattgefunden',
      'Cross-Sell identifiziert',
      'Ausgefallen',
      'Verschoben'
    ],
    displayName: 'Servicegespräch'
  }
};

// ResultBar Komponente
const ResultBar = ({ label, value, color, total }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorMap = {
    green: '#0ea66e',
    red: '#dc2626',
    orange: '#e3a008',
    yellow: '#fbbf24',
    blue: '#4a90e2'
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '4px',
        fontSize: '13px'
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
  );
};

// ResultsBreakdown Komponente
const ResultsBreakdown = ({ results, type }) => {
  const typeConfig = ACTIVITY_TYPES[type];
  if (!typeConfig) return null;

  const total = Object.values(results).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

  // Mappe Results basierend auf Termintyp
  const resultBars = [];
  
  if (type === 'erstgespraech' || type === 'konzeptgespraech') {
    resultBars.push(
      <ResultBar key="stattgefunden" label="Stattgefunden" value={results.stattgefunden || 0} color="green" total={total} />,
      <ResultBar key="noShow" label="No-Show" value={results.noShow || 0} color="red" total={total} />,
      <ResultBar key="ausgefallenKunde" label="Ausgefallen (Kunde)" value={results.ausgefallenKunde || 0} color="orange" total={total} />,
      <ResultBar key="ausgefallenBerater" label="Ausgefallen (Berater)" value={results.ausgefallenBerater || 0} color="yellow" total={total} />,
      <ResultBar key="verschoben" label="Verschoben" value={results.verschoben || 0} color="blue" total={total} />
    );
  } else if (type === 'umsetzungsgespraech') {
    resultBars.push(
      <ResultBar key="won" label="Abgeschlossen (Won)" value={results.won || 0} color="green" total={total} />,
      <ResultBar key="lost" label="Abgelehnt (Lost)" value={results.lost || 0} color="red" total={total} />,
      <ResultBar key="bedenkzeit" label="Bedenkzeit" value={results.bedenkzeit || 0} color="yellow" total={total} />,
      <ResultBar key="verschoben" label="Verschoben" value={results.verschoben || 0} color="blue" total={total} />,
      <ResultBar key="noShow" label="No-Show" value={results.noShow || 0} color="red" total={total} />
    );
  } else if (type === 'servicegespraech') {
    resultBars.push(
      <ResultBar key="stattgefunden" label="Stattgefunden" value={results.stattgefunden || 0} color="green" total={total} />,
      <ResultBar key="crossSell" label="Cross-Sell identifiziert" value={results.crossSell || 0} color="blue" total={total} />,
      <ResultBar key="ausgefallen" label="Ausgefallen" value={results.ausgefallen || 0} color="orange" total={total} />,
      <ResultBar key="verschoben" label="Verschoben" value={results.verschoben || 0} color="blue" total={total} />
    );
  } else if (type === 'vorqualifizierung') {
    resultBars.push(
      <ResultBar key="qualifiziert" label="Qualifiziert → Erstgespräch buchen" value={results.qualifiziert || 0} color="green" total={total} />,
      <ResultBar key="unqualifiziert" label="Unqualifiziert" value={results.unqualifiziert || 0} color="red" total={total} />,
      <ResultBar key="followup" label="Follow-up nötig" value={results.followup || 0} color="yellow" total={total} />,
      <ResultBar key="nichtErreicht" label="Nicht erreicht" value={results.nichtErreicht || 0} color="orange" total={total} />,
      <ResultBar key="keinInteresse" label="Kein Interesse" value={results.keinInteresse || 0} color="red" total={total} />
    );
  }

  return (
    <div className="stat-card" style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
        Ergebnisse Breakdown
      </h3>
      {resultBars}
    </div>
  );
};

// Hauptkomponente
const AppointmentTypeDetail = ({ type, startDate, endDate, onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [calendlyEvents, setCalendlyEvents] = useState([]);
  const [customActivities, setCustomActivities] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'debug'
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null); // { current, total, typeName, synced, skipped }
  const [selectedAdvisors, setSelectedAdvisors] = useState([]); // Berater-Filter

  const typeConfig = ACTIVITY_TYPES[type];

  useEffect(() => {
    if (!typeConfig) return;
    // Lade Daten immer neu, auch wenn sich nichts geändert hat (für Debugging)
    console.log('[AppointmentTypeDetail] useEffect triggered:', { type, startDate, endDate });
    loadData();
  }, [type, startDate, endDate]);

      const loadData = async () => {
    setLoading(true);
    try {
      console.log('[AppointmentTypeDetail] Lade Daten für:', type, startDate, endDate);
      
      // Lade Calendly Events für diesen Typ
      const events = await fetchCalendlyEvents({ 
        limit: 10000,
        startDate,
        endDate
      });
      console.log('[AppointmentTypeDetail] Calendly Events geladen:', events.length);

      // Filtere nach Event Type Name (muss mit Termintyp übereinstimmen)
      const filteredEvents = events.filter(event => {
        const eventTypeName = (event.event_type_name || event.event_name || '').toLowerCase();
        const typeName = typeConfig.displayName.toLowerCase();
        
        // Erweiterte Matching-Logik für verschiedene Namensvarianten
        const typeVariants = [
          typeName, // "konzeptgespräch"
          typeName.replace('gespräch', '').replace('gespraech', ''), // "konzept"
          type.replace('gespraech', '').replace('gespräch', ''), // "konzept" aus Key
          type.replace('gespraech', ' gespräch'), // "konzept gespräch"
        ];
        
        return typeVariants.some(variant => 
          eventTypeName.includes(variant.toLowerCase()) || 
          variant.toLowerCase().includes(eventTypeName)
        );
      });
      console.log('[AppointmentTypeDetail] Gefilterte Events:', filteredEvents.length);

      // Lade Custom Activities für diesen Typ
      console.log('[AppointmentTypeDetail] Lade Custom Activities...');
      const activities = await fetchCustomActivitiesByType(type, {
        startDate,
        endDate
      });
      console.log('[AppointmentTypeDetail] Custom Activities geladen:', activities.total, activities.activities?.length);
      console.log('[AppointmentTypeDetail] Activities Sample:', activities.activities?.slice(0, 5));
      
      // Debug: Zeige alle Activities für Felix/Cornelia
      const felixActivities = activities.activities?.filter(a => 
        a.lead?.email?.toLowerCase().includes('felix') || 
        a.lead?.email?.toLowerCase().includes('krotz') ||
        a.lead?.email?.toLowerCase().includes('cornelia') ||
        a.lead?.email?.toLowerCase().includes('hahn')
      ) || [];
      console.log('[AppointmentTypeDetail] Felix/Cornelia Activities:', felixActivities);

      setCalendlyEvents(filteredEvents);
      setCustomActivities(activities.activities || []);

      // Merge Daten
      const merged = mergeEventsWithActivities(filteredEvents, activities.activities || []);
      console.log('[AppointmentTypeDetail] Merged Data:', merged.length);
      setMergedData(merged);
    } catch (error) {
      console.error('[AppointmentTypeDetail] Fehler beim Laden:', error);
      console.error('[AppointmentTypeDetail] Error Details:', error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };

  // Merge Calendly Events mit Custom Activities
  const mergeEventsWithActivities = (events, activities) => {
    console.log('[AppointmentTypeDetail] Merging:', {
      eventsCount: events.length,
      activitiesCount: activities.length,
      sampleEvent: events[0] ? {
        lead_id: events[0].lead_id,
        invitee_email: events[0].invitee_email,
        start_time: events[0].start_time
      } : null,
      sampleActivity: activities[0] ? {
        lead_id: activities[0].lead_id,
        lead_close_id: activities[0].lead?.id || activities[0].lead_id,
        date_created: activities[0].date_created || activities[0].created || activities[0].activity_at,
        result: activities[0].result
      } : null
    });

    return events.map(event => {
      const eventDate = new Date(event.start_time);
      const eventLeadId = event.lead_id; // DB Lead ID
      const eventEmail = event.invitee_email?.toLowerCase() || event.lead_email?.toLowerCase();

      // Versuche Activity zu matchen
      // 1. Nach E-Mail (wichtigster Match - am zuverlässigsten!)
      // 2. Nach Close Lead ID (wenn event.lead_close_id vorhanden)
      // 3. Nach Datum (innerhalb von 3 Tagen für mehr Flexibilität)
      const matchedActivity = activities.find(activity => {
        const activityDate = new Date(activity.date_created || activity.created || activity.activity_at);
        const daysDiff = Math.abs((eventDate - activityDate) / (1000 * 60 * 60 * 24));
        
        // Activity Lead ID kann Close Lead ID oder DB Lead ID sein
        const activityLeadId = activity.lead_id || activity.lead?.id;
        const activityDbLeadId = activity.lead_db_id; // Falls vorhanden
        
        // E-Mail aus verschiedenen Quellen
        const activityEmail = activity.lead?.email?.toLowerCase() || 
                             activity.lead?.emails?.[0]?.email?.toLowerCase() ||
                             activity.invitee_email?.toLowerCase() ||
                             activity.email?.toLowerCase() ||
                             activity.lead_email?.toLowerCase();
        
        // Match-Kriterien:
        // 1. Gleiche E-Mail (wichtigster Match - am zuverlässigsten!)
        const emailMatch = eventEmail && activityEmail && 
                         eventEmail.trim() === activityEmail.trim();
        
        // 2. Gleiche Close Lead ID
        const leadIdMatch = event.lead_close_id && activityLeadId && 
                           (activityLeadId === event.lead_close_id);
        
        // 3. Gleiche DB Lead ID (Fallback)
        const dbLeadIdMatch = event.lead_id && activityDbLeadId && 
                             (activityDbLeadId === event.lead_id);
        
        // 4. Datum innerhalb von 3 Tagen (flexibler)
        const dateMatch = daysDiff <= 3;
        
        // Debug für ALLE Events (nicht nur Felix/Conny) - für Troubleshooting
        // Nur bei ersten paar Activities debuggen, um Log-Spam zu vermeiden
        const shouldDebug = activities.indexOf(activity) < 5; // Erste 5 Activities
        if (shouldDebug) {
          console.log('[Matching Debug]', {
            eventName: event.invitee_name,
            eventEmail,
            eventLeadCloseId: event.lead_close_id,
            eventLeadDbId: event.lead_id,
            eventDate: eventDate.toISOString(),
            activityEmail,
            activityLeadId,
            activityDbLeadId,
            activityDate: activityDate.toISOString(),
            emailMatch,
            leadIdMatch,
            dbLeadIdMatch,
            daysDiff: daysDiff.toFixed(2),
            dateMatch,
            activityResult: activity.result,
            wouldMatch: (emailMatch || leadIdMatch || dbLeadIdMatch) && dateMatch
          });
        }
        
        // Match wenn: (E-Mail ODER Close Lead ID ODER DB Lead ID) UND Datum
        // E-Mail hat Priorität, da zuverlässiger
        // Datum-Toleranz: 3 Tage (auch für gecancelte Termine, die später verschoben wurden)
        return (emailMatch || leadIdMatch || dbLeadIdMatch) && dateMatch;
      });

      if (matchedActivity) {
        console.log('[AppointmentTypeDetail] Matched:', {
          event: event.invitee_name,
          eventDate: eventDate.toISOString(),
          activityResult: matchedActivity.result,
          matchMethod: eventLeadId === matchedActivity.lead_id ? 'lead_id' : 'email'
        });
      } else if (eventDate < new Date()) {
        // Debug: Zeige verfügbare Activities für dieses Event
        const relevantActivities = activities.filter(a => {
          const aEmail = a.lead?.email?.toLowerCase();
          const aLeadId = a.lead_id || a.lead?.id;
          return (eventEmail && aEmail && aEmail.includes(eventEmail.split('@')[0])) ||
                 (event.lead_close_id && aLeadId === event.lead_close_id);
        });
        
        console.log('[AppointmentTypeDetail] No match found:', {
          event: event.invitee_name,
          eventDate: eventDate.toISOString(),
          eventLeadId,
          eventLeadCloseId: event.lead_close_id,
          eventEmail,
          availableActivities: activities.length,
          relevantActivities: relevantActivities.length,
          relevantActivitiesDetails: relevantActivities.slice(0, 3).map(a => ({
            email: a.lead?.email,
            leadId: a.lead_id || a.lead?.id,
            date: a.date_created || a.activity_date,
            result: a.result
          }))
        });
      }

      const matchStatus = matchedActivity 
        ? 'matched' 
        : eventDate < new Date() 
        ? 'missing' 
        : 'pending';

      return {
        ...event,
        activity: matchedActivity,
        matchStatus,
        activityResult: matchedActivity 
          ? (matchedActivity.result || matchedActivity[`custom.${typeConfig.resultField}`] || 'Nicht ausgefüllt')
          : null
      };
    });
  };

  // Verfügbare Berater aus mergedData extrahieren (MUSS vor results sein!)
  const availableAdvisors = useMemo(() => {
    const advisors = new Set();
    mergedData.forEach(item => {
      const advisor = item.host_name || item.user_name;
      if (advisor) advisors.add(advisor);
    });
    return Array.from(advisors).sort();
  }, [mergedData]);

  // Gefilterte Daten basierend auf Berater-Auswahl (MUSS vor results sein!)
  const filteredMergedData = useMemo(() => {
    if (selectedAdvisors.length === 0) return mergedData;
    return mergedData.filter(item => {
      const advisor = item.host_name || item.user_name;
      return advisor && selectedAdvisors.includes(advisor);
    });
  }, [mergedData, selectedAdvisors]);

  // Berechne Stats
  const stats = useMemo(() => {
    const planned = calendlyEvents.length;
    const documented = customActivities.length;
    const completion = planned > 0 ? Math.round((documented / planned) * 100 * 10) / 10 : 0;

    return { planned, documented, completion };
  }, [calendlyEvents, customActivities]);

  // Berechne Results Breakdown - basierend auf gefilterten Daten
  const results = useMemo(() => {
    if (!typeConfig) return {};
    
    const resultCounts = {};

    // Verwende gefilterte mergedData, um nur Activities der ausgewählten Berater zu zählen
    const filteredActivities = filteredMergedData
      .filter(item => item.activity)
      .map(item => item.activity);

    filteredActivities.forEach(activity => {
      const result = activity.result || activity[`custom.${typeConfig.resultField}`] || 'Nicht ausgefüllt';
      
      if (type === 'erstgespraech' || type === 'konzeptgespraech') {
        if (result === 'Stattgefunden') resultCounts.stattgefunden = (resultCounts.stattgefunden || 0) + 1;
        else if (result === 'No-Show') resultCounts.noShow = (resultCounts.noShow || 0) + 1;
        else if (result === 'Ausgefallen (Kunde)') resultCounts.ausgefallenKunde = (resultCounts.ausgefallenKunde || 0) + 1;
        else if (result === 'Ausgefallen (Berater)') resultCounts.ausgefallenBerater = (resultCounts.ausgefallenBerater || 0) + 1;
        else if (result === 'Verschoben') resultCounts.verschoben = (resultCounts.verschoben || 0) + 1;
      } else if (type === 'umsetzungsgespraech') {
        if (result.includes('Won') || result.includes('Abgeschlossen')) resultCounts.won = (resultCounts.won || 0) + 1;
        else if (result.includes('Lost') || result.includes('Abgelehnt')) resultCounts.lost = (resultCounts.lost || 0) + 1;
        else if (result === 'Bedenkzeit') resultCounts.bedenkzeit = (resultCounts.bedenkzeit || 0) + 1;
        else if (result === 'Verschoben') resultCounts.verschoben = (resultCounts.verschoben || 0) + 1;
        else if (result === 'No-Show') resultCounts.noShow = (resultCounts.noShow || 0) + 1;
      } else if (type === 'servicegespraech') {
        if (result === 'Stattgefunden') resultCounts.stattgefunden = (resultCounts.stattgefunden || 0) + 1;
        else if (result === 'Cross-Sell identifiziert') resultCounts.crossSell = (resultCounts.crossSell || 0) + 1;
        else if (result === 'Ausgefallen') resultCounts.ausgefallen = (resultCounts.ausgefallen || 0) + 1;
        else if (result === 'Verschoben') resultCounts.verschoben = (resultCounts.verschoben || 0) + 1;
      } else if (type === 'vorqualifizierung') {
        if (result.includes('Qualifiziert')) resultCounts.qualifiziert = (resultCounts.qualifiziert || 0) + 1;
        else if (result === 'Unqualifiziert') resultCounts.unqualifiziert = (resultCounts.unqualifiziert || 0) + 1;
        else if (result === 'Follow-up nötig') resultCounts.followup = (resultCounts.followup || 0) + 1;
        else if (result === 'Nicht erreicht') resultCounts.nichtErreicht = (resultCounts.nichtErreicht || 0) + 1;
        else if (result === 'Kein Interesse') resultCounts.keinInteresse = (resultCounts.keinInteresse || 0) + 1;
      }
    });

    return resultCounts;
  }, [filteredMergedData, type, typeConfig]);

  // Aktualisiere Stats basierend auf gefilterten Daten (MUSS vor frühen Returns sein!)
  const filteredStats = useMemo(() => {
    const planned = filteredMergedData.length;
    const documented = filteredMergedData.filter(item => item.activity).length;
    const completion = planned > 0 ? Math.round((documented / planned) * 100 * 10) / 10 : 0;
    return { planned, documented, completion };
  }, [filteredMergedData]);

  // Early return für ungültigen Typ NACH allen Hooks
  if (!typeConfig) {
    return <div>Ungültiger Termintyp: {type}</div>;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>
          Lade {typeConfig.displayName} Details...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Zurück-Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            console.log('[AppointmentTypeDetail] Zurück-Button geklickt, onBack:', onBack);
            if (onBack) {
              console.log('[AppointmentTypeDetail] Rufe onBack() auf...');
              onBack();
            } else {
              console.log('[AppointmentTypeDetail] onBack nicht vorhanden, navigiere zu /analyse');
              // Fallback: Navigation zur Analyse-Seite mit react-router
              navigate('/analyse');
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            border: '1px solid rgba(74, 144, 226, 0.3)',
            borderRadius: '6px',
            color: '#4a90e2',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← Zurück zur Analyse
        </button>
      </div>

      <div className="stat-card full-width" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2>📋 {typeConfig.displayName} - Detailansicht</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                setSyncing(true);
                setSyncProgress(null);
                setSyncMessage('Synchronisiere Custom Activities...');
                try {
                  await syncCustomActivities(90, (progress) => {
                    if (progress.type === 'progress') {
                      setSyncProgress(progress);
                      setSyncMessage(`${progress.typeName}: ${progress.current} von ${progress.total} (${progress.synced} neu, ${progress.skipped} übersprungen)`);
                    } else if (progress.type === 'type_start') {
                      setSyncMessage(`📋 Starte ${progress.typeName}...`);
                    } else if (progress.type === 'type_complete') {
                      setSyncMessage(`✅ ${progress.typeName}: ${progress.synced} synchronisiert`);
                    } else if (progress.type === 'matching_start') {
                      setSyncMessage('🔗 Starte Matching mit Calendly Events...');
                    } else if (progress.type === 'complete') {
                      setSyncMessage(`✅ Synchronisation erfolgreich! ${progress.synced} Activities, ${progress.matched} gematched`);
                      setSyncProgress(null);
                    } else if (progress.type === 'error') {
                      setSyncMessage(`❌ Fehler: ${progress.error}`);
                    }
                  });
                  // Lade Daten neu
                  await loadData();
                  setTimeout(() => {
                    setSyncMessage(null);
                    setSyncProgress(null);
                  }, 3000);
                } catch (error) {
                  setSyncMessage('❌ Fehler bei Synchronisation: ' + error.message);
                  setSyncProgress(null);
                  setTimeout(() => setSyncMessage(null), 5000);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              style={{
                padding: '8px 16px',
                backgroundColor: syncing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(14, 166, 110, 0.2)',
                border: `1px solid ${syncing ? 'rgba(255, 255, 255, 0.2)' : 'rgba(14, 166, 110, 0.5)'}`,
                borderRadius: '6px',
                color: syncing ? 'rgba(255, 255, 255, 0.4)' : '#0ea66e',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {syncing && syncProgress ? (
                <>⏳ {syncProgress.current} von {syncProgress.total}</>
              ) : syncing ? (
                <>⏳ Synchronisiere...</>
              ) : (
                <>🔄 Sync Activities</>
              )}
            </button>
            {syncProgress && (
              <div style={{
                marginTop: '4px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                padding: '4px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }}>
                {syncProgress.typeName}: {syncProgress.synced} neu, {syncProgress.skipped} übersprungen
              </div>
            )}
            {syncMessage && (
              <div style={{
                marginTop: '4px',
                fontSize: '12px',
                color: syncMessage.includes('✅') ? '#0ea66e' : syncMessage.includes('❌') ? '#dc2626' : 'rgba(255, 255, 255, 0.6)',
                padding: '4px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }}>
                {syncMessage}
              </div>
            )}
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'overview' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeTab === 'overview' ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                color: activeTab === 'overview' ? '#4a90e2' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('debug')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'debug' ? 'rgba(227, 160, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeTab === 'debug' ? 'rgba(227, 160, 8, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                color: activeTab === 'debug' ? '#e3a008' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              🔍 Debug
            </button>
          </div>
        </div>
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>🔍 Debug-Informationen</h3>
            
            {/* Geladene Daten */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Geladene Daten:
              </h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <div>Calendly Events: {calendlyEvents.length}</div>
                <div>Custom Activities: {customActivities.length}</div>
                <div>Merged Data: {mergedData.length}</div>
              </div>
            </div>

            {/* Calendly Events Details */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Calendly Events (alle {calendlyEvents.length}):
              </h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(calendlyEvents.map(e => ({
                    invitee_name: e.invitee_name,
                    invitee_email: e.invitee_email,
                    start_time: e.start_time,
                    lead_id: e.lead_id,
                    lead_close_id: e.lead_close_id,
                    lead_email: e.lead_email,
                    status: e.status
                  })), null, 2)}
                </pre>
              </div>
            </div>

            {/* Custom Activities Details */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Custom Activities (alle {customActivities.length}):
              </h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(customActivities.map(a => ({
                    id: a.id,
                    lead_id: a.lead_id,
                    lead: a.lead,
                    result: a.result,
                    date_created: a.date_created || a.created || a.activity_at,
                    user_id: a.user_id
                  })), null, 2)}
                </pre>
              </div>
            </div>

            {/* Matching-Details für spezifische Personen */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Matching-Details (Felix & Cornelia):
              </h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {mergedData
                  .filter(item => 
                    item.invitee_name?.toLowerCase().includes('felix') || 
                    item.invitee_name?.toLowerCase().includes('cornelia') ||
                    item.invitee_name?.toLowerCase().includes('conny')
                  )
                  .map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '16px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.invitee_name}</div>
                      <div>Event: {new Date(item.start_time).toLocaleString('de-DE')}</div>
                      <div>Event Lead ID (DB): {item.lead_id || 'null'}</div>
                      <div>Event Lead Close ID: {item.lead_close_id || 'null'}</div>
                      <div>Event Email: {item.invitee_email || 'null'}</div>
                      <div>Match Status: {item.matchStatus}</div>
                      <div>Activity Result: {item.activityResult || 'null'}</div>
                      {item.activity && (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(14, 166, 110, 0.1)', borderRadius: '4px' }}>
                          <div>Matched Activity:</div>
                          <div>Activity Lead ID: {item.activity.lead_id || 'null'}</div>
                          <div>Activity Lead Email: {item.activity.lead?.email || 'null'}</div>
                          <div>Activity Result: {item.activity.result || 'null'}</div>
                          <div>Activity Date: {item.activity.date_created || item.activity.created || 'null'}</div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Berater-Filter */}
            {availableAdvisors.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', fontWeight: '500' }}>
                  Berater filtern:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={selectedAdvisors.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAdvisors([]);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Alle</span>
                  </label>
                  {availableAdvisors.map(advisor => (
                    <label key={advisor} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={selectedAdvisors.includes(advisor)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAdvisors([...selectedAdvisors, advisor]);
                          } else {
                            setSelectedAdvisors(selectedAdvisors.filter(a => a !== advisor));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{advisor}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Stats - basierend auf gefilterten Daten */}
            <div className="stats-grid" style={{ marginBottom: '20px' }}>
              <div className="stat-card metric-card">
                <div className="metric-label">Geplant (Calendly)</div>
                <div className="metric-value" style={{ color: '#4a90e2' }}>
                  {filteredStats.planned}
                </div>
              </div>
              <div className="stat-card metric-card">
                <div className="metric-label">Dokumentiert</div>
                <div className="metric-value" style={{ color: '#0ea66e' }}>
                  {filteredStats.documented}
                </div>
              </div>
              <div className="stat-card metric-card">
                <div className="metric-label">Completion</div>
                <div className="metric-value" style={{ 
                  color: filteredStats.completion < 80 ? '#dc2626' : filteredStats.completion < 100 ? '#e3a008' : '#0ea66e' 
                }}>
                  {filteredStats.completion}%
                </div>
              </div>
            </div>

            {/* Results Breakdown */}
            <ResultsBreakdown results={results} type={type} />

            {/* Detail Table */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                Alle Termine im Detail {selectedAdvisors.length > 0 && `(${selectedAdvisors.length} Berater ausgewählt)`}
              </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase' 
                  }}>
                    Datum
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase' 
                  }}>
                    Kunde
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase' 
                  }}>
                    Berater
                  </th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase' 
                  }}>
                    Calendly Status
                  </th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase' 
                  }}>
                    Activity Result
                  </th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase' 
                  }}>
                    Match Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMergedData.map((item, idx) => {
                  const eventDate = new Date(item.start_time);
                  const isPast = eventDate < new Date();
                  
                  return (
                    <tr 
                      key={idx}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: item.matchStatus === 'missing' && isPast
                          ? 'rgba(220, 38, 38, 0.05)'
                          : item.matchStatus === 'matched'
                          ? 'rgba(14, 166, 110, 0.05)'
                          : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {eventDate.toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {item.invitee_name || item.lead_name || '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {item.host_name || '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: item.status === 'active' 
                            ? 'rgba(14, 166, 110, 0.1)' 
                            : 'rgba(220, 38, 38, 0.1)',
                          color: item.status === 'active' ? '#0ea66e' : '#dc2626'
                        }}>
                          {item.status === 'active' ? 'Aktiv' : 'Abgesagt'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.activityResult ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: 'rgba(74, 144, 226, 0.1)',
                            color: '#4a90e2'
                          }}>
                            {item.activityResult}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: item.matchStatus === 'matched'
                            ? 'rgba(14, 166, 110, 0.1)'
                            : item.matchStatus === 'missing'
                            ? 'rgba(220, 38, 38, 0.1)'
                            : 'rgba(227, 160, 8, 0.1)',
                          color: item.matchStatus === 'matched'
                            ? '#0ea66e'
                            : item.matchStatus === 'missing'
                            ? '#dc2626'
                            : '#e3a008'
                        }}>
                          {item.matchStatus === 'matched' ? '✅ Matched' : 
                           item.matchStatus === 'missing' ? '❌ Fehlt' : 
                           '⏳ Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentTypeDetail;

