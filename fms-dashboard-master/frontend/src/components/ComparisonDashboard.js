import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { fetchCalendlyComparison } from '../services/api';

const ComparisonDashboard = ({ selectedUser, startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState([]);

  useEffect(() => {
    loadData();
  }, [selectedUser, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        ...(selectedUser && { userId: selectedUser })
      };

      const data = await fetchCalendlyComparison(params);
      setComparison(data || []);
    } catch (error) {
      console.error('[ComparisonDashboard] Fehler beim Laden:', error);
      setComparison([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>Lade Vergleichsdaten...</p>
      </div>
    );
  }

  const formatType = (type) => {
    const types = {
      erstgespraech: 'Erstgespräch',
      konzept: 'Konzept',
      umsetzung: 'Umsetzung',
      service: 'Service',
      sonstiges: 'Sonstiges'
    };
    return types[type] || type;
  };

  const chartData = comparison
    .filter(item => item.close.planned > 0 || item.calendly.booked > 0)
    .map(item => ({
      type: formatType(item.appointmentType),
      'Close (Geplant)': item.close.planned,
      'Calendly (Gebucht)': item.calendly.booked,
      'Match-Rate': item.matchRate
    }));

  const getMatchRateColor = (rate) => {
    if (rate >= 80) return '#0ea66e';
    if (rate >= 50) return '#e3a008';
    return '#dc2626';
  };

  return (
    <div className="dashboard">
      {/* Key Metrics */}
      <div className="stats-grid">
        {comparison
          .filter(item => item.close.planned > 0 || item.calendly.booked > 0)
          .map((item, index) => (
            <div key={index} className="stat-card metric-card">
              <div className="metric-label">{formatType(item.appointmentType).toUpperCase()}</div>
              <div className="metric-value">{item.matchRate}%</div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                Match-Rate
              </div>
              <div style={{ 
                marginTop: '8px', 
                fontSize: '11px', 
                color: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                gap: '12px'
              }}>
                <span>Close: {item.close.planned}</span>
                <span>Calendly: {item.calendly.booked}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Comparison Chart */}
      {chartData.length > 0 && (
        <div className="stat-card chart-card full-width">
          <h2>Vergleich: Close vs. Calendly</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="type" 
                stroke="rgba(255, 255, 255, 0.4)"
                style={{ fontSize: '11px' }}
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
              <Bar dataKey="Close (Geplant)" fill="#4a90e2" name="Close (Geplant)" />
              <Bar dataKey="Calendly (Gebucht)" fill="#0ea66e" name="Calendly (Gebucht)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Table */}
      <div className="stat-card full-width">
        <h2>Detaillierter Vergleich</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Typ</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Close: Geplant</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Close: Durchgeführt</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Calendly: Gebucht</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Match-Rate</th>
              </tr>
            </thead>
            <tbody>
              {comparison
                .filter(item => item.close.planned > 0 || item.calendly.booked > 0)
                .map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}>
                      {formatType(item.appointmentType)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{item.close.planned}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{item.close.completed}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{item.calendly.booked}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: `${getMatchRateColor(item.matchRate)}20`,
                        color: getMatchRateColor(item.matchRate)
                      }}>
                        {item.matchRate}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="stat-card full-width">
        <h2>Insights & Empfehlungen</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comparison
            .filter(item => item.close.planned > 0 || item.calendly.booked > 0)
            .map((item, index) => {
              const insights = [];
              if (item.matchRate >= 80) {
                insights.push(`✅ ${formatType(item.appointmentType)}: Exzellente Dokumentations-Qualität!`);
              } else if (item.matchRate >= 50) {
                insights.push(`⚠️ ${formatType(item.appointmentType)}: Gute Dokumentation, aber Verbesserungspotenzial.`);
              } else if (item.matchRate > 0) {
                insights.push(`❌ ${formatType(item.appointmentType)}: Niedrige Match-Rate - Prozess prüfen!`);
              }
              
              if (item.calendly.booked > item.close.planned) {
                insights.push(`ℹ️ ${formatType(item.appointmentType)}: Mehr Calendly-Termine als Close-Einträge - möglicherweise direkte Buchungen.`);
              }

              return insights.length > 0 ? (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}>
                  {insights.map((insight, i) => (
                    <div key={i} style={{ marginBottom: i < insights.length - 1 ? '8px' : '0' }}>
                      {insight}
                    </div>
                  ))}
                </div>
              ) : null;
            })}
        </div>
      </div>
    </div>
  );
};

export default ComparisonDashboard;

