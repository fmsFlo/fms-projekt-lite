import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import KeyMetrics from './KeyMetrics';
import CallStatsChart from './CallStatsChart';
import OutcomesChart from './OutcomesChart';
import BestTimeChart from './BestTimeChart';
import DurationStats from './DurationStats';
import ConversionFunnel from './ConversionFunnel';
import QualificationStats from './QualificationStats';
import ResponseTimeStats from './ResponseTimeStats';
import { 
  fetchCallStats, 
  fetchOutcomes, 
  fetchBestTime, 
  fetchDuration,
  fetchUnassignedCalls,
  fetchFunnelStats,
  fetchQualificationStats,
  fetchResponseTime
} from '../services/api';

const CallsDashboard = ({ selectedUser, startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [callStats, setCallStats] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [bestTime, setBestTime] = useState([]);
  const [duration, setDuration] = useState(null);
  const [unassignedCalls, setUnassignedCalls] = useState(0);
  const [funnelStats, setFunnelStats] = useState(null);
  const [qualificationStats, setQualificationStats] = useState(null);
  const [responseTimeStats, setResponseTimeStats] = useState(null);

  useEffect(() => {
    loadAllData();
  }, [selectedUser, startDate, endDate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        ...(selectedUser && { userId: selectedUser })
      };

      const [statsData, outcomesData, bestTimeData, durationData, unassignedData, funnelData, qualificationData, responseTimeData] = await Promise.all([
        fetchCallStats({ ...params, period: 'day' }),
        fetchOutcomes(params),
        fetchBestTime(params),
        fetchDuration(params),
        fetchUnassignedCalls(params),
        fetchFunnelStats(params),
        fetchQualificationStats(params),
        fetchResponseTime(params)
      ]);

      setCallStats(statsData);
      setOutcomes(outcomesData);
      setBestTime(bestTimeData);
      setDuration(durationData);
      setUnassignedCalls(unassignedData?.unassignedCalls || 0);
      setFunnelStats(funnelData);
      setQualificationStats(qualificationData);
      setResponseTimeStats(responseTimeData);
    } catch (error) {
      console.error('[Dashboard] Fehler beim Laden der Dashboard-Daten:', error);
      console.error('[Dashboard] Error details:', {
        message: error.message,
        stack: error.stack
      });
      // Setze leere Daten bei Fehler, damit Dashboard nicht komplett leer ist
      setCallStats([]);
      setOutcomes([]);
      setBestTime([]);
      setDuration(null);
      setUnassignedCalls(0);
      setFunnelStats(null);
      setQualificationStats(null);
      setResponseTimeStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 Min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes} Min`;
    }
    return `${minutes} Min`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>Lade Dashboard-Daten...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Unassigned Warning */}
      {unassignedCalls > 0 && (
        <div className="unassigned-warning">
          <span>⚠️ {unassignedCalls} Call{unassignedCalls !== 1 ? 's' : ''} ohne zugeordneten Berater</span>
        </div>
      )}

      {/* Key Metrics Row - Hero Section */}
      <KeyMetrics funnelStats={funnelStats} callStats={callStats} />

      {/* Conversion Funnel - Compact Horizontal */}
      <div className="stat-card full-width conversion-card">
        <ConversionFunnel data={funnelStats} />
      </div>

      {/* Charts Grid - 2x2 */}
      <div className="stats-grid">
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
          <ResponseTimeStats data={responseTimeStats} selectedUser={selectedUser} compact />
        </div>
      </div>

      {/* Vorqualifizierung - Compact Grid */}
      <div className="stat-card full-width metrics-card">
        <QualificationStats data={qualificationStats} compact />
      </div>

      {/* Gesprächszeiten - Full Width */}
      <div className="stat-card full-width compact-card">
        <DurationStats data={duration} formatDuration={formatDuration} compact />
      </div>
    </div>
  );
};

export default CallsDashboard;
